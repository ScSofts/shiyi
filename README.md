# 拾忆 · shiyi

> 个人影像管理与智能检索平台 —— 像素合伙人的课程设计项目
>
> 照片传上去以后，能按 **时间 / 人物 / 地点 / 内容描述** 四种方式找回来，还能整理成相册分享给别人。

---

## 技术栈（刻意的"简化版"，不要随便加中间件）

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + Vite + TypeScript + TailwindCSS | |
| 后端 | Node 20 + Express + TypeScript + Prisma | |
| 数据库 | SQLite（一个文件 `data/app.db`） | 不装 PG，clone 就能跑 |
| 图片存储 | 本地磁盘 `data/uploads/` | 不用 MinIO |
| 缩略图 | sharp | |
| EXIF | exifr | 拍摄时间 / 经纬度 / 相机型号 |
| 地图 | Leaflet + OpenStreetMap 瓦片 | |
| AI 服务 | Python 3.11 + FastAPI + insightface + Chinese-CLIP | **独立进程，`MOCK_AI=1` 时不需要装模型** |

**本项目只有 3 个进程**：`web`(5173) → `api`(3000) → `ai`(8000)。没有 Redis、没有队列、没有对象存储、没有向量数据库。
理由写在 [`docs/dev-rules.md`](docs/dev-rules.md) 里——这是**刻意的工程取舍**，答辩时按那个口径讲。

---

## 目录结构

```
shiyi/
├── web/                 # 前端：React + Vite
│   └── src/
│       ├── pages/       # 7 个页面
│       ├── components/  # PhotoGrid / Viewer / UploadDialog
│       ├── mocks/       # 假数据（后端没好之前照样能开发）
│       └── api/         # 请求封装 + 类型
├── api/                 # 后端：Express + Prisma
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/      # auth assets people map search albums share
│       ├── lib/         # storage thumb exif ai
│       └── middleware/
├── ai/                  # AI 服务：FastAPI
│   ├── main.py          # /embed /search /persons/*
│   ├── face.py          # insightface
│   ├── clip.py          # Chinese-CLIP
│   └── person_match.py  # 人脸归组
├── data/                # 运行时数据（不进 git）
│   ├── app.db
│   └── uploads/
└── docs/
    ├── roles-and-acceptance.md   # ★ 分工与验收标准（先看这个）
    ├── api-contract.md           # ★ 接口契约（改接口先改它）
    └── dev-rules.md              # 开发规范
```

---

## 快速开始

### 前置：装两个东西

1. **Node.js 20+** → <https://nodejs.org/> （装 LTS 版即可）
2. **Python 3.10+** → <https://www.python.org/> （装的时候**勾选 Add to PATH**）

> 检查：打开 PowerShell 输入 `node -v` 和 `python --version`，都有版本号就对了。

### 两条命令跑起来

```powershell
# 第 1 条：装依赖 + 初始化数据库（第一次要 2~5 分钟，网慢的话更久）
npm run setup

# 第 2 条：三个服务一起启动（api / web / ai）
npm run dev

# 如果还没装 Python 依赖，用这个（只起 api + web）
# npm run dev:webapi
```

然后浏览器打开 <http://localhost:5173>，用默认账号登录：

```
邮箱：demo@shiyi.local
密码：demo1234
```

> AI 服务默认是 **mock 模式**（`MOCK_AI=1`），**不需要下载模型**就能跑通整个网站，
> 只是人物分组和搜索结果的准度是假的。想让 AI 服务也启动起来，需要先装 Python 依赖：
>
> ```powershell
> npm run setup:ai          # 装 Python 基础依赖（约 30MB，1 分钟）
> # 真实模型（约 2GB）：python -m pip install -r ai/requirements-models.txt
> ```
>
> **没装 Python 依赖也没关系**：用 `npm run dev:webapi` 只起前后端，网站照样能用，
> 只是人物页是空的、搜索会退化成按文件名匹配。
>
> 细节看 [`ai/README.md`](ai/README.md)。

### 启动后应该看到什么

| 地址 | 是什么 |
|---|---|
| <http://localhost:5173> | 前端（登录后能看到时间轴、人物、地图、搜索、相册） |
| <http://localhost:3000/api/health> | 后端健康检查，会同时告诉你 AI 服务通不通 |
| <http://localhost:8000/health> | AI 服务，返回 `{"status":"ok","mode":"mock"}` |

### 常见问题

| 现象 | 原因 / 解法 |
|---|---|
| `npm run dev` 报端口占用 | 3000 / 5173 / 8000 被别的程序占了，关掉或改 `api/.env` 的 PORT |
| 页面能开但登录报错 | 后端没起来，先跑 `npm run dev:api` 看报错 |
| 上传报错 | `data/` 目录没有写权限，或文件超过 20MB（改 `MAX_UPLOAD_MB`） |
| 人物页一直是空的 | 正常——mock 模式下人脸是假数据，要装真模型才有结果 |

### 分开启动（调试时用）

```powershell
npm run dev:web    # 只起前端
npm run dev:api    # 只起后端
npm run dev:ai     # 只起 AI 服务
```

---

## 交接状态（2026-11-18 首次提交）

**已在本机实测跑通的部分**（不是"应该能跑"，是真跑过）：

| 功能 | 状态 |
|---|---|
| 登录 → JWT 签发 → 带 token 访问 | ✅ |
| 上传 3 张图 → sharp 生成缩略图 → 存储 | ✅ |
| 时间轴列表（分页 / 按月筛选） | ✅ |
| 人物自动分组（mock 人脸） | ✅ |
| 中文语义搜索接口链路（mock 向量） | ✅ 链路通，分数无意义 |
| 相册创建 → 加照片 → 生成分享链接 → 免登录访问 | ✅ |
| 未登录访问受保护接口 | ✅ 返回 401 |
| 前端生产构建（vite build） | ✅ 137 modules，5.7s |
| 前后端 TypeScript strict 类型检查 | ✅ 0 error |

**还没做、等你们写的部分**：

- [ ] 前端所有页面现在读的是 `web/src/mocks/assets.ts` 假数据，要换成真接口（A、B）
- [ ] 地图页没数据 —— 测试图没有 GPS，用真实手机照片测试（B、D）
- [ ] 人物命名 / 合并 / 拆分的前端交互（B，接口已就绪）
- [ ] 相册新建、加照片、分享的前端交互（B，接口已就绪）
- [ ] 上传进度条（A）
- [ ] EXIF 宽高目前存的是缩略图尺寸，应改为原图尺寸（C）
- [ ] AI 真实模型接入（现在全站是 mock 模式）（D）
- [ ] 多用户注册（现在只有一个自动创建的演示账号）

---

## 分工

四个人各自的负责范围、每周任务、验收标准，全在 **[`docs/roles-and-acceptance.md`](docs/roles-and-acceptance.md)** 里。

| 同学 | 角色 | 主战场 |
|---|---|---|
| A | 前端 · 上传与浏览 | `web/src/pages/Timeline.tsx`、`web/src/components/` |
| B | 前端 · 四种查找入口 | `web/src/pages/{People,Map,Search,Albums,Shared}.tsx` |
| C | 后端 · 数据地基 | `api/prisma/`、`api/src/routes/{auth,assets}.ts` |
| D | 后端 · 智能检索 | `ai/`、`api/src/routes/{people,search,map}.ts` |

---

## 协作规则（摘要）

- 分支：`main` 保护，个人分支 `feature/xxx`，不超过 3 天，Squash Merge
- 接口：**先改 `docs/api-contract.md`，再改代码**
- 三处共享文件：`schema.prisma`（C）、`ai/`（D）、`PhotoGrid`+路由表（A）——改之前先在群里说
- 每天开工：`git fetch && git rebase origin/main`
- 周五 30 分钟集成日：全员走一遍演示路径

完整规范见 [`docs/dev-rules.md`](docs/dev-rules.md)。