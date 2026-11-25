"""Owned sessions, manual/source targets and sparse exact progress."""

from alembic import op

revision = "002_tracking"
down_revision = "001_library"
branch_labels = None
depends_on = None


def upgrade():
    statements = [
        """CREATE TABLE personal.tracking_sessions (
          id uuid PRIMARY KEY, user_id uuid NOT NULL, media_id uuid NOT NULL,
          request_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('initial','repeat')),
          active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK(version>0),
          skip_counts boolean NOT NULL DEFAULT false, coverage_complete boolean NOT NULL DEFAULT false,
          final_total integer CHECK(final_total>0), created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
          UNIQUE(user_id,request_id), UNIQUE(user_id,id,media_id),
          FOREIGN KEY(user_id,media_id) REFERENCES personal.library_entries(user_id,media_id))""",
        "CREATE UNIQUE INDEX one_active_tracking ON personal.tracking_sessions(user_id,media_id) WHERE active",
        """CREATE TABLE personal.tracking_units (
          user_id uuid NOT NULL, session_id uuid NOT NULL, media_id uuid NOT NULL,
          key text NOT NULL CHECK(length(key) BETWEEN 1 AND 80), label text NOT NULL,
          sort_order integer NOT NULL CHECK(sort_order>0), released boolean NOT NULL,
          title text, released_at timestamptz, provenance text NOT NULL CHECK(provenance IN ('manual','provider')),
          PRIMARY KEY(user_id,session_id,key),
          UNIQUE(user_id,session_id,media_id,key),
          FOREIGN KEY(user_id,session_id,media_id) REFERENCES personal.tracking_sessions(user_id,id,media_id))""",
        """CREATE TABLE personal.unit_progress (
          user_id uuid NOT NULL, session_id uuid NOT NULL, media_id uuid NOT NULL, unit_key text NOT NULL,
          state text NOT NULL CHECK(state IN ('watched','read','skipped')),
          recorded_at timestamptz NOT NULL DEFAULT now(), rating smallint CHECK(rating BETWEEN 1 AND 10), notes text,
          PRIMARY KEY(user_id,session_id,unit_key),
          FOREIGN KEY(user_id,session_id,media_id,unit_key) REFERENCES personal.tracking_units(user_id,session_id,media_id,key))""",
        "CREATE INDEX tracking_order ON personal.tracking_units(user_id,session_id,sort_order,key)",
        "GRANT SELECT,INSERT,UPDATE ON personal.tracking_sessions,personal.tracking_units TO alcor_runtime",
        "GRANT SELECT,INSERT,UPDATE,DELETE ON personal.unit_progress TO alcor_runtime",
    ]
    for statement in statements:
        op.execute(statement)
    for table in ("tracking_sessions", "tracking_units", "unit_progress"):
        op.execute(f"ALTER TABLE personal.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE personal.{table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY owner_only ON personal.{table} TO alcor_runtime USING (user_id=nullif(current_setting('alcor.user_id',true),'')::uuid) WITH CHECK (user_id=nullif(current_setting('alcor.user_id',true),'')::uuid)"
        )


def downgrade():
    raise RuntimeError(
        "Use a reviewed forward migration or restore; destructive downgrade disabled"
    )
