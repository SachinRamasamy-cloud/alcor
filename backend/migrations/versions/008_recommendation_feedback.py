"""Versioned recommendation-only feedback; preserve unknown legacy provenance."""

from alembic import op

revision = "008_recommendation_feedback"
down_revision = "007_source_identity"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE personal.recommendation_feedback ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0), ADD COLUMN updated_at timestamptz, ADD COLUMN context text CHECK(context IN ('favorites','taste','similar','management'))"
    )


def downgrade():
    raise RuntimeError("Use a reviewed forward migration or restore")
