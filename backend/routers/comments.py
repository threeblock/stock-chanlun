from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.akshare_service import normalize_stock_code
from stores.local_json import (
    comments_add,
    comments_delete,
    comments_get,
    comments_update,
)

router = APIRouter()


class CommentBody(BaseModel):
    content: str = Field(..., min_length=1, max_length=8000)


@router.get("/api/comments/{stock_code}", tags=["评论"])
def get_comments(stock_code: str):
    sym, _ = normalize_stock_code(stock_code)
    items = comments_get(sym)
    items = sorted(items, key=lambda x: x.get("createdAt", ""), reverse=True)
    return {"comments": items, "total": len(items)}


@router.post("/api/comments/{stock_code}", tags=["评论"])
def add_comment(stock_code: str, comment_in: CommentBody):
    sym, _ = normalize_stock_code(stock_code)
    content = comment_in.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="笔记内容不能为空")

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    comment = {
        "id": str(uuid.uuid4()),
        "stockCode": sym,
        "content": content,
        "createdAt": now,
        "updatedAt": now,
    }
    comments_add(sym, comment)
    return {"comment": comment, "added": True}


@router.put("/api/comments/{stock_code}/{comment_id}", tags=["评论"])
def update_comment(stock_code: str, comment_id: str, comment_in: CommentBody):
    sym, _ = normalize_stock_code(stock_code)
    content = comment_in.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="笔记内容不能为空")

    updated = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if not comments_update(sym, comment_id, content, updated):
        raise HTTPException(status_code=404, detail="笔记不存在")
    for c in comments_get(sym):
        if c.get("id") == comment_id:
            return {"comment": c, "updated": True}
    raise HTTPException(status_code=404, detail="笔记不存在")


@router.delete("/api/comments/{stock_code}/{comment_id}", tags=["评论"])
def delete_comment(stock_code: str, comment_id: str):
    sym, _ = normalize_stock_code(stock_code)
    if not comments_delete(sym, comment_id):
        raise HTTPException(status_code=404, detail="笔记不存在")
    return {"id": comment_id, "deleted": True}
