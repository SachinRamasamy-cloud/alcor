"""Approved ordinary status transitions; tracking/recovery own their workflows."""

INITIAL_STATUSES = {"planned", "in_progress", "completed", "not_interested"}
TRANSITIONS = {
    "planned": {"in_progress", "completed", "dropped", "not_interested"},
    "in_progress": {"on_hold", "dropped", "completed"},
    "on_hold": {"in_progress"},
    "dropped": {"in_progress"},
    "completed": set(),
    "not_interested": set(),
}
