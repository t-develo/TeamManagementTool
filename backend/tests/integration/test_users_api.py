"""
ユーザー管理 API の統合テスト。

テスト対象エンドポイント:
  GET    /api/auth/users
  PUT    /api/auth/users/{user_id}
  DELETE /api/auth/users/{user_id}
"""
import pytest

from app.auth.jwt_handler import create_access_token
from app.auth.password import hash_password
from app.models.user import User

USER_PAYLOAD = {
    "email": "newuser@test.example",
    "password": "password1234",
    "name": "新規ユーザー",
    "role": "member",
}


@pytest.fixture
async def manager_headers(async_client):
    """マネージャーユーザーの JWT 認証ヘッダーを返す"""
    user = User(
        email="manager@test.example",
        hashed_password=hash_password("password1234"),
        name="テストマネージャー",
        role="manager",
    )
    await user.insert()
    token = create_access_token({"sub": str(user.id), "role": "manager"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def member_user(async_client):
    """テスト用 member ユーザーを作成して返す"""
    user = User(
        email="member@test.example",
        hashed_password=hash_password("password1234"),
        name="テストメンバー",
        role="member",
    )
    await user.insert()
    return user


# ---------------------------------------------------------------------------
# GET /api/auth/users
# ---------------------------------------------------------------------------

class TestListUsers:
    """GET /api/auth/users: ユーザー一覧取得を検証する"""

    async def test_管理者がユーザー一覧を取得できる(self, async_client, admin_user, admin_headers):
        # Act
        response = await async_client.get("/api/auth/users", headers=admin_headers)

        # Assert
        assert response.status_code == 200
        body = response.json()
        assert "items" in body
        assert "total" in body
        assert body["total"] >= 1

    async def test_マネージャーがアクセスすると403を返す(self, async_client, manager_headers):
        # Act
        response = await async_client.get("/api/auth/users", headers=manager_headers)

        # Assert
        assert response.status_code == 403

    async def test_トークンなしでアクセスすると403を返す(self, async_client):
        # Act
        response = await async_client.get("/api/auth/users")

        # Assert
        assert response.status_code == 403

    async def test_ユーザーが存在しないとき空リストを返す(self, async_client, admin_user, admin_headers):
        # admin_user のみ存在する状態でページネーション確認
        response = await async_client.get(
            "/api/auth/users?page=1&per_page=20", headers=admin_headers
        )

        # Assert
        body = response.json()
        assert body["total"] >= 1
        assert body["page"] == 1
        assert body["per_page"] == 20


# ---------------------------------------------------------------------------
# POST /api/auth/register (admin のみ)
# ---------------------------------------------------------------------------

class TestRegisterUser:
    """POST /api/auth/register: ユーザー登録を検証する"""

    async def test_管理者が新規ユーザーを作成できる(self, async_client, admin_headers):
        # Act
        response = await async_client.post(
            "/api/auth/register",
            json=USER_PAYLOAD,
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 201
        body = response.json()
        assert body["email"] == USER_PAYLOAD["email"]
        assert body["name"] == USER_PAYLOAD["name"]
        assert body["role"] == USER_PAYLOAD["role"]
        assert body["is_active"] is True

    async def test_重複するメールアドレスで作成すると409を返す(self, async_client, admin_headers):
        # Arrange: 先に同じメールアドレスのユーザーを作成しておく
        await async_client.post("/api/auth/register", json=USER_PAYLOAD, headers=admin_headers)

        # Act: 同じメールアドレスで再度作成
        response = await async_client.post(
            "/api/auth/register",
            json=USER_PAYLOAD,
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 409

    async def test_管理者以外が登録しようとすると403を返す(self, async_client, manager_headers):
        # Act
        response = await async_client.post(
            "/api/auth/register",
            json=USER_PAYLOAD,
            headers=manager_headers,
        )

        # Assert
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# PUT /api/auth/users/{user_id}
# ---------------------------------------------------------------------------

class TestUpdateUser:
    """PUT /api/auth/users/{user_id}: ユーザー更新を検証する"""

    async def test_管理者がユーザーのロールを変更できる(
        self, async_client, admin_headers, member_user
    ):
        # Act
        response = await async_client.put(
            f"/api/auth/users/{member_user.id}",
            json={"role": "manager"},
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["role"] == "manager"

    async def test_管理者がユーザー名を変更できる(
        self, async_client, admin_headers, member_user
    ):
        # Act
        response = await async_client.put(
            f"/api/auth/users/{member_user.id}",
            json={"name": "変更後の名前"},
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["name"] == "変更後の名前"

    async def test_管理者がパスワードを変更すると新パスワードでログインできる(
        self, async_client, admin_headers, member_user
    ):
        # Act: パスワードを変更する
        await async_client.put(
            f"/api/auth/users/{member_user.id}",
            json={"password": "newpassword123"},
            headers=admin_headers,
        )

        # Assert: 新しいパスワードでログインできる
        login_resp = await async_client.post(
            "/api/auth/login",
            json={"email": "member@test.example", "password": "newpassword123"},
        )
        assert login_resp.status_code == 200
        assert "access_token" in login_resp.json()

    async def test_管理者がユーザーを無効化できる(
        self, async_client, admin_headers, member_user
    ):
        # Act
        response = await async_client.put(
            f"/api/auth/users/{member_user.id}",
            json={"is_active": False},
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    async def test_マネージャーがユーザーを更新しようとすると403を返す(
        self, async_client, manager_headers, member_user
    ):
        # Act
        response = await async_client.put(
            f"/api/auth/users/{member_user.id}",
            json={"role": "admin"},
            headers=manager_headers,
        )

        # Assert
        assert response.status_code == 403

    async def test_存在しないユーザーIDで404を返す(self, async_client, admin_headers):
        # Act: 存在しないがフォーマット的に有効な ObjectId を指定する
        response = await async_client.put(
            "/api/auth/users/000000000000000000000000",
            json={"name": "更新"},
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/auth/users/{user_id}
# ---------------------------------------------------------------------------

class TestDeleteUser:
    """DELETE /api/auth/users/{user_id}: ユーザーの論理削除を検証する"""

    async def test_管理者がユーザーを論理削除するとis_activeがfalseになる(
        self, async_client, admin_headers, member_user
    ):
        # Act
        response = await async_client.delete(
            f"/api/auth/users/{member_user.id}",
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    async def test_論理削除されたユーザーはログインできない(
        self, async_client, admin_headers, member_user
    ):
        # Arrange: ユーザーを無効化する
        await async_client.delete(
            f"/api/auth/users/{member_user.id}",
            headers=admin_headers,
        )

        # Act: 無効化されたユーザーでログインを試みる
        login_resp = await async_client.post(
            "/api/auth/login",
            json={"email": "member@test.example", "password": "password1234"},
        )

        # Assert
        assert login_resp.status_code == 401

    async def test_マネージャーがユーザーを削除しようとすると403を返す(
        self, async_client, manager_headers, member_user
    ):
        # Act
        response = await async_client.delete(
            f"/api/auth/users/{member_user.id}",
            headers=manager_headers,
        )

        # Assert
        assert response.status_code == 403

    async def test_存在しないユーザーIDで404を返す(self, async_client, admin_headers):
        # Act
        response = await async_client.delete(
            "/api/auth/users/000000000000000000000000",
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 404
