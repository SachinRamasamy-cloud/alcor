"""Read-only connection inspection. Receive credentials on stdin; never print them."""
import asyncio
import json
import sys

import asyncpg


async def main():
    config = json.loads(sys.stdin.readline())
    try:
        connection = await asyncpg.connect(**config, timeout=12, ssl="require")
        async with connection.transaction(readonly=True):
            schemas = await connection.fetch(
                "SELECT table_schema, count(*) AS tables FROM information_schema.tables "
                "WHERE table_schema NOT IN ('pg_catalog', 'information_schema') "
                "GROUP BY table_schema ORDER BY table_schema"
            )
            role = await connection.fetchrow(
                "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user"
            )
            print(json.dumps({"connected": True, "read_only": True,
                              "schemas": [dict(row) for row in schemas], "role": dict(role)}))
        await connection.close()
    except Exception as exc:
        print(json.dumps({"connected": False, "error_type": type(exc).__name__,
                          "error_code": getattr(exc, "sqlstate", None)}))
        sys.exit(1)


asyncio.run(main())
