from datetime import datetime

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class BugComment(Base):
    __tablename__ = "bug_comments"

    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, ForeignKey("bugs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)  # Markdown format
    mentioned_user_ids = Column(JSON, default=list, nullable=False)  # List of mentioned user IDs
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    bug = relationship("Bug", back_populates="comments")
    user = relationship("User", back_populates="comments")
