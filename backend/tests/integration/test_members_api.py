"""
メンバー API の統合テスト。

テスト対象エンドポイント:
  GET    /api/members
  POST   /api/members
  GET    /api/members/{member_id}
  DELETE /api/members/{member_id}
"""
import pytest

from tests.integration.conftest import MEMBER_PAYLOAD


# ---------------------------------------------------------------------------
# GET /api/members
# ---------------------------------------------------------------------------

class TestListMembers:
    """GET /api/members: メンバー一覧取得を検証する"""

    async def test_認証済みユーザーがメンバー一覧を取得できる(self, async_client, admin_headers):
        # Act
        response = await async_client.get("/api/members", headers=admin_headers)

        # Assert
        assert response.status_code == 200
        body = response.json()
        assert "items" in body
        assert "total" in body

    async def test_トークンなしでアクセスすると403を返す(self, async_client):
        # Act
        response = await async_client.get("/api/members")

        # Assert
        assert response.status_code == 403

    async def test_メンバーが存在しないとき空リストを返す(self, async_client, admin_headers):
        # Act
        response = await async_client.get("/api/members", headers=admin_headers)

        # Assert
        body = response.json()
        assert body["total"] == 0
        assert body["items"] == []


# ---------------------------------------------------------------------------
# POST /api/members
# ---------------------------------------------------------------------------

class TestCreateMember:
    """POST /api/members: メンバー作成を検証する"""

    async def test_管理者が新規メンバーを作成できる(self, async_client, admin_headers):
        # Act
        response = await async_client.post(
            "/api/members",
            json=MEMBER_PAYLOAD,
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 201
        body = response.json()
        assert body["name"] == MEMBER_PAYLOAD["name"]
        assert body["email"] == MEMBER_PAYLOAD["email"]
        assert body["is_active"] is True

    async def test_作成されたメンバーにはIDが付与される(self, async_client, admin_headers):
        # Act
        response = await async_client.post(
            "/api/members",
            json=MEMBER_PAYLOAD,
            headers=admin_headers,
        )

        # Assert
        body = response.json()
        assert "id" in body
        assert body["id"] != ""

    async def test_重複するメールアドレスで作成すると409を返す(self, async_client, admin_headers):
        # Arrange: 先に同じメールアドレスのメンバーを作成しておく
        await async_client.post("/api/members", json=MEMBER_PAYLOAD, headers=admin_headers)

        # Act: 同じメールアドレスで再度作成
        response = await async_client.post(
            "/api/members",
            json=MEMBER_PAYLOAD,
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 409

    async def test_管理者以外のユーザーが作成しようとすると403を返す(
        self, async_client, admin_user, admin_headers
    ):
        from app.auth.jwt_handler import create_access_token
        from app.models.user import User
        from app.auth.password import hash_password

        # Arrange: member ロールのユーザーを作成する
        member_user = User(
            email="member@test.example",
            hashed_password=hash_password("password1234"),
            name="一般ユーザー",
            role="member",
        )
        await member_user.insert()
        member_token = create_access_token({"sub": str(member_user.id), "role": "member"})
        member_headers = {"Authorization": f"Bearer {member_token}"}

        # Act
        response = await async_client.post(
            "/api/members",
            json=MEMBER_PAYLOAD,
            headers=member_headers,
        )

        # Assert
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /api/members/{member_id}
# ---------------------------------------------------------------------------

class TestGetMember:
    """GET /api/members/{member_id}: 個別メンバー取得を検証する"""

    async def test_存在するメンバーIDで詳細を取得できる(self, async_client, admin_headers):
        # Arrange: メンバーを作成する
        create_resp = await async_client.post(
            "/api/members", json=MEMBER_PAYLOAD, headers=admin_headers
        )
        member_id = create_resp.json()["id"]

        # Act
        response = await async_client.get(f"/api/members/{member_id}", headers=admin_headers)

        # Assert
        assert response.status_code == 200
        assert response.json()["id"] == member_id

    async def test_存在しないメンバーIDで404を返す(self, async_client, admin_headers):
        # Act: 存在しないがフォーマット的に有効な ObjectId を指定する
        response = await async_client.get(
            "/api/members/000000000000000000000000",
            headers=admin_headers,
        )

        # Assert
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/members/{member_id}
# ---------------------------------------------------------------------------

class TestDeleteMember:
    """DELETE /api/members/{member_id}: メンバーの論理削除を検証する"""

    async def test_管理者がメンバーを論理削除するとis_activeがfalseになる(
        self, async_client, admin_headers
    ):
        # Arrange: メンバーを作成する
        create_resp = await async_client.post(
            "/api/members", json=MEMBER_PAYLOAD, headers=admin_headers
        )
        member_id = create_resp.json()["id"]

        # Act
        response = await async_client.delete(
            f"/api/members/{member_id}", headers=admin_headers
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    async def test_削除後もメンバーレコードはDBに残る(self, async_client, admin_headers):
        # Arrange
        create_resp = await async_client.post(
            "/api/members", json=MEMBER_PAYLOAD, headers=admin_headers
        )
        member_id = create_resp.json()["id"]

        # Act
        await async_client.delete(f"/api/members/{member_id}", headers=admin_headers)

        # Assert: 論理削除なので GET でも取得できる
        get_resp = await async_client.get(
            f"/api/members/{member_id}", headers=admin_headers
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["is_active"] is False
