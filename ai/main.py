# 负责人：D
# 拾忆 AI 服务：人脸分组 + 中文语义检索
#
# 启动：python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
# 默认 MOCK_AI=1，不需要下载任何模型；设 MOCK_AI=0 用真实模型。

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from clip import encode_image, encode_text
from face import detect_faces
from person_match import assign_person
from store import Store

MOCK = os.getenv("MOCK_AI", "1") == "1"

app = FastAPI(title="拾忆 AI 服务", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

store = Store()


class EmbedRequest(BaseModel):
    assetId: str
    imagePath: str


class SearchRequest(BaseModel):
    query: str
    topK: int = 20


class MergeRequest(BaseModel):
    keepId: str
    mergeId: str


class SplitRequest(BaseModel):
    personId: str
    assetId: str


@app.get("/health")
def health():
    return {"status": "ok", "mode": "mock" if MOCK else "real"}


@app.post("/embed")
def embed(req: EmbedRequest):
    """对一张图做人脸检测 + 图片向量编码，返回人物分组 key"""
    faces = detect_faces(req.imagePath)
    result_faces = []
    for face in faces:
        person_key = assign_person(store, req.assetId, face["vec"])
        result_faces.append({"bbox": face["bbox"], "vec": face["vec"], "personKey": person_key})

    clip_vec = encode_image(req.imagePath)
    store.put(req.assetId, clip_vec, [f["vec"] for f in result_faces])
    store.save()

    return {
        "assetId": req.assetId,
        "faces": result_faces,
        "clipVec": clip_vec,
        "mode": "mock" if MOCK else "real",
    }


@app.post("/search")
def search(req: SearchRequest):
    """中文描述 → 相似照片 id 列表"""
    query_vec = encode_text(req.query)
    hits = store.search(query_vec, req.topK)
    return {"results": [{"assetId": a, "score": s} for a, s in hits], "mode": "mock" if MOCK else "real"}


@app.post("/persons/merge")
def persons_merge(req: MergeRequest):
    store.merge_persons(req.keepId, req.mergeId)
    return {"ok": True}


@app.post("/persons/split")
def persons_split(req: SplitRequest):
    store.split_person(req.personId, req.assetId)
    return {"ok": True}


@app.get("/stats")
def stats():
    return {
        "assets": len(store.clip_vectors),
        "persons": len(store.persons),
        "faces": sum(len(v) for v in store.face_vectors.values()),
        "mode": "mock" if MOCK else "real",
    }