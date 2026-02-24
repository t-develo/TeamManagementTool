from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.member import Member
from app.models.project import Project
from app.models.user import User


async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(
        database=db,
        document_models=[User, Member, Project],
    )
    # Additional indexes
    members_col = db["members"]
    await members_col.create_index("department")
    await members_col.create_index("is_active")

    projects_col = db["projects"]
    await projects_col.create_index("status")
    await projects_col.create_index("start_date")
    await projects_col.create_index("tasks.assignee_id", sparse=True)
