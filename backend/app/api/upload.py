import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/upload", tags=["upload"])

# 图片存储目录
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "images")

# 确保目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 允许的图片类型
ALLOWED_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image and return its URL"""
    # 检查文件类型
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="不支持的图片格式，仅支持 PNG、JPEG、GIF、WebP")
    
    # 读取文件内容
    content = await file.read()
    
    # 检查文件大小
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="图片大小不能超过 10MB")
    
    # 生成唯一文件名
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    date_prefix = datetime.now().strftime("%Y%m%d")
    filename = f"{date_prefix}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # 保存文件
    with open(filepath, "wb") as f:
        f.write(content)
    
    # 返回图片 URL
    return {
        "url": f"/api/upload/images/{filename}",
        "filename": filename
    }


@router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve uploaded images"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="图片不存在")
    
    return FileResponse(filepath)
