"""Create only fixed local development roles. Never targets an environment URL."""
import asyncio

import asyncpg


async def main():
    connection = await asyncpg.connect(host="127.0.0.1", port=55432, database="alcor",
                                      user="alcor_migrate", password="alcor_local_migration")
    for role, statement in [
        ("alcor_runtime", "CREATE ROLE alcor_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS"),
        ("alcor_app", "CREATE ROLE alcor_app LOGIN PASSWORD 'alcor_local' NOSUPERUSER NOBYPASSRLS IN ROLE alcor_runtime"),
    ]:
        if not await connection.fetchval("SELECT 1 FROM pg_roles WHERE rolname=$1", role):
            await connection.execute(statement)
    await connection.close()
    print("Local runtime roles ready; no remote database was contacted.")


asyncio.run(main())
