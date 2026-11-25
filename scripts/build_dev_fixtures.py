"""Reduce ignored provider snapshots into attributed development metadata.

No provider calls. Run from root with Python after the bounded probe.
"""
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

root = Path(__file__).resolve().parents[1]
result = []
for media_type in ("anime", "manga"):
    snapshot = root / ".local" / f"{media_type}.json"
    retrieved = datetime.fromtimestamp(snapshot.stat().st_mtime, UTC).isoformat()
    for item in json.loads(snapshot.read_text(encoding="utf-8"))["data"]:
        if any(g["name"] in {"Hentai", "Erotica"} for g in item.get("genres", [])):
            continue
        result.append({"id": str(uuid5(NAMESPACE_URL, f"mal:{media_type}:{item['mal_id']}")),
                       "external_id": str(item["mal_id"]), "media_type": media_type,
                       "title": item.get("title_english") or item["title"],
                       "original_title": item.get("title_japanese"),
                       "aliases": sorted({t["title"] for t in item.get("titles", [])}),
                       "synopsis": item.get("synopsis"),
                       "image_url": item.get("images", {}).get("webp", {}).get("large_image_url"),
                       "format": item.get("type"), "status": item.get("status"),
                       "year": item.get("year") or (item.get("published", {}).get("prop", {}).get("from", {}).get("year")),
                       "score": item.get("score"), "rating_count": item.get("scored_by"),
                       "popularity": item.get("popularity"),
                       "total_units": item.get("episodes") if media_type == "anime" else item.get("chapters"),
                       "genres": [g["name"] for g in item.get("genres", [])],
                       "themes": [g["name"] for g in item.get("themes", [])],
                       "season": item.get("season"),
                       "studios": [s["name"] for s in item.get("studios", [])],
                       "content_rating": item.get("rating"),
                       "source": {"name": "Tenrai / MyAnimeList", "url": item["url"],
                                  "retrieved_at": retrieved, "is_fixture": True}})
target = root / "backend/app/integrations/metadata/fixtures"
target.mkdir(parents=True, exist_ok=True)
(target / "catalogue.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
if not (target / "episodes.json").exists():
    (target / "episodes.json").write_text("{}\n", encoding="utf-8", newline="\n")
print(f"Reduced {len(result)} development records; production use remains gated.")
