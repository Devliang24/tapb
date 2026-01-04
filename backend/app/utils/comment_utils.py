import re
from typing import List
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.project import ProjectMember


def extract_mentions(content: str, db: Session, project_id: int) -> List[int]:
    """
    Extract @mentions from comment content and return list of valid user IDs.
    
    Supports two formats:
    - @[username]
    - @username (word characters only, stops at whitespace or punctuation)
    
    Args:
        content: The comment content in markdown format
        db: Database session
        project_id: Project ID to validate users are members
    
    Returns:
        List of unique user IDs that are mentioned and are project members
    """
    # Pattern to match @[username] or @username
    # @[username] - matches @ followed by text in square brackets
    # @username - matches @ followed by word characters
    pattern = r'@\[([^\]]+)\]|@(\w+)'
    
    matches = re.findall(pattern, content)
    
    # Flatten matches (each match is a tuple with two groups)
    usernames = []
    for match in matches:
        username = match[0] if match[0] else match[1]
        if username:
            usernames.append(username)
    
    if not usernames:
        return []
    
    # Get unique usernames
    unique_usernames = list(set(usernames))
    
    # Get project member IDs
    project_member_ids = db.query(ProjectMember.user_id).filter(
        ProjectMember.project_id == project_id
    ).all()
    member_ids = [m[0] for m in project_member_ids]
    
    # Query users by username who are also project members
    users = db.query(User).filter(
        User.username.in_(unique_usernames),
        User.id.in_(member_ids)
    ).all()
    
    # Return list of user IDs
    return [user.id for user in users]
