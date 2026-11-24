from contextlib import asynccontextmanager
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


class Database:
    def __init__(self, url: str):
        self.engine = create_async_engine(
            url, pool_size=5, max_overflow=0, pool_pre_ping=True, hide_parameters=True
        )
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)

    @asynccontextmanager
    async def transaction(self, user_id: UUID):
        async with self.sessions() as session, session.begin():
            await session.execute(
                text("SELECT set_config('alcor.user_id', :user_id, true)"),
                {"user_id": str(user_id)},
            )
            yield session

    async def close(self):
        await self.engine.dispose()
