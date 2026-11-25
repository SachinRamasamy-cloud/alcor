"""Namespace source identities without changing existing personal foreign keys."""

from alembic import op

revision = "007_source_identity"
down_revision = "006_preferences"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "CREATE TABLE catalogue.source_ids(namespace text NOT NULL CHECK(namespace IN ('mal','anilist')),media_type text NOT NULL CHECK(media_type IN ('anime','manga')),external_id text NOT NULL,media_id uuid NOT NULL REFERENCES catalogue.media(id),PRIMARY KEY(namespace,media_type,external_id))"
    )
    op.execute("CREATE INDEX source_ids_media ON catalogue.source_ids(media_id)")
    op.execute(
        "INSERT INTO catalogue.source_ids SELECT 'mal',media_type,external_id,id FROM catalogue.media WHERE external_id ~ '^[0-9]+$'"
    )
    op.execute("GRANT SELECT,INSERT ON catalogue.source_ids TO alcor_runtime")


def downgrade():
    raise RuntimeError("Use a reviewed forward migration or restore")
