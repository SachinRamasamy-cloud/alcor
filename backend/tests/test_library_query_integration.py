import os
from uuid import uuid4

import pytest

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import DisabledProvider, FixtureProvider
from app.modules.library import public as library
from app.modules.library.schemas import LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.tracking.schemas import ProgressWrite, StartSession
from app.modules.tracking.service import TrackingService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


@pytest.fixture
async def state():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    owner = uuid4()
    source = (await FixtureProvider().catalogue())[0]
    titles = [
        source.model_copy(
            update={
                "id": uuid4(),
                "external_id": f"query-fixture:{uuid4()}",
                "source_ids": {},
                "title": name,
                "aliases": aliases,
                "media_type": kind,
            }
        )
        for name, aliases, kind in [
            ("alpha", ["Amber Telescope"], "anime"),
            ("Beta_100%", ["Amber"], "anime"),
            ("beta", [], "manga"),
            ("Gamma", [], "anime"),
        ]
    ]
    async with db.transaction(owner) as session:
        for title in titles:
            await library.ensure_media(session, title)
    entries = LibraryService(db, DisabledProvider())
    for title in titles:
        await entries.change(
            owner,
            title.id,
            LibraryWrite(status="completed" if title.title == "Gamma" else "planned"),
        )
    yield db, owner, titles, entries
    await db.close()


async def test_owned_literal_alias_type_status_search_and_filtered_counts(state):
    _, owner, titles, entries = state
    page = await entries.list_entries(
        owner, "planned", 1, None, 1, q=" amber ", media_type="anime", sort="title"
    )
    assert page.total == 2 and page.total_pages == 2 and page.data[0].media.id == titles[0].id
    assert page.query_context.model_dump() == {
        "q": "amber",
        "media_type": "anime",
        "status": "planned",
        "sort": "title",
    }
    second = await entries.list_entries(
        owner, "planned", 1, None, 2, q="amber", media_type="anime", sort="title"
    )
    assert second.data[0].media.id == titles[1].id
    assert (await entries.list_entries(owner, None, 24, None, q="_100%", sort="title")).total == 1
    assert (await entries.list_entries(owner, None, 24, None, q="%_")).total == 0
    assert (await entries.list_entries(owner, None, 24, None, q="beta", media_type="manga")).data[
        0
    ].media.id == titles[2].id
    assert (await entries.list_entries(uuid4(), None, 24, None, q="amber")).total == 0
    assert (await entries.list_entries(owner, "completed", 24, None, q="amber")).total == 0
    legacy = await entries.list_entries(owner, None, 1, None)
    with pytest.raises(AppError) as mixed:
        await entries.list_entries(owner, None, 1, legacy.next_cursor, q="amber")
    assert mixed.value.status == 422
    with pytest.raises(AppError):
        await entries.list_entries(
            owner, None, 24, None, sort="title; DROP TABLE personal.activity"
        )


async def test_sort_nulls_ties_and_real_recorded_evidence(state):
    db, owner, titles, entries = state
    initial = await entries.list_entries(owner, None, 24, None, sort="completion_recorded")
    assert initial.data[0].media.id == titles[3].id and initial.data[0].completion_recorded_at
    assert initial.data[0].completed_at is None and initial.data[0].recorded_units is None
    assert all(entry.completion_recorded_at is None for entry in initial.data[1:])
    tracker = TrackingService(db, DisabledProvider())
    for title, count in [(titles[0], 1), (titles[2], 2)]:
        session = await tracker.start(
            owner,
            StartSession(media_id=title.id, request_id=uuid4(), manual_labels=["1", "2", "3"]),
        )
        state_name = "watched" if title.media_type == "anime" else "read"
        current = await tracker.update(
            owner,
            session.id,
            ProgressWrite(
                expected_version=1, keys=[str(n) for n in range(1, count + 1)], state=state_name
            ),
        )
        if count == 1:
            await tracker.update(
                owner,
                session.id,
                ProgressWrite(expected_version=current.version, keys=["2"], state="skipped"),
            )
    progress = await entries.list_entries(owner, None, 24, None, sort="recorded_units")
    assert [(entry.media.id, entry.recorded_units) for entry in progress.data[:2]] == [
        (titles[2].id, 2),
        (titles[0].id, 1),
    ]
    assert all(entry.recorded_units is None for entry in progress.data[2:])
    # All absent personal ratings tie deterministically across numbered pages.
    pages = [
        await entries.list_entries(owner, None, 2, None, page, sort="rating") for page in [1, 2]
    ]
    assert [entry.media.id for page in pages for entry in page.data] == sorted(
        title.id for title in titles
    )
