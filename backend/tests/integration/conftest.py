"""
統合テスト共通 fixtures。

各テストは独立した mongomock インメモリ DB を使用するため、
実際の MongoDB サーバーは不要。テスト間の状態汚染も発生しない。
"""
import pytest_asyncio
from unittest.mock import AsyncMock, patch

from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.auth.password import hash_password
from app.auth.jwt_handler import create_access_token
from app.models.user import User
from app.models.member import Member
from app.models.project import Project


@pytest_asyncio.fixture
async def async_client():
    """
    テスト用 HTTP クライアント。

    テストごとに独立した mongomock インメモリ DB を初期化し、
    アプリの init_db をモックすることで実 MongoDB への接続を回避する。
    テスト終了時には DB が破棄されるためクリーンアップ不要。
    """
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client["teamboard_test"]

    await init_beanie(
        database=mock_db,
        document_models=[User, Member, Project],
    )

    with patch("app.main.init_db", AsyncMock()):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            yield client


@pytest_asyncio.fixture
async def admin_user(async_client):
    """管理者ユーザーを DB に作成して返す（async_client の DB 初期化後に実行）"""
    user = User(
        email="admin@test.example",
        hashed_password=hash_password("admin1234"),
        name="テスト管理者",
        role="admin",
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def admin_headers(admin_user):
    """管理者ユーザーの JWT 認証ヘッダーを返す"""
    token = create_access_token({"sub": str(admin_user.id), "role": "admin"})
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# テストデータ定数
# ---------------------------------------------------------------------------

MEMBER_PAYLOAD = {
    "name": "山田 太郎",
    "email": "yamada@test.example",
    "department": "エンジニアリング",
    "role": "バックエンドエンジニア",
    "cost_per_month": 60.0,
    "avatar_color": "#3B82F6",
}
