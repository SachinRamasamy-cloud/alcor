import pytest

from app.core.errors import AppError
from app.modules.library.policy import completion_unavailable, release_finished, require_completion
from app.modules.tracking.policy import summarize_session


@pytest.mark.parametrize("status,blocked,finished", [
    ("Currently Airing", True, False), ("RELEASING", True, False),
    ("Publishing", True, False), ("NOT_YET_RELEASED", True, False),
    ("Finished Airing", False, True), ("FINISHED", False, True),
    (None, False, False), ("Unknown", False, False),
])
def test_release_evidence_has_no_title_or_count_inference(status, blocked, finished):
    assert completion_unavailable(status) == blocked
    assert release_finished(status) == finished
    if blocked:
        with pytest.raises(AppError):
            require_completion(status)
    else:
        require_completion(status)


def test_ongoing_eight_released_of_twenty_four_planned_is_caught_up():
    units = [{"key": str(i), "order": i, "released": i <= 8} for i in range(1, 25)]
    marks = {str(i): "watched" for i in range(1, 9)}
    result = summarize_session(units, marks, status="RELEASING", final_total=24, coverage=True, skip_counts=False)
    assert (result.done, result.remaining, result.next_key, result.completed, result.caught_up) == (8, 0, None, False, True)
