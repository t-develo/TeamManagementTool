from contextlib import asynccontextmanager

from fastapi import FastAPI
from mangum import Mangum

from app.config import settings
from app.db.database import init_db
from app.routers import auth, dashboard, members, projects, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="TeamBoard API", version="1.0.0", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


handler = Mangum(app)
