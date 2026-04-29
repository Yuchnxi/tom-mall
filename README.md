<div align="center">

# 🛍️ tom-mall

**面向大众消费者的自营电商商城**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![EggJS](https://img.shields.io/badge/EggJS-3.x-brightgreen)](https://eggjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![Vue](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js&logoColor=white)](https://vuejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 📖 项目简介

tom-mall 是一套完整的自营电商商城解决方案，包含**微信小程序**（用户端）、**Vue3 后台管理系统**和**EggJS 服务端 API** 三端。

**核心功能：** 商品管理（含 SKU 多规格）、购物车、订单流程、微信支付、会员管理、角色权限管理（RBAC）、后台数据看板。

---

## 🗂️ 项目结构

```
tom-mall/
├── server/              # 服务端（EggJS + MySQL）
├── admin/               # 后台管理系统（Vue3 + Element Plus）
├── miniprogram/         # 微信小程序（原生开发）
├── docs/
│   ├── prd.md           # 产品需求文档
│   ├── database.md      # 数据库设计文档
│   ├── api.md           # 接口设计文档
│   └── dev-guide.md     # 开发规范文档
├── AGENTS.md            # AI Agent 指导文件（供 Codex 等阅读）
└── README.md
```

---

## 🛠️ 技术栈

| 端 | 技术 |
|---|---|
| **服务端** | EggJS 3.x · MySQL 8.0 · Sequelize · JWT |
| **后台管理** | Vue 3 · Vite · Pinia · Vue Router · Element Plus · ECharts · dayjs · axios |
| **微信小程序** | 微信小程序原生 · wx.requestPayment |
| **文件存储** | 阿里云 OSS（开发环境可用本地 public 目录） |

---

## ✨ 功能模块

### 小程序端（用户）
- 首页（轮播图、分类入口、推荐/热门/新品商品）
- 商品列表（分类筛选、多维度排序、触底加载）
- 商品详情（多规格 SKU 联动选择、库存状态）
- 搜索（关键词搜索、历史记录）
- 购物车（服务端存储、多设备同步）
- 订单（创建、支付、取消、确认收货）
- 微信支付（wx.requestPayment）
- 个人中心（用户信息、收货地址管理）

### 后台管理系统（管理员）
- Dashboard（今日订单、销售额、用户数、待处理订单；ECharts 图表）
- 商品管理（商品 CRUD、SKU 配置、上下架、图片上传）
- 分类管理（多级树形分类）
- 订单管理（筛选查询、发货操作）
- 会员管理（用户列表、详情、禁用/启用）
- 系统管理（管理员、角色、菜单 RBAC 权限体系）

---

## 🚀 快速开始

### 环境要求

| 工具 | 版本要求 |
|---|---|
| Node.js | ≥ 18.0 |
| MySQL | ≥ 8.0 |
| 微信开发者工具 | 最新稳定版 |
| pnpm / npm | 任意 |

### 1. 克隆项目

```bash
git clone https://github.com/yourname/tom-mall.git
cd tom-mall
```

### 2. 初始化数据库

```bash
# 登录 MySQL 执行初始化 SQL
mysql -u root -p < docs/tom-mall_db.sql
```

> SQL 文件包含建表语句和初始数据（默认管理员账号、角色、菜单、系统配置）。

### 3. 启动服务端

```bash
cd server
npm install

# 复制本地配置模板
cp config/config.local.example.js config/config.local.js
# 编辑 config.local.js，填写数据库密码、JWT Secret、微信配置等

npm run dev
# 服务启动在 http://localhost:7001
```

**config.local.js 必填项：**

```js
module.exports = {
  sequelize: {
    password: 'your_mysql_password',
  },
  jwt: {
    secret: 'your_random_jwt_secret',
  },
  wechat: {
    appId: 'your_wechat_app_id',
    appSecret: 'your_wechat_app_secret',
  },
};
```

### 4. 启动后台管理系统

```bash
cd admin
npm install
npm run dev
# 访问 http://localhost:5173
```

**默认管理员账号：**

| 账号 | 密码 |
|---|---|
| admin | admin123 |

> ⚠️ 生产部署前请务必修改默认密码。

### 5. 启动微信小程序

1. 打开**微信开发者工具**，导入 `miniprogram/` 目录
2. 在 `miniprogram/utils/request.js` 中将 `BASE_URL` 改为本地服务地址：
   ```js
   const BASE_URL = 'http://localhost:7001/api/v1';
   ```
3. 在微信开发者工具中填入你的小程序 AppID（需已在微信公众平台注册）
4. 点击编译预览

---

## 🗄️ 数据库说明

数据库名：`tom-mall`，共 28 张表，核心表 17 张。

| 模块 | 核心表 |
|---|---|
| 用户 | users · user_addresses · wechat_users |
| 商品 | categories · products · product_skus · product_attributes · product_images |
| 购物车 | carts |
| 订单 | orders · order_items |
| 支付 | payments |
| 后台管理 | admins · roles · menus · admin_roles · role_menus |
| 系统 | system_configs · file_uploads |

> 详细表结构、字段说明、关联关系见 [`docs/database.md`](docs/database.md)

---

## 📡 接口说明

| 前缀 | 说明 |
|---|---|
| `/api/v1/mp/` | 小程序端接口 |
| `/api/v1/admin/` | 后台管理接口（需 JWT + 权限） |
| `/api/v1/pay/` | 支付回调（微信服务器调用） |

**统一响应格式：**

```json
{ "code": 0, "message": "ok", "data": {} }
```

> 完整接口文档见 [`docs/api.md`](docs/api.md)

---

## 📁 文档索引

| 文档 | 说明 |
|---|---|
| [`docs/prd.md`](docs/prd.md) | 产品需求文档：功能模块详细说明、MVP 范围、业务规则 |
| [`docs/database.md`](docs/database.md) | 数据库设计：表结构、关联关系、索引设计、业务规则 |
| [`docs/api.md`](docs/api.md) | 接口设计：全部接口的请求/响应格式、鉴权说明 |
| [`docs/dev-guide.md`](docs/dev-guide.md) | 开发规范：目录结构、编码规范、命名约定、Git 规范 |
| [`AGENTS.md`](AGENTS.md) | AI Agent 指导文件：供 Codex 等 AI 编程工具阅读 |

---

## 🔐 权限体系（RBAC）

后台管理基于角色的权限控制，三层结构：

```
管理员（admins）
  └── 关联角色（roles） via admin_roles
        └── 关联菜单（menus） via role_menus
              └── 包含权限标识（permission 字段，如 product:create）
```

内置角色：

| 角色 | 标识 | 说明 |
|---|---|---|
| 超级管理员 | super_admin | 跳过所有权限校验 |
| 运营人员 | operator | 商品、订单管理 |
| 客服人员 | customer_service | 订单查看与处理 |

---

## 📋 MVP 范围

**已实现：** 商品（含 SKU）· 购物车 · 订单 · 微信支付 · 首页 · 搜索 · 会员列表 · 系统管理 · Dashboard

**预留（表结构已建，接口待开发）：**

| 功能 | 对应表 |
|---|---|
| 优惠券 / 满减 | coupons · user_coupons |
| 商品评价 | reviews |
| 物流轨迹查询 | shipments |
| 首页轮播管理 | banners |
| 消息通知 | notifications |
| 管理员操作日志 | admin_logs |

---

## 📦 部署说明

### 服务端（生产）

```bash
cd server
npm run start      # 启动（EggJS 多进程模式）
npm run stop       # 停止
npm run reload     # 热重载
```

推荐配合 Nginx 反向代理，将 `/api` 请求转发至 `localhost:7001`。

### 后台管理系统（生产）

```bash
cd admin
npm run build      # 构建产物输出至 dist/
# 将 dist/ 目录部署到 Nginx 静态目录
```

### 环境变量 / 敏感配置

以下文件**不提交 Git**（已加入 `.gitignore`）：

```
server/config/config.local.js
server/config/config.prod.js
```

参考模板：`server/config/config.local.example.js`

---

## 🤝 参与开发

```bash
# 基于 dev 分支创建功能分支
git checkout dev
git checkout -b feature/your-feature

# 提交规范
git commit -m "feat(order): 新增创建订单接口"

# 向 dev 分支发起 Pull Request
```

Commit Message 类型：`feat` · `fix` · `refactor` · `test` · `docs` · `chore`

---

## 📄 License

[MIT](LICENSE) © 2026 tom-mall
