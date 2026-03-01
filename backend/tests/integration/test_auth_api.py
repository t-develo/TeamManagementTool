"""
認証 API の統合テスト。

テスト対象エンドポイント:
  POST /api/auth/login
  GET  /api/auth/me
"""
import pytest

from app.models.user import User
from app.auth.password import hash_password


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

class TestLogin:
    """POST /api/auth/login: ユーザー認証とトークン発行を検証する"""

    async def test_正しい認証情報でログインするとアクセストークンが返される(self, async_client):
        # Arrange: ユーザーを DB に登録する
        user = User(
            email="user@test.example",
            hashed_password=hash_password("password1234"),
            name="テストユーザー",
            role="member",
        )
        await user.insert()

        # Act
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "user@test.example", "password": "password1234"},
        )

        # Assert
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    async def test_存在しないメールアドレスでログインすると401を返す(self, async_client):
        # Act
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "nobody@test.example", "password": "password1234"},
        )

        # Assert
        assert response.status_code == 401

    async def test_間違ったパスワードでログインすると401を返す(self, async_client):
        # Arrange
        user = User(
            email="user@test.example",
            hashed_password=hash_password("correct_password"),
            name="テストユーザー",
            role="member",
        )
        await user.insert()

        # Act
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "user@test.example", "password": "wrong_password"},
        )

        # Assert
        assert response.status_code == 401

    async def test_無効化されたユーザーでログインすると401を返す(self, async_client):
        # Arrange
        user = User(
            email="inactive@test.example",
            hashed_password=hash_password("password1234"),
            name="無効ユーザー",
            role="member",
            is_active=False,
        )
        await user.insert()

        # Act
        response = await async_client.post(
            "/api/auth/login",
            json={"email": "inactive@test.example", "password": "password1234"},
        )

        # Assert
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------

class TestMe:
    """GET /api/auth/me: 認証済みユーザーの情報取得を検証する"""

    async def test_有効なトークンで自分のユーザー情報が返される(self, async_client, admin_user, admin_headers):
        # Act
        response = await async_client.get("/api/auth/me", headers=admin_headers)

        # Assert
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == admin_user.email
        assert body["role"] == "admin"

    async def test_トークンなしでアクセスすると403を返す(self, async_client):
        # Act
        response = await async_client.get("/api/auth/me")

        # Assert
        assert response.status_code == 403
