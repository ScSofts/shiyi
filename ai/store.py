# 负责人：D
# 向量与人物分组的存放处。
# 不引向量数据库：所有数据放在内存 dict 里，落盘成一个 JSON。
# 5000 张图的图片向量约 10MB，暴力算余弦只要几毫秒。

import json
import os
import threading

import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
INDEX_FILE = os.path.join(DATA_DIR, "index.json")


class Store:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        # assetId -> 图片向量（list[float]）
        self.clip_vectors: dict[str, list[float]] = {}
        # assetId -> 人脸向量列表
        self.face_vectors: dict[str, list[list[float]]] = {}
        # personKey -> {"centroid": list[float], "count": int, "assets": [assetId]}
        self.persons: dict[str, dict] = {}
        self._load()

    # ---------- 持久化 ----------

    def _load(self) -> None:
        if not os.path.exists(INDEX_FILE):
            return
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self.clip_vectors = raw.get("clip_vectors", {})
            self.face_vectors = raw.get("face_vectors", {})
            self.persons = raw.get("persons", {})
        except Exception as exc:  # 索引坏了不能让服务起不来
            print(f"[store] 索引读取失败，忽略：{exc}")

    def save(self) -> None:
        os.makedirs(DATA_DIR, exist_ok=True)
        with self.lock:
            with open(INDEX_FILE, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "clip_vectors": self.clip_vectors,
                        "face_vectors": self.face_vectors,
                        "persons": self.persons,
                    },
                    f,
                )

    # ---------- 写入 ----------

    def put(self, asset_id: str, clip_vec: list[float], face_vecs: list[list[float]]) -> None:
        with self.lock:
            self.clip_vectors[asset_id] = clip_vec
            self.face_vectors[asset_id] = face_vecs

    # ---------- 检索 ----------

    def search(self, query_vec: list[float], top_k: int) -> list[tuple[str, float]]:
        if not self.clip_vectors:
            return []
        ids = list(self.clip_vectors.keys())
        mat = np.asarray([self.clip_vectors[i] for i in ids], dtype=np.float32)
        q = np.asarray(query_vec, dtype=np.float32)

        # 余弦相似度 = 点积 / (|a||b|)
        denom = np.linalg.norm(mat, axis=1) * (np.linalg.norm(q) + 1e-8)
        scores = (mat @ q) / (denom + 1e-8)
        order = np.argsort(-scores)[:top_k]
        return [(ids[i], float(scores[i])) for i in order]

    def merge_persons(self, keep_id: str, merge_id: str) -> None:
        keep = self.persons.get(keep_id)
        merge = self.persons.get(merge_id)
        if not keep or not merge:
            return
        total = keep["count"] + merge["count"]
        centroid = (
            np.asarray(keep["centroid"]) * keep["count"] + np.asarray(merge["centroid"]) * merge["count"]
        ) / max(total, 1)
        keep["centroid"] = centroid.tolist()
        keep["count"] = total
        keep["assets"] = list(set(keep.get("assets", [])) | set(merge.get("assets", [])))
        self.persons.pop(merge_id, None)
        self.save()

    def split_person(self, person_id: str, asset_id: str) -> None:
        person = self.persons.get(person_id)
        if not person:
            return
        person["assets"] = [a for a in person.get("assets", []) if a != asset_id]
        person["count"] = len(person["assets"])
        self.save()