"""Private collections with independent membership and soft deletion."""

from alembic import op

revision = "003_collections"
down_revision = "002_tracking"
branch_labels = None
depends_on = None


def upgrade():
    for sql in [
        """CREATE TABLE personal.collections(id uuid PRIMARY KEY,user_id uuid NOT NULL,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),request_id uuid NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),deleted_at timestamptz,UNIQUE(user_id,id),UNIQUE(user_id,request_id))""",
        """CREATE TABLE personal.collection_items(user_id uuid NOT NULL,collection_id uuid NOT NULL,media_id uuid NOT NULL REFERENCES catalogue.media(id),position integer NOT NULL CHECK(position>=0),PRIMARY KEY(user_id,collection_id,media_id),FOREIGN KEY(user_id,collection_id) REFERENCES personal.collections(user_id,id))""",
        "CREATE INDEX collections_owner ON personal.collections(user_id,id) WHERE deleted_at IS NULL",
        "CREATE INDEX collection_position ON personal.collection_items(user_id,collection_id,position,media_id)",
        "GRANT SELECT,INSERT,UPDATE ON personal.collections TO alcor_runtime",
        "GRANT SELECT,INSERT,UPDATE,DELETE ON personal.collection_items TO alcor_runtime",
    ]:
        op.execute(sql)
    for table in ("collections", "collection_items"):
        op.execute(f"ALTER TABLE personal.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE personal.{table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY owner_only ON personal.{table} TO alcor_runtime USING(user_id=nullif(current_setting('alcor.user_id',true),'')::uuid) WITH CHECK(user_id=nullif(current_setting('alcor.user_id',true),'')::uuid)"
        )


def downgrade():
    raise RuntimeError("Use a reviewed forward migration or restore")
