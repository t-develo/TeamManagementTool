import logging

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.member import Member
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)


async def init_db() -> None:
    logger.info("Connecting to MongoDB: %s", settings.MONGODB_URL[:20] + "***")
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=10_000,
        connectTimeoutMS=10_000,
        socketTimeoutMS=20_000,
    )
    db = client[settings.MONGODB_DB_NAME]

    # 接続を検証してから Beanie を初期化する
    await db.command({"ping": 1})
    logger.info("MongoDB ping OK — database: %s", settings.MONGODB_DB_NAME)

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
    logger.info("Database initialization complete")
