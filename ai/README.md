# AI 服务（负责人：D）

这个服务只做两件事：

1. **人脸分组**：检测照片里的人脸 → 512 维特征 → 和已有人物比距离 → 归组
2. **中文语义检索**：把图片和中文描述编码到同一个向量空间 → 算相似度

> 它**不连数据库**，只做推理。数据库在 Node 后端那边。所以这个目录只有 D 修改。

---

## 两种运行模式

### 默认：mock 模式（不用装模型，1 分钟能跑）

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

特点：
- 人脸向量和图片向量都是**假数据**（由文件名哈希生成，确定性但无语义）
- 接口链路完整，整站能跑通、能演示"上传 → 出现人物 → 搜索出结果"的流程
- **搜索结果没有真实语义**，只是随机命中

**先用这个模式把整站联调通，再去装真模型。**

### 真实模式（要下载模型，约 2GB）

```powershell
python -m pip install -r requirements-models.txt
$env:MOCK_AI=0
python -m uvicorn main:app --port 8000 --reload
```

- 首次启动会自动下载：
  - `buffalo_l`（insightface 模型包，约 300MB）
  - `OFA-Sys/chinese-clip-vit-base-patch16`（约 600MB）
- **提前下载好**，答辩现场不要依赖网络
- CPU 推理：单张图约 0.3~0.5 秒

---

## 接口

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/health` | 健康检查，返回当前模式 |
| POST | `/embed` | `{assetId, imagePath}` → 人脸框 + 人脸向量 + 图片向量 |
| POST | `/search` | `{query, topK}` → `[{assetId, score}]` |
| POST | `/persons/merge` | `{keepId, mergeId}` 合并两个人物 |
| POST | `/persons/split` | `{personId, assetId}` 把照片拆出去 |
| GET | `/stats` | 当前索引了多少张图 / 多少个人 |

详细字段见 `../docs/api-contract.md` 第 8 节。

---

## 数据存在哪

`ai/data/index.json`（不进 git）。结构：

```json
{
  "clip_vectors": { "assetId": [512 个数] },
  "face_vectors": { "assetId": [[512 个数], ...] },
  "persons": { "ai_p_xxx": { "centroid": [...], "count": 3, "assets": ["a_1"] } }
}
```

**为什么不用向量数据库**：5000 张图 × 512 维，在 numpy 里暴力算余弦只要 5 毫秒。
引入 pgvector / Milvus 的运维成本远大于收益。答辩时按这个口径讲。

---

## 调试命令

```powershell
# 看服务是否正常
curl http://127.0.0.1:8000/health

# 对一张图跑一遍（Windows 注意路径用正斜杠或双反斜杠）
curl -X POST http://127.0.0.1:8000/embed -H "Content-Type: application/json" -d "{\"assetId\":\"a_test\",\"imagePath\":\"C:/path/to/photo.jpg\"}"

# 搜索
curl -X POST http://127.0.0.1:8000/search -H "Content-Type: application/json" -d "{\"query\":\"海边日落\",\"topK\":10}"
```

---

## 效果评测（W3 必做）

`eval/queries.json` 里有 20 条中文查询 + 期望能命中的照片主题。
跑一遍算 **Recall@10**：

```powershell
python eval/run_eval.py
```

> 这是 D 的交付物之一：答辩时要能说出"我们的中文检索 Recall@10 是 xx%"。