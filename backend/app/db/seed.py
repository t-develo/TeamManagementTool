import asyncio
from datetime import date, datetime

from app.auth.password import hash_password
from app.db.database import init_db
from app.models.member import Member
from app.models.project import Project
from app.models.task import Task
from app.models.user import User


async def seed_data() -> None:
    """初期データを投入する。既にデータが存在する場合はスキップ。"""

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
        print("Seeded 2 users")

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
        print("Seeded 5 members")

    if await Project.count() == 0:
        all_members = await Member.find_all().to_list()
        m = {member.name: str(member.id) for member in all_members}

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
        print("Seeded 3 projects")


async def main():
    await init_db()
    await seed_data()
    print("Seed completed!")


if __name__ == "__main__":
    asyncio.run(main())
