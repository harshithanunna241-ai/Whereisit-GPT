
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    room = Column(String(100), nullable=False)
    specific_location = Column(String(200), nullable=True)

    image_path = Column(String(500), nullable=True)

    last_seen = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
