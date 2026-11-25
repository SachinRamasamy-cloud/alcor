"""Private profile, preferences, saved discovery filters and dismissals."""

from alembic import op

revision = "006_preferences"
down_revision = "005_recovery"
branch_labels = None
depends_on = None


def upgrade():
    for sql in [
        "CREATE TABLE personal.profiles(user_id uuid PRIMARY KEY,display_name text NOT NULL DEFAULT '' CHECK(length(display_name)<=80),version integer NOT NULL DEFAULT 1 CHECK(version>0))",
        "CREATE TABLE personal.user_preferences(user_id uuid PRIMARY KEY,payload jsonb NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0))",
        "CREATE TABLE personal.saved_filters(id uuid PRIMARY KEY,user_id uuid NOT NULL,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),payload jsonb NOT NULL,version integer NOT NULL DEFAULT 1,request_id uuid NOT NULL,UNIQUE(user_id,request_id))",
        "CREATE TABLE personal.recommendation_feedback(user_id uuid NOT NULL,media_id uuid NOT NULL REFERENCES catalogue.media(id),dismissed boolean NOT NULL DEFAULT true,PRIMARY KEY(user_id,media_id))",
        "CREATE INDEX saved_filters_owner ON personal.saved_filters(user_id,id)",
        "GRANT SELECT,INSERT,UPDATE ON personal.profiles,personal.user_preferences TO alcor_runtime",
        "GRANT SELECT,INSERT,UPDATE,DELETE ON personal.saved_filters,personal.recommendation_feedback TO alcor_runtime",
    ]:
        op.execute(sql)
    for table in ("profiles", "user_preferences", "saved_filters", "recommendation_feedback"):
        op.execute(f"ALTER TABLE personal.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE personal.{table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY owner_only ON personal.{table} TO alcor_runtime USING(user_id=nullif(current_setting('alcor.user_id',true),'')::uuid) WITH CHECK(user_id=nullif(current_setting('alcor.user_id',true),'')::uuid)"
        )


def downgrade():
    raise RuntimeError("Use a reviewed forward migration or restore")
