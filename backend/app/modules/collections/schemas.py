from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.integrations.metadata.schemas import Media


class CollectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=100)
    request_id: UUID

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value


class CollectionUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    expected_version: int = Field(ge=1)


class ItemWrite(BaseModel):
    expected_version: int = Field(ge=1)
    position: int = Field(default=0, ge=0, le=100000)


class CollectionRead(BaseModel):
    id: UUID
    name: str
    version: int
    total: int


class CollectionList(BaseModel):
    data: list[CollectionRead]
    next_cursor: str | None


class CollectionItem(BaseModel):
    media: Media
    position: int


class CollectionDetail(CollectionRead):
    items: list[CollectionItem]
    next_offset: int | None
