## 2. バックエンド詳細設計

---

### 2.1 データモデル定義

#### 2.1.1 User モデル

コレクション名: `users`

```python
from datetime import datetime
from typing import Literal

from beanie import Document, Indexed
from pydantic import EmailStr, Field, field_validator


class User(Document):
    """ユーザー認証・認可モデル"""

    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    name: str = Field(..., min_length=1, max_length=100)
    role: Literal["admin", "manager", "member"] = Field(default="member")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()

    class Settings:
        name = "users"
```

| フィールド | 型 | 制約 | デフォルト | 説明 |
|---|---|---|---|---|
| `_id` | `PydanticObjectId` | Primary Key | 自動生成 | MongoDB ObjectId |
| `email` | `EmailStr` | unique, indexed | - | ログイン用メールアドレス |
| `hashed_password` | `str` | - | - | bcryptハッシュ済みパスワード |
| `name` | `str` | 1-100文字, 空白不可 | - | 表示名 |
| `role` | `Literal["admin","manager","member"]` | enum制約 | `"member"` | システムロール |
| `is_active` | `bool` | - | `True` | 有効フラグ |
| `created_at` | `datetime` | - | `utcnow()` | 作成日時(UTC) |
| `updated_at` | `datetime` | - | `utcnow()` | 更新日時(UTC) |

---

#### 2.1.2 Member モデル

コレクション名: `members`

```python
import re
from datetime import datetime

from beanie import Document, Indexed
from pydantic import EmailStr, Field, field_validator


class Member(Document):
    """チームメンバー（コスト管理対象）モデル"""

    name: str = Field(..., min_length=1, max_length=100)
    email: Indexed(EmailStr, unique=True)
    department: str = Field(..., min_length=1, max_length=50)
    role: str = Field(..., min_length=1, max_length=50)
    cost_per_month: float = Field(..., ge=0.1, le=999.9, description="万円/月")
    avatar_color: str = Field(..., description="HEXカラーコード (#XXXXXX)")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()

    @field_validator("avatar_color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("avatar_color must be a valid hex color (#XXXXXX)")
        return v.upper()

    @field_validator("cost_per_month")
    @classmethod
    def round_cost(cls, v: float) -> float:
        return round(v, 1)

    class Settings:
        name = "members"
```

| フィールド | 型 | 制約 | デフォルト | 説明 |
|---|---|---|---|---|
| `_id` | `PydanticObjectId` | Primary Key | 自動生成 | MongoDB ObjectId |
| `name` | `str` | 1-100文字, 空白不可 | - | 氏名 |
| `email` | `EmailStr` | unique, indexed | - | メールアドレス |
| `department` | `str` | 1-50文字 | - | 部署名 |
| `role` | `str` | 1-50文字 | - | 役割（開発者/デザイナー/PM等） |
| `cost_per_month` | `float` | 0.1-999.9 | - | 人月単価（万円） |
| `avatar_color` | `str` | `#XXXXXX`形式 | - | アバター背景色 |
| `is_active` | `bool` | - | `True` | 有効フラグ（論理削除用） |
| `created_at` | `datetime` | - | `utcnow()` | 作成日時(UTC) |
| `updated_at` | `datetime` | - | `utcnow()` | 更新日時(UTC) |

---

#### 2.1.3 Task モデル（埋め込みサブドキュメント）

```python
from datetime import date
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class Task(BaseModel):
    """タスク（Projectドキュメントに埋め込み）"""

    task_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = Field(..., min_length=1, max_length=100)
    assignee_id: str = Field(..., description="Member._id への参照文字列")
    man_days: float = Field(..., ge=0.5, le=999.0)
    progress: int = Field(default=0, ge=0, le=100)
    start_date: date
    end_date: date
    sort_order: int = Field(default=0, ge=0)
    status: Literal["not_started", "in_progress", "completed"] = Field(
        default="not_started"
    )

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be blank")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v

    @field_validator("man_days")
    @classmethod
    def round_man_days(cls, v: float) -> float:
        return round(v, 1)
```

| フィールド | 型 | 制約 | デフォルト | 説明 |
|---|---|---|---|---|
| `task_id` | `str` | UUID4形式 | `uuid4()` | タスク識別子 |
| `title` | `str` | 1-100文字, 空白不可 | - | タスク名 |
| `assignee_id` | `str` | Member._id参照 | - | 担当者ID |
| `man_days` | `float` | 0.5-999.0 | - | 工数（人日） |
| `progress` | `int` | 0-100 | `0` | 進捗率(%) |
| `start_date` | `date` | - | - | 開始日 |
| `end_date` | `date` | `> start_date` | - | 終了日 |
| `sort_order` | `int` | `>= 0` | `0` | ガントチャート表示順 |
| `status` | `Literal[...]` | enum制約 | `"not_started"` | ステータス |

---

#### 2.1.4 Project モデル

コレクション名: `projects`

```python
from datetime import date, datetime
from typing import List, Literal

from beanie import Document
from pydantic import Field, field_validator


class Project(Document):
    """プロジェクトモデル（タスクを埋め込みで保持）"""

    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    budget: float = Field(..., ge=0.1, le=99999.9, description="万円")
    status: Literal["planning", "active", "completed", "on_hold"] = Field(
        default="planning"
    )
    start_date: date
    end_date: date
    tasks: List[Task] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v

    @field_validator("budget")
    @classmethod
    def round_budget(cls, v: float) -> float:
        return round(v, 1)

    class Settings:
        name = "projects"
```

| フィールド | 型 | 制約 | デフォルト | 説明 |
|---|---|---|---|---|
| `_id` | `PydanticObjectId` | Primary Key | 自動生成 | MongoDB ObjectId |
| `name` | `str` | 1-100文字, 空白不可 | - | プロジェクト名 |
| `description` | `str` | 最大500文字 | `""` | 説明文 |
| `budget` | `float` | 0.1-99999.9 | - | 予算（万円） |
| `status` | `Literal[...]` | enum制約 | `"planning"` | ステータス |
| `start_date` | `date` | - | - | 開始日 |
| `end_date` | `date` | `> start_date` | - | 終了日 |
| `tasks` | `List[Task]` | 埋め込み | `[]` | タスク一覧 |
| `created_at` | `datetime` | - | `utcnow()` | 作成日時(UTC) |
| `updated_at` | `datetime` | - | `utcnow()` | 更新日時(UTC) |

#### モデル間リレーション

```
User (users)          認証専用。Member とは独立。
  |
  +-- role で権限制御

Member (members)      コスト管理対象のチームメンバー。
  ^
  |  参照 (assignee_id = str(Member._id))
  |
Task (embedded)       Project ドキュメント内に埋め込み。
  |
  +-- Project.tasks[] として保持

Project (projects)    タスクを埋め込みドキュメントとして保持。
```

---

### 2.2 リクエスト/レスポンススキーマ

#### 2.2.1 共通スキーマ

```python
from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """ページネーション付きリストレスポンス"""

    items: List[T]
    total: int = Field(..., ge=0, description="総件数")
    page: int = Field(..., ge=1, description="現在のページ番号")
    per_page: int = Field(..., ge=1, le=100, description="1ページあたりの件数")
```

```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

---

#### 2.2.2 認証スキーマ

```python
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)
    role: Literal["admin", "manager", "member"] = Field(default="member")


class UserResponse(BaseModel):
    id: str = Field(..., description="ObjectId 文字列")
    email: EmailStr
    name: str
    role: Literal["admin", "manager", "member"]
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

リクエスト例（POST `/api/auth/login`）:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

レスポンス例:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

#### 2.2.3 メンバースキーマ

```python
import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class MemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    department: str = Field(..., min_length=1, max_length=50)
    role: str = Field(..., min_length=1, max_length=50)
    cost_per_month: float = Field(..., ge=0.1, le=999.9)
    avatar_color: str = Field(..., description="#XXXXXX形式")

    @field_validator("avatar_color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("avatar_color must be a valid hex color (#XXXXXX)")
        return v.upper()


class MemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[str] = Field(None, min_length=1, max_length=50)
    cost_per_month: Optional[float] = Field(None, ge=0.1, le=999.9)
    avatar_color: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("avatar_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("avatar_color must be a valid hex color (#XXXXXX)")
        return v.upper() if v else v


class MemberResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    department: str
    role: str
    cost_per_month: float
    avatar_color: str
    is_active: bool
    utilization: Optional[float] = Field(
        None, description="当月稼働率(%)。一覧取得時に算出"
    )
    created_at: datetime
    updated_at: datetime


class MemberUtilizationResponse(BaseModel):
    member_id: str
    member_name: str
    year: int
    month: int
    total_working_days: float = Field(..., description="月内合計アサイン人日")
    utilization_percent: float = Field(..., description="稼働率(%)")
    task_details: List["UtilizationTaskDetail"]


class UtilizationTaskDetail(BaseModel):
    task_id: str
    task_title: str
    project_name: str
    man_days: float
    working_days_in_month: float = Field(
        ..., description="対象月内の実働日数（按分）"
    )
    contribution: float = Field(..., description="対象月への人日寄与")
```

レスポンス例（GET `/api/members/{id}/utilization?year=2026&month=2`）:

```json
{
  "member_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "member_name": "田中太郎",
  "year": 2026,
  "month": 2,
  "total_working_days": 12.5,
  "utilization_percent": 62.5,
  "task_details": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "task_title": "API設計",
      "project_name": "TeamBoard開発",
      "man_days": 10.0,
      "working_days_in_month": 8.0,
      "contribution": 8.0
    }
  ]
}
```

---

#### 2.2.4 プロジェクトスキーマ

```python
from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    budget: float = Field(..., ge=0.1, le=99999.9)
    status: Literal["planning", "active", "completed", "on_hold"] = "planning"
    start_date: date
    end_date: date

    @field_validator("end_date")
    @classmethod
    def end_date_after_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    budget: Optional[float] = Field(None, ge=0.1, le=99999.9)
    status: Optional[Literal["planning", "active", "completed", "on_hold"]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TaskResponse(BaseModel):
    task_id: str
    title: str
    assignee_id: str
    assignee_name: Optional[str] = None
    man_days: float
    progress: int
    start_date: date
    end_date: date
    sort_order: int
    status: Literal["not_started", "in_progress", "completed"]
    cost: Optional[float] = Field(None, description="タスクコスト（万円）")


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    budget: float
    status: Literal["planning", "active", "completed", "on_hold"]
    start_date: date
    end_date: date
    tasks: List[TaskResponse] = []
    actual_cost: Optional[float] = Field(
        None, description="実績コスト合計（万円）。算出値"
    )
    progress: Optional[float] = Field(
        None, description="全体進捗率(%)。タスク進捗の加重平均"
    )
    created_at: datetime
    updated_at: datetime
```

レスポンス例（GET `/api/projects/{id}`）:

```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d2",
  "name": "TeamBoard開発",
  "description": "チーム管理ツールの開発プロジェクト",
  "budget": 500.0,
  "status": "active",
  "start_date": "2026-01-06",
  "end_date": "2026-06-30",
  "tasks": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "API設計",
      "assignee_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "assignee_name": "田中太郎",
      "man_days": 10.0,
      "progress": 80,
      "start_date": "2026-01-06",
      "end_date": "2026-01-24",
      "sort_order": 0,
      "status": "in_progress",
      "cost": 3.5
    }
  ],
  "actual_cost": 125.5,
  "progress": 45.0,
  "created_at": "2026-01-01T00:00:00",
  "updated_at": "2026-02-20T10:30:00"
}
```

---

#### 2.2.5 タスクスキーマ

```python
from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    assignee_id: str
    man_days: float = Field(..., ge=0.5, le=999.0)
    start_date: date
    end_date: date
    status: Literal["not_started", "in_progress", "completed"] = "not_started"
    progress: int = Field(default=0, ge=0, le=100)
    sort_order: int = Field(default=0, ge=0)

    @field_validator("end_date")
    @classmethod
    def end_date_after_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    assignee_id: Optional[str] = None
    man_days: Optional[float] = Field(None, ge=0.5, le=999.0)
    progress: Optional[int] = Field(None, ge=0, le=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sort_order: Optional[int] = Field(None, ge=0)
    status: Optional[Literal["not_started", "in_progress", "completed"]] = None


class TaskReorderRequest(BaseModel):
    """タスク並び替えリクエスト"""

    task_orders: List["TaskOrderItem"]


class TaskOrderItem(BaseModel):
    task_id: str
    sort_order: int = Field(..., ge=0)


class TaskAssignRequest(BaseModel):
    """タスクアサインリクエスト"""

    assignee_id: str
```

---

#### 2.2.6 コスト・予算スキーマ

```python
from typing import List

from pydantic import BaseModel, Field


class TaskCostDetail(BaseModel):
    task_id: str
    task_title: str
    assignee_id: str
    assignee_name: str
    man_days: float
    daily_rate: float = Field(..., description="日単価（万円）= cost_per_month / 20")
    cost: float = Field(..., description="タスクコスト（万円）= daily_rate × man_days")


class ProjectCostResponse(BaseModel):
    project_id: str
    project_name: str
    budget: float
    actual_cost: float = Field(..., description="実績コスト合計（万円）")
    remaining_budget: float = Field(..., description="残予算（万円）= budget - actual_cost")
    task_costs: List[TaskCostDetail]


class BudgetVsActualResponse(BaseModel):
    project_id: str
    project_name: str
    budget: float
    actual_cost: float
    budget_consumption_rate: float = Field(
        ..., description="予算消化率(%) = (actual_cost / budget) × 100"
    )
    remaining_budget: float
    status: str = Field(
        ..., description="over_budget / warning / on_track"
    )


class DashboardSummaryResponse(BaseModel):
    total_projects: int
    active_projects: int
    total_members: int
    active_members: int
    total_budget: float = Field(..., description="全プロジェクト予算合計（万円）")
    total_actual_cost: float = Field(..., description="全プロジェクト実績合計（万円）")
    budget_consumption_rate: float = Field(..., description="全体予算消化率(%)")
    project_summaries: List["ProjectSummaryItem"]


class ProjectSummaryItem(BaseModel):
    project_id: str
    project_name: str
    status: str
    progress: float = Field(..., description="全体進捗率(%)")
    budget: float
    actual_cost: float
    budget_consumption_rate: float
```

レスポンス例（GET `/api/dashboard/summary`）:

```json
{
  "total_projects": 3,
  "active_projects": 2,
  "total_members": 5,
  "active_members": 5,
  "total_budget": 1500.0,
  "total_actual_cost": 620.5,
  "budget_consumption_rate": 41.4,
  "project_summaries": [
    {
      "project_id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "project_name": "TeamBoard開発",
      "status": "active",
      "progress": 45.0,
      "budget": 500.0,
      "actual_cost": 250.5,
      "budget_consumption_rate": 50.1
    }
  ]
}
```

---

### 2.3 サービス層 関数定義

#### 2.3.1 auth_service.py

```python
from app.models.user import User
from app.schemas.auth import UserCreate, UserResponse


async def authenticate_user(email: str, password: str) -> User:
    """
    メールアドレスとパスワードでユーザーを認証し、Userオブジェクトを返す。
    パスワード照合は bcrypt.checkpw で行う。

    Raises:
        HTTPException(401): メールアドレスが存在しない、パスワード不一致、
                            またはユーザーが無効(is_active=False)の場合
    """
    ...


async def create_user(data: UserCreate) -> User:
    """
    新規ユーザーを作成する。パスワードを bcrypt でハッシュ化して保存。

    Raises:
        HTTPException(409): 同一メールアドレスのユーザーが既に存在する場合
        HTTPException(422): バリデーションエラー
    """
    ...


async def get_current_user_by_token(token: str) -> User:
    """
    JWTトークンをデコードし、subクレームからユーザーを取得して返す。

    Raises:
        HTTPException(401): トークンが無効、期限切れ、
                            またはユーザーが存在しない場合
    """
    ...
```

---

#### 2.3.2 member_service.py

```python
from typing import List, Optional, Tuple

from app.models.member import Member
from app.schemas.member import (
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    MemberUtilizationResponse,
)


async def list_members(
    search: Optional[str] = None,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Member], int]:
    """
    メンバー一覧を検索・フィルタ・ページネーション付きで取得する。
    searchはname/emailに対する部分一致（正規表現）で検索。
    戻り値は (メンバーリスト, 総件数) のタプル。

    Raises: なし（空リストを返す）
    """
    ...


async def create_member(data: MemberCreate) -> Member:
    """
    新規メンバーを作成して保存する。

    Raises:
        HTTPException(409): 同一メールアドレスのメンバーが既に存在する場合
    """
    ...


async def get_member(member_id: str) -> Member:
    """
    IDを指定してメンバーを1件取得する。

    Raises:
        HTTPException(404): 指定IDのメンバーが存在しない場合
    """
    ...


async def update_member(member_id: str, data: MemberUpdate) -> Member:
    """
    メンバー情報を部分更新する。updated_atを現在時刻に更新。
    dataのNoneでないフィールドのみ更新対象とする。

    Raises:
        HTTPException(404): 指定IDのメンバーが存在しない場合
        HTTPException(409): 変更後のemailが他メンバーと重複する場合
    """
    ...


async def delete_member(member_id: str) -> Member:
    """
    メンバーを論理削除する（is_active=False に設定）。
    物理削除は行わない。

    Raises:
        HTTPException(404): 指定IDのメンバーが存在しない場合
    """
    ...


async def get_member_utilization(
    member_id: str, year: int, month: int
) -> MemberUtilizationResponse:
    """
    指定メンバーの指定年月における稼働率を算出する。
    全プロジェクトのタスクを走査し、assignee_idが一致するタスクについて
    対象月との重複営業日数を計算する。
    詳細な算出ロジックは cost_service.calc_member_monthly_utilization を参照。

    Raises:
        HTTPException(404): 指定IDのメンバーが存在しない場合
    """
    ...
```

---

#### 2.3.3 project_service.py

```python
from typing import List, Optional, Tuple

from app.models.project import Project
from app.schemas.project import (
    DashboardSummaryResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)


async def list_projects(
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Project], int]:
    """
    プロジェクト一覧をステータスフィルタ・ページネーション付きで取得する。
    戻り値は (プロジェクトリスト, 総件数) のタプル。

    Raises: なし（空リストを返す）
    """
    ...


async def create_project(data: ProjectCreate) -> Project:
    """
    新規プロジェクトを作成して保存する。tasksは空リストで初期化。

    Raises:
        HTTPException(422): バリデーションエラー（end_date <= start_date 等）
    """
    ...


async def get_project(project_id: str) -> Project:
    """
    IDを指定してプロジェクトを1件取得する。

    Raises:
        HTTPException(404): 指定IDのプロジェクトが存在しない場合
    """
    ...


async def update_project(project_id: str, data: ProjectUpdate) -> Project:
    """
    プロジェクト情報を部分更新する。updated_atを現在時刻に更新。
    dataのNoneでないフィールドのみ更新対象とする。

    Raises:
        HTTPException(404): 指定IDのプロジェクトが存在しない場合
        HTTPException(422): end_date <= start_date となる場合
    """
    ...


async def delete_project(project_id: str) -> None:
    """
    プロジェクトを物理削除する。

    Raises:
        HTTPException(404): 指定IDのプロジェクトが存在しない場合
    """
    ...


async def get_dashboard_summary() -> DashboardSummaryResponse:
    """
    ダッシュボード用サマリーを算出して返す。
    全プロジェクトの予算・実績・進捗を集計する。
    各プロジェクトの actual_cost は cost_service.calc_project_cost で算出。

    Raises: なし
    """
    ...
```

---

#### 2.3.4 task_service.py

```python
from typing import List

from app.models.project import Project
from app.models.task import Task
from app.schemas.task import (
    TaskAssignRequest,
    TaskCreate,
    TaskOrderItem,
    TaskUpdate,
)


async def add_task(project_id: str, data: TaskCreate) -> Task:
    """
    プロジェクトにタスクを追加する。task_idはUUID4で自動生成。
    sort_orderが未指定の場合、既存タスクの最大値+1を設定。
    追加後、プロジェクトのupdated_atを更新。

    Raises:
        HTTPException(404): 指定プロジェクトが存在しない場合
        HTTPException(404): assignee_idに該当するメンバーが存在しない場合
        HTTPException(422): end_date <= start_date の場合
    """
    ...


async def update_task(project_id: str, task_id: str, data: TaskUpdate) -> Task:
    """
    タスク情報を部分更新する。dataのNoneでないフィールドのみ更新。
    更新後、プロジェクトのupdated_atを更新。

    Raises:
        HTTPException(404): 指定プロジェクトまたはタスクが存在しない場合
        HTTPException(404): 変更後のassignee_idに該当するメンバーが存在しない場合
        HTTPException(422): end_date <= start_date となる場合
    """
    ...


async def delete_task(project_id: str, task_id: str) -> None:
    """
    プロジェクトからタスクを削除する。
    削除後、プロジェクトのupdated_atを更新。

    Raises:
        HTTPException(404): 指定プロジェクトまたはタスクが存在しない場合
    """
    ...


async def reorder_tasks(project_id: str, task_orders: List[TaskOrderItem]) -> List[Task]:
    """
    タスクの表示順序を一括更新する。
    task_ordersに含まれる各task_idのsort_orderを更新。
    更新後、プロジェクトのupdated_atを更新。

    Raises:
        HTTPException(404): 指定プロジェクトが存在しない場合
        HTTPException(400): task_ordersに存在しないtask_idが含まれる場合
    """
    ...


async def assign_task(project_id: str, task_id: str, data: TaskAssignRequest) -> Task:
    """
    タスクの担当者を変更する。
    更新後、プロジェクトのupdated_atを更新。

    Raises:
        HTTPException(404): 指定プロジェクトまたはタスクが存在しない場合
        HTTPException(404): assignee_idに該当するメンバーが存在しない場合
    """
    ...
```

---

#### 2.3.5 cost_service.py

```python
from datetime import date
from typing import List, Tuple

from app.models.member import Member
from app.models.project import Project
from app.models.task import Task
from app.schemas.cost import (
    BudgetVsActualResponse,
    ProjectCostResponse,
    TaskCostDetail,
)
from app.schemas.member import MemberUtilizationResponse, UtilizationTaskDetail


async def calc_task_cost(task: Task, member: Member) -> float:
    """
    タスクコストを算出する。

    計算式:
        daily_rate = member.cost_per_month / 20
        task_cost  = daily_rate × task.man_days

    戻り値: タスクコスト（万円）。小数第2位で丸め。

    Raises: なし
    """
    ...


async def calc_project_cost(project: Project) -> ProjectCostResponse:
    """
    プロジェクト全タスクのコストを算出し、集計結果を返す。

    計算式:
        actual_cost     = Σ( calc_task_cost(task, member) for task in project.tasks )
        remaining_budget = project.budget - actual_cost

    各タスクの担当者(Member)をDBから取得し、daily_rateを算出する。
    担当者が見つからないタスクはコスト0として扱う。

    Raises:
        HTTPException(404): 指定プロジェクトが存在しない場合
    """
    ...


async def calc_budget_vs_actual(project: Project) -> BudgetVsActualResponse:
    """
    プロジェクトの予算対実績を算出する。

    計算式:
        budget_consumption_rate = (actual_cost / budget) × 100

    status判定:
        - budget_consumption_rate >= 100 → "over_budget"
        - budget_consumption_rate >= 80  → "warning"
        - それ以外                       → "on_track"

    Raises:
        HTTPException(404): 指定プロジェクトが存在しない場合
    """
    ...


async def calc_member_monthly_utilization(
    member: Member, year: int, month: int
) -> MemberUtilizationResponse:
    """
    指定メンバーの指定年月における月間稼働率を算出する。

    算出ロジック:
        1. 全プロジェクトからassignee_idが一致するタスクを収集
        2. 各タスクについて:
            a. タスク期間全体の営業日数を算出: total_task_working_days
            b. タスク期間と対象月の重複期間を算出: overlap_start, overlap_end
            c. 重複期間内の営業日数を算出: working_days_in_month
            d. 日あたり工数を算出: task_daily_rate = task.man_days / total_task_working_days
            e. 対象月への寄与を算出: contribution = task_daily_rate × working_days_in_month
        3. 合計寄与を算出: total_contribution = Σ(contribution)
        4. 稼働率を算出: utilization = (total_contribution / 20) × 100

    営業日数の算出: 土日を除いた日数（祝日は考慮しない）

    Raises: なし
    """
    ...


def count_working_days(start: date, end: date) -> int:
    """
    start〜end（両端含む）の営業日数（土日除外）を返す。

    Raises: なし（start > end の場合は 0 を返す）
    """
    ...
```

**コスト計算の数式まとめ:**

| 算出項目 | 計算式 | 単位 |
|---|---|---|
| 日単価 | `daily_rate = cost_per_month / 20` | 万円/日 |
| タスクコスト | `task_cost = daily_rate × man_days` | 万円 |
| プロジェクト実績コスト | `actual_cost = Σ(task_cost for each task)` | 万円 |
| 残予算 | `remaining_budget = budget - actual_cost` | 万円 |
| 予算消化率 | `budget_consumption_rate = (actual_cost / budget) × 100` | % |
| 月間稼働率 | `utilization = (Σ contributions / 20) × 100` | % |
| タスク日あたり工数 | `task_daily_rate = man_days / total_working_days_in_task_range` | 人日/日 |
| 月間寄与 | `contribution = task_daily_rate × working_days_in_overlap` | 人日 |

---

### 2.4 APIエンドポイント詳細

#### 2.4.1 認証 API

| メソッド | パス | 認証 | 必要ロール | リクエスト | レスポンス | ステータスコード |
|---|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | N | - | `LoginRequest` (body) | `LoginResponse` | `200` 成功, `401` 認証失敗, `422` バリデーション |
| `GET` | `/api/auth/me` | Y | 全ロール | - | `UserResponse` | `200` 成功, `401` 未認証 |
| `POST` | `/api/auth/register` | Y | admin | `UserCreate` (body) | `UserResponse` | `201` 作成, `401` 未認証, `403` 権限不足, `409` メール重複, `422` バリデーション |

---

#### 2.4.2 メンバー API

| メソッド | パス | 認証 | 必要ロール | リクエスト | レスポンス | ステータスコード |
|---|---|---|---|---|---|---|
| `GET` | `/api/members` | Y | 全ロール | query: `search?`, `department?`, `is_active?`, `page=1`, `per_page=20` | `PaginatedResponse[MemberResponse]` | `200` 成功, `401` 未認証 |
| `POST` | `/api/members` | Y | admin | `MemberCreate` (body) | `MemberResponse` | `201` 作成, `401` 未認証, `403` 権限不足, `409` メール重複, `422` バリデーション |
| `GET` | `/api/members/{id}` | Y | 全ロール | path: `id` | `MemberResponse` | `200` 成功, `401` 未認証, `404` 未検出 |
| `PUT` | `/api/members/{id}` | Y | admin | path: `id`, `MemberUpdate` (body) | `MemberResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出, `409` メール重複, `422` バリデーション |
| `DELETE` | `/api/members/{id}` | Y | admin | path: `id` | `MemberResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出 |
| `GET` | `/api/members/{id}/utilization` | Y | 全ロール | path: `id`, query: `year`, `month` | `MemberUtilizationResponse` | `200` 成功, `401` 未認証, `404` 未検出, `422` バリデーション |

---

#### 2.4.3 プロジェクト API

| メソッド | パス | 認証 | 必要ロール | リクエスト | レスポンス | ステータスコード |
|---|---|---|---|---|---|---|
| `GET` | `/api/projects` | Y | 全ロール | query: `status?`, `page=1`, `per_page=20` | `PaginatedResponse[ProjectResponse]` | `200` 成功, `401` 未認証 |
| `POST` | `/api/projects` | Y | admin, manager | `ProjectCreate` (body) | `ProjectResponse` | `201` 作成, `401` 未認証, `403` 権限不足, `422` バリデーション |
| `GET` | `/api/projects/{id}` | Y | 全ロール | path: `id` | `ProjectResponse` | `200` 成功, `401` 未認証, `404` 未検出 |
| `PUT` | `/api/projects/{id}` | Y | admin, manager | path: `id`, `ProjectUpdate` (body) | `ProjectResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出, `422` バリデーション |
| `DELETE` | `/api/projects/{id}` | Y | admin | path: `id` | `{"message": "deleted"}` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出 |
| `GET` | `/api/projects/{id}/cost` | Y | admin, manager | path: `id` | `ProjectCostResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出 |
| `GET` | `/api/projects/{id}/budget-vs-actual` | Y | admin, manager | path: `id` | `BudgetVsActualResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出 |

---

#### 2.4.4 タスク API

| メソッド | パス | 認証 | 必要ロール | リクエスト | レスポンス | ステータスコード |
|---|---|---|---|---|---|---|
| `POST` | `/api/projects/{id}/tasks` | Y | admin, manager | path: `id`, `TaskCreate` (body) | `TaskResponse` | `201` 作成, `401` 未認証, `403` 権限不足, `404` プロジェクト/メンバー未検出, `422` バリデーション |
| `PUT` | `/api/projects/{id}/tasks/{task_id}` | Y | admin, manager, member※ | path: `id`, `task_id`, `TaskUpdate` (body) | `TaskResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出, `422` バリデーション |
| `DELETE` | `/api/projects/{id}/tasks/{task_id}` | Y | admin, manager | path: `id`, `task_id` | `{"message": "deleted"}` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出 |
| `PUT` | `/api/projects/{id}/tasks/reorder` | Y | admin, manager | path: `id`, `TaskReorderRequest` (body) | `List[TaskResponse]` | `200` 成功, `401` 未認証, `403` 権限不足, `400` 不正なtask_id, `404` プロジェクト未検出 |
| `PUT` | `/api/projects/{id}/tasks/{task_id}/assign` | Y | admin, manager | path: `id`, `task_id`, `TaskAssignRequest` (body) | `TaskResponse` | `200` 成功, `401` 未認証, `403` 権限不足, `404` 未検出 |

> ※ memberロールは自身がアサインされたタスクの`progress`と`status`のみ更新可能

---

#### 2.4.5 ダッシュボード API

| メソッド | パス | 認証 | 必要ロール | リクエスト | レスポンス | ステータスコード |
|---|---|---|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Y | 全ロール | - | `DashboardSummaryResponse` | `200` 成功, `401` 未認証 |

---

### 2.5 認証・認可設計

#### 2.5.1 JWTトークン構造

```python
# トークンペイロード
{
    "sub": "65f1a2b3c4d5e6f7a8b9c0d0",  # User._id の文字列表現
    "role": "admin",                       # ユーザーロール
    "exp": 1740000000,                     # 有効期限 (UNIX timestamp)
    "iat": 1739971200                      # 発行日時 (UNIX timestamp)
}
```

| クレーム | 型 | 説明 |
|---|---|---|
| `sub` | `str` | ユーザーID (`str(User._id)`) |
| `role` | `str` | `"admin"` / `"manager"` / `"member"` |
| `exp` | `int` | 有効期限。発行から480分後（環境変数で設定可） |
| `iat` | `int` | 発行日時 |

#### 2.5.2 トークンライフサイクル

```
1. 発行: POST /api/auth/login 成功時に生成
   - python-jose の jwt.encode() で署名
   - アルゴリズム: HS256
   - シークレットキー: 環境変数 JWT_SECRET_KEY
   - 有効期限: JWT_ACCESS_TOKEN_EXPIRE_MINUTES (デフォルト480分 = 8時間)

2. 送信: クライアントは Authorization ヘッダーに Bearer トークンを付与
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

3. 検証: 各リクエストで get_current_user 依存性が実行
   - jwt.decode() でトークンをデコード
   - sub クレームから User を DB 検索
   - is_active=True を確認
   - 期限切れの場合は 401 を返却

4. 失効: トークンの有効期限が切れた場合、クライアントは再ログインが必要
   （リフレッシュトークンは本バージョンでは未実装）
```

#### 2.5.3 パスワードハッシュ

```python
# backend/app/auth/password.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain_password: str) -> str:
    """平文パスワードをbcryptでハッシュ化する。ラウンド数=12。"""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """平文パスワードとハッシュ値を照合する。"""
    return pwd_context.verify(plain_password, hashed_password)
```

#### 2.5.4 認証依存性関数

```python
# backend/app/auth/dependencies.py
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Authorizationヘッダーからトークンを取得し、ユーザーを返す。

    処理:
        1. credentials.credentials からトークン文字列を取得
        2. jwt.decode() でデコード
        3. payload["sub"] から User を検索
        4. is_active=True を確認

    Raises:
        HTTPException(401): トークン無効/期限切れ/ユーザー無効
    """
    ...


def require_role(allowed_roles: List[str]):
    """
    指定ロールを持つユーザーのみアクセスを許可する依存性ファクトリ。

    使用例:
        @router.post("/", dependencies=[Depends(require_role(["admin"]))])

    処理:
        1. get_current_user でユーザーを取得
        2. user.role が allowed_roles に含まれるか検証

    Raises:
        HTTPException(403): ロールが許可リストに含まれない場合
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker
```

#### 2.5.5 RBACマトリクス

| エンドポイント | admin | manager | member |
|---|---|---|---|
| `POST /api/auth/login` | OK | OK | OK |
| `GET /api/auth/me` | OK | OK | OK |
| `POST /api/auth/register` | OK | - | - |
| `GET /api/members` | OK | OK | OK |
| `POST /api/members` | OK | - | - |
| `GET /api/members/{id}` | OK | OK | OK |
| `PUT /api/members/{id}` | OK | - | - |
| `DELETE /api/members/{id}` | OK | - | - |
| `GET /api/members/{id}/utilization` | OK | OK | OK |
| `GET /api/projects` | OK | OK | OK |
| `POST /api/projects` | OK | OK | - |
| `GET /api/projects/{id}` | OK | OK | OK |
| `PUT /api/projects/{id}` | OK | OK | - |
| `DELETE /api/projects/{id}` | OK | - | - |
| `GET /api/projects/{id}/cost` | OK | OK | - |
| `GET /api/projects/{id}/budget-vs-actual` | OK | OK | - |
| `POST /api/projects/{id}/tasks` | OK | OK | - |
| `PUT /api/projects/{id}/tasks/{task_id}` | OK | OK | 自タスクの進捗のみ |
| `DELETE /api/projects/{id}/tasks/{task_id}` | OK | OK | - |
| `PUT /api/projects/{id}/tasks/reorder` | OK | OK | - |
| `PUT /api/projects/{id}/tasks/{task_id}/assign` | OK | OK | - |
| `GET /api/dashboard/summary` | OK | OK | OK |

---

### 2.6 MongoDB設計

#### 2.6.1 コレクション一覧

| コレクション名 | 対応モデル | 説明 |
|---|---|---|
| `users` | `User` | システムユーザー（認証用） |
| `members` | `Member` | チームメンバー（コスト管理対象） |
| `projects` | `Project` | プロジェクト（タスクを埋め込み） |

#### 2.6.2 インデックス定義

```python
# backend/app/db/database.py 内で Beanie 初期化後に作成

# --- users コレクション ---
# Beanie の Indexed(unique=True) により自動作成
# email_1 (unique)

# --- members コレクション ---
# Beanie の Indexed(unique=True) により自動作成
# email_1 (unique)

# 追加インデックス:
await members_collection.create_index("department")        # 部署フィルタ用
await members_collection.create_index("is_active")         # 有効フラグフィルタ用
await members_collection.create_index(
    [("name", "text"), ("email", "text")],                 # 全文検索用
    name="members_text_search"
)

# --- projects コレクション ---
await projects_collection.create_index("status")           # ステータスフィルタ用
await projects_collection.create_index("start_date")       # 日付ソート用
await projects_collection.create_index("tasks.assignee_id")  # タスク担当者検索用
```

| コレクション | インデックス名 | フィールド | unique | sparse | 用途 |
|---|---|---|---|---|---|
| `users` | `email_1` | `email` | Yes | No | ログイン時のメール検索 |
| `members` | `email_1` | `email` | Yes | No | メール重複チェック |
| `members` | `department_1` | `department` | No | No | 部署フィルタ |
| `members` | `is_active_1` | `is_active` | No | No | 有効フラグフィルタ |
| `members` | `members_text_search` | `name`, `email` (text) | No | No | 検索用全文インデックス |
| `projects` | `status_1` | `status` | No | No | ステータスフィルタ |
| `projects` | `start_date_1` | `start_date` | No | No | 日付ソート |
| `projects` | `tasks.assignee_id_1` | `tasks.assignee_id` | No | Yes | メンバー稼働率計算時の検索 |

#### 2.6.3 シードデータ

```python
# backend/app/db/seed.py

import asyncio
from datetime import date, datetime

from app.auth.password import hash_password
from app.models.member import Member
from app.models.project import Project
from app.models.task import Task
from app.models.user import User


async def seed_data() -> None:
    """初期データを投入する。既にデータが存在する場合はスキップ。"""

    # --- Users (2名) ---
    if await User.count() == 0:
        users = [
            User(
                email="admin@teamboard.example",
                hashed_password=hash_password("admin1234"),
                name="管理者",
                role="admin",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            User(
                email="manager@teamboard.example",
                hashed_password=hash_password("manager1234"),
                name="マネージャー",
                role="manager",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
        ]
        await User.insert_many(users)

    # --- Members (5名) ---
    if await Member.count() == 0:
        members = [
            Member(
                name="田中太郎",
                email="tanaka@example.com",
                department="開発部",
                role="バックエンド開発者",
                cost_per_month=70.0,
                avatar_color="#3B82F6",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            Member(
                name="佐藤花子",
                email="sato@example.com",
                department="開発部",
                role="フロントエンド開発者",
                cost_per_month=65.0,
                avatar_color="#10B981",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            Member(
                name="鈴木一郎",
                email="suzuki@example.com",
                department="デザイン部",
                role="UIデザイナー",
                cost_per_month=60.0,
                avatar_color="#F59E0B",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            Member(
                name="高橋美咲",
                email="takahashi@example.com",
                department="企画部",
                role="プロジェクトマネージャー",
                cost_per_month=80.0,
                avatar_color="#EF4444",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            Member(
                name="渡辺健太",
                email="watanabe@example.com",
                department="開発部",
                role="フルスタック開発者",
                cost_per_month=75.0,
                avatar_color="#8B5CF6",
                is_active=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
        ]
        await Member.insert_many(members)

    # --- Projects (3件 + タスク) ---
    if await Project.count() == 0:
        # メンバーIDを取得（シード順序に依存）
        all_members = await Member.find_all().to_list()
        m = {m.name: str(m.id) for m in all_members}

        projects = [
            Project(
                name="TeamBoard開発",
                description="チーム管理・コスト管理ツールの開発プロジェクト",
                budget=500.0,
                status="active",
                start_date=date(2026, 1, 6),
                end_date=date(2026, 6, 30),
                tasks=[
                    Task(
                        title="API設計・実装",
                        assignee_id=m["田中太郎"],
                        man_days=30.0,
                        progress=80,
                        start_date=date(2026, 1, 6),
                        end_date=date(2026, 2, 28),
                        sort_order=0,
                        status="in_progress",
                    ),
                    Task(
                        title="フロントエンド実装",
                        assignee_id=m["佐藤花子"],
                        man_days=40.0,
                        progress=50,
                        start_date=date(2026, 2, 1),
                        end_date=date(2026, 4, 30),
                        sort_order=1,
                        status="in_progress",
                    ),
                    Task(
                        title="UI/UXデザイン",
                        assignee_id=m["鈴木一郎"],
                        man_days=15.0,
                        progress=100,
                        start_date=date(2026, 1, 6),
                        end_date=date(2026, 1, 31),
                        sort_order=2,
                        status="completed",
                    ),
                    Task(
                        title="テスト・QA",
                        assignee_id=m["渡辺健太"],
                        man_days=20.0,
                        progress=0,
                        start_date=date(2026, 5, 1),
                        end_date=date(2026, 6, 15),
                        sort_order=3,
                        status="not_started",
                    ),
                ],
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 2, 20),
            ),
            Project(
                name="社内ポータルリニューアル",
                description="社内ポータルサイトの全面リニューアルプロジェクト",
                budget=300.0,
                status="active",
                start_date=date(2026, 2, 1),
                end_date=date(2026, 5, 31),
                tasks=[
                    Task(
                        title="要件定義",
                        assignee_id=m["高橋美咲"],
                        man_days=10.0,
                        progress=100,
                        start_date=date(2026, 2, 1),
                        end_date=date(2026, 2, 14),
                        sort_order=0,
                        status="completed",
                    ),
                    Task(
                        title="デザインモック作成",
                        assignee_id=m["鈴木一郎"],
                        man_days=12.0,
                        progress=60,
                        start_date=date(2026, 2, 17),
                        end_date=date(2026, 3, 14),
                        sort_order=1,
                        status="in_progress",
                    ),
                    Task(
                        title="バックエンド開発",
                        assignee_id=m["田中太郎"],
                        man_days=25.0,
                        progress=10,
                        start_date=date(2026, 3, 1),
                        end_date=date(2026, 5, 15),
                        sort_order=2,
                        status="in_progress",
                    ),
                ],
                created_at=datetime(2026, 1, 15),
                updated_at=datetime(2026, 2, 20),
            ),
            Project(
                name="モバイルアプリ企画",
                description="新規モバイルアプリの企画・調査フェーズ",
                budget=100.0,
                status="planning",
                start_date=date(2026, 4, 1),
                end_date=date(2026, 6, 30),
                tasks=[
                    Task(
                        title="市場調査",
                        assignee_id=m["高橋美咲"],
                        man_days=8.0,
                        progress=0,
                        start_date=date(2026, 4, 1),
                        end_date=date(2026, 4, 15),
                        sort_order=0,
                        status="not_started",
                    ),
                    Task(
                        title="プロトタイプ作成",
                        assignee_id=m["渡辺健太"],
                        man_days=15.0,
                        progress=0,
                        start_date=date(2026, 4, 16),
                        end_date=date(2026, 5, 31),
                        sort_order=1,
                        status="not_started",
                    ),
                ],
                created_at=datetime(2026, 2, 1),
                updated_at=datetime(2026, 2, 1),
            ),
        ]
        await Project.insert_many(projects)
```

**シードデータ概要:**

| ユーザー | メール | ロール | パスワード |
|---|---|---|---|
| 管理者 | `admin@teamboard.example` | admin | `admin1234` |
| マネージャー | `manager@teamboard.example` | manager | `manager1234` |

| メンバー | 部署 | 役割 | 単価(万円/月) | アバター色 |
|---|---|---|---|---|
| 田中太郎 | 開発部 | バックエンド開発者 | 70.0 | `#3B82F6` |
| 佐藤花子 | 開発部 | フロントエンド開発者 | 65.0 | `#10B981` |
| 鈴木一郎 | デザイン部 | UIデザイナー | 60.0 | `#F59E0B` |
| 高橋美咲 | 企画部 | プロジェクトマネージャー | 80.0 | `#EF4444` |
| 渡辺健太 | 開発部 | フルスタック開発者 | 75.0 | `#8B5CF6` |

| プロジェクト | 予算 | ステータス | 期間 | タスク数 |
|---|---|---|---|---|
| TeamBoard開発 | 500万円 | active | 2026/1/6-6/30 | 4 |
| 社内ポータルリニューアル | 300万円 | active | 2026/2/1-5/31 | 3 |
| モバイルアプリ企画 | 100万円 | planning | 2026/4/1-6/30 | 2 |
