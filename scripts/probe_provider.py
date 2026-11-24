"""Bounded public provider smoke; no load test, authentication or personal data.

Run with backend's uv environment. Writes sanitized evidence, not a production approval.
"""
import asyncio
import json
import time
from pathlib import Path

import httpx

ENDPOINTS = [
    "/anime?q=Frieren&limit=3", "/manga?q=Yotsuba&limit=3",
    "/anime/52991/full", "/anime/21/episodes?page=1",
    "/anime/21/episodes?page=2", "/seasons/now?limit=3",
    "/schedules?limit=3", "/genres/anime", "/anime/52991/relations",
    "/top/anime?limit=12", "/top/manga?limit=6", "/anime/52991/recommendations",
]


async def main():
    results = []
    async with httpx.AsyncClient(base_url="https://api.tenrai.org/v1", timeout=15) as client:
        for path in ENDPOINTS:
            start = time.monotonic()
            try:
                response = await client.get(path)
                body = response.json() if response.is_success else {}
                data = body.get("data")
                results.append({"path": path, "status": response.status_code,
                                "latency_ms": round((time.monotonic() - start) * 1000),
                                "data_type": type(data).__name__,
                                "count": len(data) if isinstance(data, list) else None,
                                "pagination": body.get("pagination"),
                                "rate_headers": {k: v for k, v in response.headers.items()
                                                 if "ratelimit" in k or k == "retry-after"}})
                if path in {"/top/anime?limit=12", "/top/manga?limit=6"} and response.is_success:
                    fixture_dir = Path(__file__).resolve().parents[1] / ".local"
                    fixture_dir.mkdir(exist_ok=True)
                    (fixture_dir / ("anime.json" if "anime" in path else "manga.json")).write_text(
                        json.dumps(body, ensure_ascii=False), encoding="utf-8")
                if response.status_code == 429:
                    break  # Do not force a 429 or consume a retry budget.
            except (httpx.HTTPError, ValueError) as exc:
                results.append({"path": path, "error_type": type(exc).__name__})
            await asyncio.sleep(1.2)
    target = Path(__file__).resolve().parents[1] / "docs" / "engineering" / "provider-smoke.json"
    target.write_text(json.dumps({"provider": "Tenrai candidate", "production_approved": False,
                                  "results": results}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
