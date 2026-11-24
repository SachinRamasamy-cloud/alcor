import asyncio
import os

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine


def run(connection):
    context.configure(connection=connection, target_metadata=None)
    with context.begin_transaction():
        context.run_migrations()


async def migrate():
    url = os.environ.get("MIGRATION_DATABASE_URL")
    if not url:
        raise RuntimeError(
            "MIGRATION_DATABASE_URL is required; runtime credentials are not a fallback"
        )
    engine = create_async_engine(url, pool_size=1, max_overflow=0)
    async with engine.connect() as connection:
        await connection.run_sync(run)
    await engine.dispose()


asyncio.run(migrate())
