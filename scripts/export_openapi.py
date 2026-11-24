"""Run from backend: uv run python ../scripts/export_openapi.py."""
import json
from pathlib import Path

from app.main import create_app

target = Path(__file__).resolve().parents[1] / "contracts" / "openapi.json"
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
