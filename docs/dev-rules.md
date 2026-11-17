# 开发规范

> 规则不用多，**能执行**最重要。以下六条是底线，其余靠自觉。

---

## 1. Git 流程

### 分支

```
main                  ← 保护分支，永远能跑；合并需要 1 人 approve
 └ feature/xxx-简述    ← 个人分支，生命周期不超过 3 天
```

命名示例：`feature/upload`, `feature/people-page`, `fix/viewer-escape-key`, `chore/readme`

> **仓库管理员**：`Settings → Branches → Add branch protection rule`，对 `main` 勾选
> "Require a pull request before merging" + "Require approvals: 1"。
> W1 期间可以先不开（方便大家初始化），W2 开始强制。

### 每天开工第一件事

```powershell
git fetch
git rebase origin/main
```

### 提交信息

格式：`类型(模块): 一句话`

```
feat(timeline): 时间轴按月分组吸顶
fix(search): 中文关键词为空时不再请求接口
docs(contract): 补充人物合并接口
chore(deps): 升级 vite 到 5.4
```

类型：`feat` 新功能 / `fix` 修 Bug / `refactor` 重构 / `docs` 文档 / `test` 测试 / `chore` 杂项

**禁止**：`update`、`修改`、`111`、`.`、一次提交改 20 个不相干文件

### 合并

- 用 **Squash Merge**（一个 PR 变成 main 上的一条提交，出问题一条 `git revert` 回滚）
- PR 当天开、**48 小时内合并或关闭**
- 合并前先 `git rebase origin/main`，本地跑通再推

---

## 2. 三处共享文件（改之前必须在群里说）

| 文件 | 负责人 | 为什么 |
|---|---|---|
| `api/prisma/schema.prisma` | **C** | 数据库迁移一旦分叉就没法自动合并 |
| `ai/` 整个目录 | **D** | Python 环境只有一个人维护，别人只调 HTTP 接口 |
| `web/src/components/PhotoGrid.tsx`、`web/src/App.tsx` 路由表 | **A** | 所有页面都在用 |

**其他人要用可以，要改先发一句："🟡 我要动 PhotoGrid"**，避免两个人同时改同一个文件。

---

## 3. 接口与数据格式

1. **先改 `docs/api-contract.md`，再改代码。**
2. 统一响应体：
   ```json
   { "data": {}, "meta": { "page": 1, "pageSize": 50, "total": 100 } }
   { "error": { "code": "NOT_FOUND", "message": "照片不存在" } }
   ```
3. **时间一律 ISO-8601 UTC 字符串**：`2026-11-17T10:00:00.000Z`。
   ❌ 不要传 `1731900000000` 这种时间戳数字，❌ 不要传 `2026-11-17 10:00` 这种本地时间字符串。
   （这是"按月份分组""往年今日"最容易出错的地方。）
4. 所有查询必须带 `ownerId` 过滤——哪怕现在只有一个账号，答辩被问"多用户怎么办"能答上。
5. 访问别人的资源返回 **404 而不是 403**（不泄露资源是否存在）。

---

## 4. 代码规范

### 文件与命名

| 类型 | 规范 | 例子 |
|---|---|---|
| 前端组件 | `PascalCase.tsx` | `PhotoGrid.tsx` |
| 前端页面 | `PascalCase.tsx` | `Timeline.tsx` |
| 函数 / 变量 | `camelCase` | `getAssetsByMonth` |
| 常量 | `UPPER_SNAKE` | `MAX_UPLOAD_SIZE` |
| 后端路由文件 | 小写 | `assets.ts` |
| Python 模块 | `snake_case` | `person_match.py` |

### 其他

- TypeScript 开 `strict`，**不要写 `any`**（实在不知道类型用 `unknown`）
- **单文件不超过 300 行**，超了就拆
- 后端路由里不写业务逻辑，逻辑放 `lib/` 或 `service/`，方便单测
- 每个文件第一行写 `// 负责人：X`，方便找人

---

## 5. "做完"的定义（DoD）

一个功能算做完，要同时满足：

1. 代码在 `main` 上（PR 已合并）
2. `npm run dev` 能跑起来，无红色报错
3. 自己**手动点过一遍**，把截图贴到 PR 里
4. 改了接口 → `docs/api-contract.md` 已同步
5. 改了数据库 → 群里说过，迁移能跑通
6. 没有把 `data/` 里的照片、`.env`、模型文件提交上来

---

## 6. 为什么这么"简陋"（答辩口径，别改）

有评委可能会问："为什么不用 Redis / MinIO / 向量数据库？"

**这样答：**

> "我们按数据量级做了取舍。个人相册大约 5000 张照片：
> 向量检索用暴力余弦，在 Node 里 5 毫秒就能算完 5000 个 512 维向量，引入向量库的运维成本大于收益；
> 图片总量约 25GB，本地文件系统加一个路径字段就够了，对象存储是为水平扩展准备的，我们不需要；
> 单张照片处理耗时 1 秒左右，同步处理即可，消息队列是为削峰和重试准备的，我们的并发只是'一次传 20 张'。
>
> **我们的原则是：只在必要处引入复杂度。** 真正有技术含量的是 AI 推理和四种索引的数据模型，这两部分我们做完整了。"

---

## 7. 常见坑

| 坑 | 解法 |
|---|---|
| 端口被占用 | `api` 3000 / `web` 5173 / `ai` 8000，改 `.env` 里端口 |
| 前端调接口 404 | 前端用 `/api/xxx`（相对路径），`vite.config.ts` 已配代理到 3000 |
| 上传后时间不对 | EXIF 里没有时区信息，统一按 `Asia/Shanghai` 兜底，存 UTC |
| Windows 路径反斜杠 | 存路径时统一用 `/`，取文件时转回 `path.join` |
| 照片没进时间轴 | `takenAt` 为空时用 `createdAt` 兜底，不要过滤掉 |
| `git pull` 冲突 | 先 `git stash`，`git pull --rebase`，再 `git stash pop` |