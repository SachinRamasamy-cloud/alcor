"""Canonical catalogue, private library and append-only activity.

Revision ID: 001_library
Revises: none
"""

from alembic import op

revision = "001_library"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    statements = [
        "CREATE SCHEMA catalogue",
        "CREATE SCHEMA personal",
        "REVOKE ALL ON SCHEMA personal FROM PUBLIC",
        "CREATE TABLE catalogue.media (id uuid PRIMARY KEY, media_type text NOT NULL CHECK (media_type IN ('anime','manga')), external_id text NOT NULL, payload jsonb NOT NULL, UNIQUE(media_type, external_id))",
        """CREATE TABLE personal.library_entries (
          user_id uuid NOT NULL, media_id uuid NOT NULL REFERENCES catalogue.media(id),
          status text NOT NULL CHECK (status IN ('planned','in_progress','completed','on_hold','dropped','not_interested')),
          ever_completed boolean NOT NULL DEFAULT false, version integer NOT NULL DEFAULT 1 CHECK (version > 0),
          priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('high','normal','low')),
          reason text, rating smallint CHECK (rating BETWEEN 1 AND 10), notes text,
          favorite boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
          completed_at timestamptz, deleted_at timestamptz,
          PRIMARY KEY(user_id, media_id))""",
        """CREATE TABLE personal.activity (
          id uuid PRIMARY KEY, user_id uuid NOT NULL, media_id uuid REFERENCES catalogue.media(id),
          action text NOT NULL, before_state jsonb, after_state jsonb,
          occurred_at timestamptz NOT NULL DEFAULT now())""",
        "CREATE INDEX library_status_idx ON personal.library_entries(user_id,status,media_id) WHERE deleted_at IS NULL",
        "CREATE INDEX activity_user_time_idx ON personal.activity(user_id,occurred_at DESC,id)",
        "GRANT USAGE ON SCHEMA catalogue, personal TO alcor_runtime",
        "GRANT SELECT, INSERT ON catalogue.media TO alcor_runtime",
        "GRANT SELECT, INSERT, UPDATE ON personal.library_entries TO alcor_runtime",
        "GRANT SELECT, INSERT ON personal.activity TO alcor_runtime",
    ]
    for statement in statements:
        op.execute(statement)
    for table in ("library_entries", "activity"):
        op.execute(f"ALTER TABLE personal.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE personal.{table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY owner_only ON personal.{table} TO alcor_runtime USING (user_id = nullif(current_setting('alcor.user_id',true),'')::uuid) WITH CHECK (user_id = nullif(current_setting('alcor.user_id',true),'')::uuid)"
        )


def downgrade():
    raise RuntimeError(
        "Destructive downgrade is disabled; use a reviewed forward migration or restore"
    )
