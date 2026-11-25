from pydantic import BaseModel


class ProgressSummary(BaseModel):
    done: int
    skipped: int
    resolved: int
    remaining: int
    next_key: str | None
    caught_up: bool
    completed: bool


def summarize(
    units: list[dict],
    marks: dict[str, str],
    *,
    final_total: int | None,
    coverage: bool,
    skip_counts: bool,
) -> ProgressSummary:
    released = sorted((u for u in units if u["released"]), key=lambda u: (u["order"], u["key"]))
    done = sum(marks.get(u["key"]) in {"watched", "read"} for u in released)
    skipped = sum(marks.get(u["key"]) == "skipped" for u in released)
    unresolved = [u for u in released if marks.get(u["key"]) not in {"watched", "read", "skipped"}]
    completed = bool(
        coverage
        and final_total is not None
        and final_total > 0
        and len(released) == final_total
        and done + (skipped if skip_counts else 0) == final_total
    )
    return ProgressSummary(
        done=done,
        skipped=skipped,
        resolved=done + skipped,
        remaining=len(unresolved),
        next_key=unresolved[0]["key"] if unresolved else None,
        caught_up=bool(coverage and released and not unresolved and not completed),
        completed=completed,
    )
