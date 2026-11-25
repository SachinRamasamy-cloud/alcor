"""Approved ordinary status transitions; tracking/recovery own their workflows."""

from app.core.errors import AppError


def release_state(status: str | None) -> str:
    return (status or "").strip().upper().replace(" ", "_")


def completion_unavailable(status: str | None) -> bool:
    return release_state(status) in {
        "RELEASING", "CURRENTLY_AIRING", "PUBLISHING", "CURRENTLY_PUBLISHING",
        "NOT_YET_RELEASED", "NOT_YET_AIRED",
    }


def release_finished(status: str | None) -> bool:
    return release_state(status) in {"FINISHED", "FINISHED_AIRING"}


def require_completion(status: str | None):
    if completion_unavailable(status):
        raise AppError(422, "COMPLETION_UNAVAILABLE", "This title is still releasing or has not released. Keep tracking available progress.")

INITIAL_STATUSES = {"planned", "in_progress", "completed", "not_interested"}
TRANSITIONS = {
    "planned": {"in_progress", "completed", "dropped", "not_interested"},
    "in_progress": {"on_hold", "dropped", "completed"},
    "on_hold": {"in_progress"},
    "dropped": {"in_progress"},
    "completed": set(),
    "not_interested": set(),
}
