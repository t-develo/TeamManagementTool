"""
cost_service のユニットテスト。

テスト設計方針（t_wada ベストプラクティス）:
- データベース・外部 I/O に依存しない純粋関数を対象にする
- テスト名はふるまいの仕様として読める日本語にする
- AAA（Arrange / Act / Assert）パターンを明示的に分離する
- 1 テスト 1 アサーション（原則）
- MagicMock / AsyncMock でインフラ依存を切り離す
"""
import pytest
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

from app.services import cost_service
from app.services.cost_service import calc_budget_vs_actual, calc_task_cost, count_working_days
from app.schemas.cost import ProjectCostResponse


# ---------------------------------------------------------------------------
# count_working_days
# ---------------------------------------------------------------------------

class TestCountWorkingDays:
    """count_working_days: 稼働日数（月〜金）を正しく算出する"""

    def test_月曜日1日だけ指定したとき1を返す(self):
        # 2024-01-01 は月曜日
        assert count_working_days(date(2024, 1, 1), date(2024, 1, 1)) == 1

    def test_月曜から金曜を指定したとき5を返す(self):
        assert count_working_days(date(2024, 1, 1), date(2024, 1, 5)) == 5

    def test_土曜から日曜を指定したとき0を返す(self):
        # 2024-01-06 土曜 / 2024-01-07 日曜
        assert count_working_days(date(2024, 1, 6), date(2024, 1, 7)) == 0

    def test_開始日が終了日より後のとき0を返す(self):
        assert count_working_days(date(2024, 1, 5), date(2024, 1, 1)) == 0

    def test_月曜から翌週月曜を指定したとき6を返す(self):
        # 月火水木金（5）+ 翌月曜（1）= 6
        assert count_working_days(date(2024, 1, 1), date(2024, 1, 8)) == 6

    def test_2週間分を指定したとき10を返す(self):
        # 2024-01-01(月) 〜 2024-01-14(日): 月〜金が 2 週 = 10 稼働日
        assert count_working_days(date(2024, 1, 1), date(2024, 1, 14)) == 10

    def test_月をまたいでも正しく稼働日を返す(self):
        # 2024-01-29(月) 〜 2024-02-02(金) = 5 稼働日
        assert count_working_days(date(2024, 1, 29), date(2024, 2, 2)) == 5

    def test_開始日と終了日が同じ日曜日のとき0を返す(self):
        # 2024-01-07 は日曜日
        assert count_working_days(date(2024, 1, 7), date(2024, 1, 7)) == 0


# ---------------------------------------------------------------------------
# calc_task_cost
# ---------------------------------------------------------------------------

class TestCalcTaskCost:
    """calc_task_cost: メンバー月単価と人日からタスクコストを計算する"""

    async def test_月60万円で5人日のとき15万円を返す(self):
        # Arrange
        member = MagicMock()
        member.cost_per_month = 60.0  # 万円/月

        task = MagicMock()
        task.man_days = 5.0

        # Act
        cost = await calc_task_cost(task, member)

        # Assert: 60 / 20 * 5 = 15.0
        assert cost == 15.0

    async def test_月80万円で10人日のとき40万円を返す(self):
        # Arrange
        member = MagicMock()
        member.cost_per_month = 80.0

        task = MagicMock()
        task.man_days = 10.0

        # Act
        cost = await calc_task_cost(task, member)

        # Assert: 80 / 20 * 10 = 40.0
        assert cost == 40.0

    async def test_計算結果は小数点2桁で丸める(self):
        # Arrange: 70 / 20 * 3 = 10.5（きれいに割り切れる例）
        member = MagicMock()
        member.cost_per_month = 70.0

        task = MagicMock()
        task.man_days = 3.0

        # Act
        cost = await calc_task_cost(task, member)

        # Assert
        assert cost == 10.5

    async def test_人日が0のときコスト0を返す(self):
        # Arrange
        member = MagicMock()
        member.cost_per_month = 60.0

        task = MagicMock()
        task.man_days = 0.0

        # Act
        cost = await calc_task_cost(task, member)

        # Assert
        assert cost == 0.0

    async def test_返り値の型はfloatである(self):
        # Arrange
        member = MagicMock()
        member.cost_per_month = 60.0

        task = MagicMock()
        task.man_days = 5.0

        # Act
        cost = await calc_task_cost(task, member)

        # Assert
        assert isinstance(cost, float)


# ---------------------------------------------------------------------------
# calc_budget_vs_actual — 予算消化ステータスの判定ロジック
# ---------------------------------------------------------------------------

def _make_project(budget: float) -> MagicMock:
    """テスト用プロジェクトモックを生成する"""
    project = MagicMock()
    project.budget = budget
    project.id = "507f1f77bcf86cd799439011"
    project.name = "テストプロジェクト"
    return project


def _make_cost_response(actual_cost: float, budget: float) -> ProjectCostResponse:
    """テスト用コストレスポンスを生成する"""
    return ProjectCostResponse(
        project_id="507f1f77bcf86cd799439011",
        project_name="テストプロジェクト",
        budget=budget,
        actual_cost=actual_cost,
        remaining_budget=budget - actual_cost,
        task_costs=[],
    )


class TestBudgetStatus:
    """calc_budget_vs_actual: 予算消化率に応じてステータスを正しく判定する"""

    async def test_実績コストが予算ちょうどのときover_budgetを返す(self):
        # Arrange
        project = _make_project(budget=100.0)
        cost_response = _make_cost_response(actual_cost=100.0, budget=100.0)

        # Act
        with patch.object(cost_service, "calc_project_cost", AsyncMock(return_value=cost_response)):
            result = await calc_budget_vs_actual(project)

        # Assert
        assert result.status == "over_budget"

    async def test_実績コストが予算を超えたときover_budgetを返す(self):
        # Arrange
        project = _make_project(budget=100.0)
        cost_response = _make_cost_response(actual_cost=120.0, budget=100.0)

        # Act
        with patch.object(cost_service, "calc_project_cost", AsyncMock(return_value=cost_response)):
            result = await calc_budget_vs_actual(project)

        # Assert
        assert result.status == "over_budget"

    async def test_実績コストが予算の80パーセントのときwarningを返す(self):
        # Arrange
        project = _make_project(budget=100.0)
        cost_response = _make_cost_response(actual_cost=80.0, budget=100.0)

        # Act
        with patch.object(cost_service, "calc_project_cost", AsyncMock(return_value=cost_response)):
            result = await calc_budget_vs_actual(project)

        # Assert
        assert result.status == "warning"

    async def test_実績コストが予算の80パーセント未満のときon_trackを返す(self):
        # Arrange
        project = _make_project(budget=100.0)
        cost_response = _make_cost_response(actual_cost=79.0, budget=100.0)

        # Act
        with patch.object(cost_service, "calc_project_cost", AsyncMock(return_value=cost_response)):
            result = await calc_budget_vs_actual(project)

        # Assert
        assert result.status == "on_track"

    async def test_予算が0のときrate0としてon_trackを返す(self):
        # Arrange
        project = _make_project(budget=0.0)
        cost_response = _make_cost_response(actual_cost=0.0, budget=0.0)

        # Act
        with patch.object(cost_service, "calc_project_cost", AsyncMock(return_value=cost_response)):
            result = await calc_budget_vs_actual(project)

        # Assert
        assert result.status == "on_track"

    async def test_予算消化率が正しく計算されて返される(self):
        # Arrange: 50% 消化
        project = _make_project(budget=200.0)
        cost_response = _make_cost_response(actual_cost=100.0, budget=200.0)

        # Act
        with patch.object(cost_service, "calc_project_cost", AsyncMock(return_value=cost_response)):
            result = await calc_budget_vs_actual(project)

        # Assert
        assert result.budget_consumption_rate == 50.0
