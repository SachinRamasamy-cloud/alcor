"""Owned, idempotent undo records for audited recoverable changes."""

from alembic import op

revision = "005_recovery"
down_revision = "004_personal_details"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE personal.activity ADD CONSTRAINT activity_owner_id UNIQUE(user_id,id)")
    op.execute(
        "CREATE TABLE personal.undo_actions(user_id uuid NOT NULL,activity_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,activity_id),FOREIGN KEY(user_id,activity_id) REFERENCES personal.activity(user_id,id))"
    )
    op.execute("GRANT SELECT,INSERT ON personal.undo_actions TO alcor_runtime")
    op.execute("ALTER TABLE personal.undo_actions ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE personal.undo_actions FORCE ROW LEVEL SECURITY")
    op.execute(
        "CREATE POLICY owner_only ON personal.undo_actions TO alcor_runtime USING(user_id=nullif(current_setting('alcor.user_id',true),'')::uuid) WITH CHECK(user_id=nullif(current_setting('alcor.user_id',true),'')::uuid)"
    )


def downgrade():
    raise RuntimeError("Use a reviewed forward migration or restore")
