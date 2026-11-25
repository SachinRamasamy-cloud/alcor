from app.modules.tracking.policy import summarize


def test_required_gap_example():
    units = [{"key": str(i), "order": i, "released": True} for i in range(1, 13)]
    marks = {str(i): "watched" for i in [1, 2, 3, 4, 6, 7, 8, 10, 11]}
    marks["5"] = "skipped"
    result = summarize(units, marks, final_total=12, coverage=True, skip_counts=True)
    assert (result.done, result.skipped, result.remaining, result.next_key) == (9, 1, 2, "9")
    assert not result.completed


def test_unknown_final_and_skip_policy():
    units = [
        {"key": "10.5", "order": 1, "released": True},
        {"key": "bonus", "order": 2, "released": True},
    ]
    marks = {"10.5": "read", "bonus": "skipped"}
    assert not summarize(units, marks, final_total=None, coverage=True, skip_counts=True).completed
    assert summarize(units, marks, final_total=None, coverage=True, skip_counts=True).caught_up
    assert not summarize(units, marks, final_total=2, coverage=False, skip_counts=True).completed
    assert not summarize(units, marks, final_total=2, coverage=True, skip_counts=False).completed
    assert summarize(units, marks, final_total=2, coverage=True, skip_counts=True).completed


def test_future_units_and_missing_coverage_are_not_completion():
    units = [
        {"key": "1", "order": 1, "released": True},
        {"key": "2", "order": 2, "released": False},
    ]
    result = summarize(units, {"1": "watched"}, final_total=2, coverage=True, skip_counts=True)
    assert not result.completed and result.caught_up and result.next_key is None
    assert not summarize([], {}, final_total=None, coverage=False, skip_counts=True).caught_up
