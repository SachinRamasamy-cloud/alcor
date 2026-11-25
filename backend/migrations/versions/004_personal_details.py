"""Personal title tags and independent per-unit ratings and notes."""

from alembic import op

revision = "004_personal_details"
down_revision = "003_collections"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE personal.library_entries ADD COLUMN tags text[] NOT NULL DEFAULT '{}'")
    op.execute(
        "ALTER TABLE personal.tracking_units ADD COLUMN rating smallint CHECK(rating BETWEEN 1 AND 10), ADD COLUMN notes text"
    )
    op.execute(
        "UPDATE personal.tracking_units u SET rating=p.rating,notes=p.notes FROM personal.unit_progress p WHERE (u.user_id,u.session_id,u.key)=(p.user_id,p.session_id,p.unit_key) AND(p.rating IS NOT NULL OR p.notes IS NOT NULL)"
    )


def downgrade():
    raise RuntimeError("Use a reviewed forward migration or restore")
