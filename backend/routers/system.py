from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ai.llm_client import set_llm_model
from config import SCREENING_WORKERS
from stores.local_json import load_settings, save_settings
from utils import ai_signal_cache, chanlun_cache, chanlun_global_limiter

router = APIRouter()


@router.get("/health", tags=["系统"])
def health_check():
    chanlun_global_limiter.prune_stale_keys()
    return {
        "status": "ok",
        "version": "0.2.0",
        "cache": {
            "chanlun": chanlun_cache.stats(),
            "ai_signal": ai_signal_cache.stats(),
        },
        "screening_workers": SCREENING_WORKERS,
    }


@router.get("/api/settings", tags=["系统"])
def get_settings():
    return load_settings()


@router.put("/api/settings", tags=["系统"])
def update_settings(model: str = Query(..., description="AI 模型 deepseek / gemini")):
    if model not in ("deepseek", "gemini"):
        raise HTTPException(status_code=400, detail="只支持 deepseek 和 gemini")
    set_llm_model(model)
    s = load_settings()
    s["ai_model"] = model
    save_settings(s)
    return {"ai_model": model, "ok": True}
