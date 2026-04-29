# AGENTS.md — tom-mall 商城项目 Agent 指导文件

> 本文件供 OpenAI Codex 等 AI 编程 Agent 阅读，描述项目全貌、架构约定、编码规范和任务执行规则。
> **开始任何任务前，必须完整阅读本文件。**

---

## 一、项目概述

**项目名称：** tom-mall
**项目类型：** 自营电商商城（面向大众消费者）

**三端架构：**

| 端 | 目录 | 技术栈 |
|---|---|---|
| 服务端 API | `/server` | EggJS + MySQL 8.0 + Sequelize + JWT |
| 后台管理系统 | `/admin` | Vue3 + Vite + Pinia + Vue Router + Element Plus + ECharts + dayjs + axios |
| 微信小程序 | `/miniprogram` | 微信小程序原生开发 |

**核心功能模块：**
商品（含 SKU）、购物车、订单、微信支付、会员管理、系统管理（角色/管理员/菜单）、后台 Dashboard

**详细需求文档：**
- 产品需求：`docs/prd.md`
- 数据库设计：`docs/database.md`
- 接口设计：`docs/api.md`
- 开发规范：`docs/dev-guide.md`

> 实现任何功能前，先读对应的文档章节，不要凭假设编写。

---

## 二、必读约定（所有任务均适用）

### 2.1 响应格式（服务端）

所有接口统一返回以下结构，**不得自行发明其他格式**：

```json
{ "code": 0, "message": "ok", "data": {} }
```

成功用 `ctx.helper.success(data)`，失败用 `ctx.helper.fail(code, message)`，实现见 `app/extend/helper.js`。

### 2.2 日期时间格式

- 所有日期时间字段统一返回字符串格式：`YYYY-MM-DD HH:mm:ss`
- 纯日期字段返回：`YYYY-MM-DD`
- 服务端用 dayjs 格式化后再放入响应体，**不返回时间戳，不返回 ISO 8601**
- MySQL `DATETIME` 字段，Sequelize 配置 `timezone: '+08:00'`

### 2.3 图片 URL

- 数据库存储完整 URL（含域名），如 `https://oss.tom-mall.com/products/2026/04/xxx.jpg`
- 接口直接返回完整 URL，前端不做任何拼接
- 所有图片字段命名统一为 `xxxImage` 或 `xxxUrl`（camelCase）

### 2.4 金额字段

- 数据库类型：`DECIMAL(10,2)`
- 接口返回：JSON Number，保留两位小数，单位为元，如 `129.00`
- 服务端必须重新计算金额，**绝对不信任客户端传来的金额**

### 2.5 软删除

含 `deleted_at` 字段的表：`users`、`products`、`admins`

- Sequelize Model 统一设置 `paranoid: true`，自动处理软删除过滤
- 禁止对这三张表调用物理删除（`destroy()`），统一用 `update({ deletedAt: new Date() })`
- 查询时无需手动加 `WHERE deleted_at IS NULL`，paranoid 自动处理

### 2.6 分页参数默认值

所有列表接口统一：`page` 默认 `1`，`pageSize` 默认 `20`，最大 `50`。
响应结构：`{ list: [], total: 0, page: 1, pageSize: 20 }`

### 2.7 关键操作日志（新增）

以下四类操作，Service 层必须在执行完成后调用 `ctx.logger.info()` 记录日志：

| 操作 | 必须记录的字段 |
|---|---|
| 管理员登录 | adminId、username、ip、时间、成功/失败 |
| 用户下单 | userId、orderNo、payAmount、skuId 列表 |
| 支付成功回调 | orderNo、transactionId、amount、时间 |
| 订单取消 | orderNo、userId、cancelReason、触发来源（用户/超时） |

```js
// 标准写法示例（Service 层）
ctx.logger.info('[order:create] 用户下单成功', {
  userId,
  orderNo,
  payAmount,
  itemCount: items.length,
});
```

---

## 三、服务端架构约定（EggJS）

### 3.1 目录结构

```
server/
├── app/
│   ├── controller/
│   │   ├── mp/        # 小程序端（/api/v1/mp/）
│   │   └── admin/     # 后台端（/api/v1/admin/）
│   ├── service/       # 业务逻辑 + 数据库操作（唯一可以操作 DB 的层）
│   ├── model/         # Sequelize Model 定义
│   ├── middleware/
│   │   ├── jwt.js         # Token 解析，挂载 ctx.user / ctx.admin
│   │   ├── permission.js  # 后台接口权限校验
│   │   └── errorHandler.js
│   ├── schedule/
│   │   └── cancel_timeout_orders.js  # 订单超时取消定时任务
│   ├── extend/
│   │   └── helper.js  # success() / fail() / formatDate() / generateOrderNo()
│   └── router/
│       ├── mp.js
│       └── admin.js
└── config/
    ├── config.default.js
    ├── config.local.example.js  # 配置模板，提交 Git
    ├── config.local.js          # 本地实际配置，不提交 Git
    └── config.prod.js           # 生产配置，不提交 Git
```

### 3.2 三层职责边界（严格遵守）

| 层 | 职责 | 禁止事项 |
|---|---|---|
| Controller | 接收参数、参数校验、调用 Service、返回响应 | 禁止直接操作数据库、禁止写业务逻辑 |
| Service | 业务逻辑、数据库操作、事务管理 | 禁止直接操作 HTTP 请求/响应 |
| Model | Sequelize 模型定义、关联关系 | 禁止写业务逻辑 |

**Controller 标准写法：**

```js
async list() {
  const { ctx } = this;
  const { page = 1, pageSize = 20 } = ctx.query;
  const result = await ctx.service.product.getList({ page: +page, pageSize: +pageSize });
  ctx.helper.success(result);
}
```

### 3.3 Sequelize Model 规范

```js
module.exports = app => {
  const Model = app.model.define('table_name', {
    // 字段定义
  }, {
    tableName: 'table_name',
    underscored: true,   // snake_case ↔ camelCase 自动转换
    timestamps: true,    // 自动管理 createdAt / updatedAt
    paranoid: true,      // 含 deletedAt 的表才加此项
  });

  Model.associate = () => {
    // 关联关系定义
  };

  return Model;
};
```

### 3.4 事务规范（涉及多表写操作必须用事务）

需要事务的场景：创建订单、支付回调更新、取消订单归还库存、设置默认地址。

```js
const transaction = await ctx.model.transaction();
try {
  // 所有 DB 操作传入 { transaction }
  await ctx.model.Order.create({ ... }, { transaction });
  await ctx.model.ProductSku.update({ stock: ... }, { where: { id }, transaction });
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

### 3.5 库存扣减（防超卖，必须行锁）

```js
// 在事务内执行
const sku = await ctx.model.ProductSku.findOne({
  where: { id: skuId, status: 1 },
  lock: transaction.LOCK.UPDATE,  // SELECT ... FOR UPDATE
  transaction,
});
if (!sku || sku.stock < quantity) {
  throw Object.assign(new Error(`${productName}库存不足`), { code: 1001 });
}
await sku.update({ stock: sku.stock - quantity }, { transaction });
```

### 3.6 错误处理规范

业务错误统一在 Service 层抛出，全局 errorHandler 中间件捕获后格式化响应：

```js
// 抛出业务错误
const err = new Error('库存不足');
err.code = 1001;   // 业务错误码
throw err;

// errorHandler 统一捕获，HTTP 状态码统一返回 200
ctx.body = { code: err.code || 500, message: err.message, data: null };
```

### 3.7 鉴权中间件规则

- 小程序接口：`jwt({ type: 'mp' })` → 解析后挂载 `ctx.user`（含 `userId`）
- 后台接口：`jwt({ type: 'admin' })` → 解析后挂载 `ctx.admin`（含 `adminId`、`isSuper`、`permissions[]`）
- `isSuper = 1` 的管理员跳过 permission 中间件，直接放行
- Token 无效或过期：返回 `{ code: 401, message: '请先登录', data: null }`

### 3.8 路由注册规范

```js
// app/router/admin.js
const jwt  = middleware.jwt({ type: 'admin' });
const perm = middleware.permission;

router.get('/api/v1/admin/products', jwt, perm('product:list'), controller.admin.product.list);
router.post('/api/v1/admin/products', jwt, perm('product:create'), controller.admin.product.create);
```

### 3.9 订单号生成（helper.js）

```js
generateOrderNo(userId) {
  const dayjs = require('dayjs');
  const date = dayjs().format('YYYYMMDDHHmmss');                           // 14位
  const uid  = String(userId).slice(-4).padStart(4, '0');                  // 4位
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0'); // 4位
  return date + uid + rand;  // 共22位
}
```

### 3.10 定时任务（超时取消订单）

```js
// app/schedule/cancel_timeout_orders.js
module.exports = {
  schedule: { interval: '5m', type: 'worker' },
  async task(ctx) {
    const expireTime = new Date(Date.now() - 30 * 60 * 1000);
    const orders = await ctx.model.Order.findAll({
      where: { status: 0, createdAt: { [Op.lt]: expireTime } }
    });
    for (const order of orders) {
      // 开启事务：归还库存 + 更新订单状态
    }
  }
};
```

---

## 四、接口设计约定

### 4.1 路径前缀

| 端 | 前缀 | 说明 |
|---|---|---|
| 小程序端公开接口 | `/api/v1/mp/` | 无需 Token |
| 小程序端私有接口 | `/api/v1/mp/` + jwt 中间件 | 需要 Token |
| 后台管理接口 | `/api/v1/admin/` + jwt + permission | 需要 Token + 权限 |
| 支付回调 | `/api/v1/pay/` | 微信服务器直接调用，无 Token |

### 4.2 HTTP 方法语义

| 操作 | 方法 |
|---|---|
| 获取列表/详情 | GET |
| 新增资源 | POST |
| 全量更新资源 | PUT |
| 单字段操作（如上下架、禁用） | PUT（子路径，如 `/status`、`/default`） |
| 删除资源 | DELETE |
| 特定动作（如发货、取消、确认） | POST（动词子路径，如 `/ship`、`/cancel`） |

### 4.3 错误码速查

| code | 含义 |
|---|---|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录/Token 失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 数据冲突 |
| 500 | 服务器内部错误 |
| 1001 | 库存不足 |
| 1002 | 商品已下架 |
| 1003 | 订单状态不允许该操作 |
| 1004 | 支付金额不匹配 |
| 1005 | 验证码错误或过期 |

---

## 五、数据库关键约定

### 5.1 核心表关系速查

```
users ──1:N──▶ user_addresses
users ──1:1──▶ wechat_users（user_id 为空表示未绑定手机号）
users ──1:N──▶ orders
products ──1:N──▶ product_skus（specs 字段为 JSON，如 {"颜色":"红色","尺码":"M"}）
products ──1:N──▶ product_attributes（规格定义，attr_values 为 JSON 数组）
products ──1:N──▶ product_images（轮播图）
categories ──自关联──▶ categories（parent_id，最多三级）
carts → product_skus（唯一键：user_id + sku_id）
orders ──1:N──▶ order_items（快照字段：product_name / specs / price）
orders ──1:1──▶ payments
admins ──N:N──▶ roles（通过 admin_roles）
roles ──N:N──▶ menus（通过 role_menus）
```

### 5.2 快照原则

以下字段在写入时存为快照，**禁止在查询时 JOIN 原始表替代**：

| 表 | 快照字段 | 原因 |
|---|---|---|
| orders | receiver_name / receiver_mobile / receiver_address | 用户后续可修改地址 |
| order_items | product_name / product_image / specs / price | 商品信息可能变更 |

### 5.3 冗余字段同步规则

`products` 表的 `min_price`、`max_price`、`total_stock` 是冗余字段，在以下时机必须同步更新：

- 新增/修改/删除 SKU 时 → 重新计算并 UPDATE products
- 创建订单扣减库存时 → `total_stock -= quantity`
- 取消订单归还库存时 → `total_stock += quantity`

### 5.4 购物车 UPSERT

```sql
INSERT INTO carts (user_id, product_id, sku_id, quantity)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = NOW();
```

Sequelize 写法：使用 `upsert()` 或原生 SQL。

### 5.5 MVP 阶段不实现接口的表

以下表结构已建，**不要主动为它们生成接口或业务逻辑**：
`reviews`、`coupons`、`user_coupons`、`shipments`（仅录快递单号）、`banners`（SQL 维护）、`notifications`、`wechat_subscriptions`、`admin_logs`、`permissions`、`role_permissions`

---

## 六、后台管理系统约定（Vue3）

### 6.1 Pinia Store

登录成功后，`useAuthStore` 保存以下内容：

```js
{
  token: 'eyJ...',
  adminInfo: { id, username, realName, isSuper, avatar },
  menus: [],        // 动态路由来源
  permissions: []   // 按钮权限来源，如 ['product:list', 'product:create']
}
```

### 6.2 按钮权限指令

```html
<!-- 无权限时该按钮不渲染（DOM 中不存在） -->
<el-button v-permission="'product:create'">新增商品</el-button>
```

`v-permission` 指令检查 `useAuthStore().permissions` 是否包含对应标识，`isSuper=1` 始终返回 true。

### 6.3 axios 拦截器规则

- 请求拦截：自动附加 `Authorization: Bearer {token}`
- 响应拦截：`code === 0` 时 resolve `data` 字段；`code === 401` 时清除登录状态并跳转 `/login`；其他错误用 `ElMessage.error(message)` 提示后 reject

### 6.4 日期处理（dayjs）

```js
import dayjs from 'dayjs';
// 展示
dayjs('2026-04-29 15:30:12').format('YYYY-MM-DD HH:mm:ss')
// 格式化金额
`¥${Number(amount).toFixed(2)}`
```

---

## 七、微信小程序约定

### 7.1 Token 管理

- 存储：`wx.setStorageSync('token', token)`
- 读取：`wx.getStorageSync('token')`
- Token 过期（接口返回 code=401）：自动调用 `wx.login()` 获取新 code → 重新登录 → 重试原请求（静默续期，用户无感知）

### 7.2 图片上传流程

```js
// 1. 选图
const { tempFilePaths } = await wx.chooseMedia({ count: 1, mediaType: ['image'] });
// 2. 上传
wx.uploadFile({
  url: BASE_URL + '/mp/upload',
  filePath: tempFilePaths[0],
  name: 'file',
  header: { Authorization: `Bearer ${token}` },
  success: (res) => {
    const { url } = JSON.parse(res.data).data;
    // url 即为完整图片 URL，直接保存使用
  }
});
```

### 7.3 页面文件结构

每个页面目录包含：`index.js`、`index.wxml`、`index.wxss`、`index.json`。
组件放 `/components/` 目录，如 `sku-selector`（规格选择弹层）。

### 7.4 SKU 规格选择器

规格选择器是独立组件 `/components/sku-selector/`，接收 `attributes` 和 `skus` 数据，内部处理联动逻辑（已选规格与可选规格的矩阵计算），对外暴露 `selected-sku` 事件。

---

## 八、命名规范

### 8.1 服务端

| 类型 | 规范 | 示例 |
|---|---|---|
| 文件名 | snake_case | `product_sku.js` |
| 数据库字段 | snake_case | `created_at`、`product_id` |
| JS 变量/属性 | camelCase（Sequelize underscored 自动转换） | `createdAt`、`productId` |
| 路由路径 | kebab-case | `/api/v1/admin/top-products` |
| 错误提示 | 中文，具体描述对象 | `春季连衣裙（红色/M）库存不足` |

### 8.2 后台管理系统（Vue3）

| 类型 | 规范 | 示例 |
|---|---|---|
| 组件文件名 | PascalCase | `ProductList.vue` |
| 页面路由 | kebab-case | `/products/list` |
| Store | `use` + PascalCase | `useAuthStore` |
| API 函数 | 动词 + 名词 | `getProductList`、`createOrder` |

### 8.3 微信小程序

| 类型 | 规范 |
|---|---|
| 页面目录 | kebab-case，如 `product-detail` |
| 自定义组件 | kebab-case，如 `sku-selector` |
| JS 变量 | camelCase |

---

## 九、Git 规范

### 9.1 分支策略

```
main         ← 生产分支，只接受来自 dev 的 PR，禁止直接 push
dev          ← 集成分支，功能开发完成后合并
feature/xxx  ← 功能分支，如 feature/order-module
```

### 9.2 Commit Message 格式

```
feat(order): 新增创建订单接口和库存扣减逻辑
fix(cart): 修复重复加购时数量计算错误
refactor(product): 重构 SKU 保存逻辑，提取为独立 Service 方法
test(auth): 新增微信登录接口单元测试
docs: 更新 API 文档中的分页参数说明
```

---

## 十、任务执行规则

### 10.1 开始前必做

1. 阅读 `docs/prd.md` 中对应功能模块的需求说明
2. 阅读 `docs/database.md` 中涉及的表结构和业务规则
3. 阅读 `docs/api.md` 中对应接口的请求/响应格式
4. 阅读 `docs/dev-guide.md` 中对应端的编码规范

### 10.2 实现顺序

每个功能模块按以下顺序实现：

```
Model 定义（含关联关系）
  ↓
Service 层（业务逻辑 + 数据库操作）
  ↓
Controller 层（参数校验 + 调用 Service）
  ↓
路由注册（含中间件配置）
  ↓
基本测试验证
```

### 10.3 禁止事项

- 禁止绕过 Service 层在 Controller 中直接操作数据库
- 禁止在没有事务的情况下执行多表写操作
- 禁止在扣减库存时不使用行锁（`FOR UPDATE`）
- 禁止返回 `cost_price`（成本价）给小程序端接口
- 禁止在接口中信任客户端传来的金额，必须服务端重新计算
- 禁止为 MVP 暂不实现的模块（reviews、coupons 等）生成接口
- 禁止物理删除含 `deleted_at` 字段的表记录
- 禁止将 JWT Secret、数据库密码等敏感信息写入提交到 Git 的配置文件
- 禁止越权访问：小程序端接口不得返回其他用户的订单、地址等数据
- 禁止跳过日志记录：登录、下单、支付、取消四类操作必须写 logger

### 10.4 每次任务完成后自检清单

完成每个功能后，按以下清单逐项确认，全部通过再提交：

```
接口与文档
  [ ] 响应格式符合 { code, message, data } 结构
  [ ] 日期字段格式为 YYYY-MM-DD HH:mm:ss
  [ ] 图片字段返回完整 URL（含域名）
  [ ] 列表接口有分页，默认 page=1、pageSize=20
  [ ] 未向小程序端暴露 cost_price 字段

数据安全
  [ ] 多表写操作使用了事务
  [ ] 库存扣减使用了行锁（FOR UPDATE）
  [ ] 金额由服务端计算，未使用客户端传值
  [ ] 软删除表使用了 update 而非 destroy

日志与规范
  [ ] 登录/下单/支付/取消操作写了 ctx.logger.info()
  [ ] 业务错误通过 err.code 抛出，errorHandler 统一捕获
  [ ] 关键业务逻辑有中文注释
```

---

## 十一、推荐开发顺序

按以下顺序逐模块推进，每个模块完成后验证再进入下一个：

```
1.  数据库初始化（执行 docs/tom-mall_db.sql，验证表结构和初始数据）
2.  EggJS 基础搭建（目录结构、errorHandler、helper.js、config 配置）
3.  管理员登录（admins 表、JWT 签发、菜单权限树返回）
4.  商品分类管理（后台 CRUD + 小程序列表接口）
5.  商品管理（后台 CRUD + SKU 配置 + 小程序列表/详情）
6.  微信用户登录（openid 登录 + 绑定手机号流程）
7.  购物车（完整功能，含 UPSERT 和失效标记）
8.  订单（创建事务 + 状态流转 + 定时超时取消）
9.  微信支付（统一下单 + 回调验签 + 幂等处理）
10. 会员管理（后台查看列表和详情）
11. 系统管理（角色/管理员/菜单 后台 CRUD）
12. Dashboard 数据接口（概览卡片 + 图表数据）
13. 小程序首页聚合接口
```

---

## 十二、验证命令（每次提交前必须执行）

Codex 完成每个任务后，必须运行以下命令验证，全部通过才能提交代码。

### 服务端验证

```bash
cd server

# 1. 代码风格检查
npm run lint

# 2. 单元测试
npm test

# 3. 启动确认（无报错即通过）
npm run dev
# 预期输出：egg started on http://127.0.0.1:7001
```

### 后台管理系统验证

```bash
cd admin

# 1. 代码风格检查
npm run lint

# 2. 构建验证（构建通过即可，无需启动）
npm run build
```

### 接口连通性验证（服务端启动后）

每完成一个接口模块，用以下方式验证连通性：

```bash
# 验证管理员登录接口
curl -X POST http://localhost:7001/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 预期：{ "code": 0, "message": "ok", "data": { "token": "..." } }

# 验证商品列表接口（公开接口，无需 Token）
curl http://localhost:7001/api/v1/mp/products
# 预期：{ "code": 0, "message": "ok", "data": { "list": [], "total": 0 } }
```

### 验证失败处理规则

- `npm run lint` 报错 → 修复所有 lint 错误后才能继续
- `npm test` 失败 → 分析失败原因，修复后重跑，不得跳过
- 服务启动报错 → 必须排查修复，不得带错误提交
- curl 返回非预期结构 → 检查 Controller/Service/路由是否正确

---

## 十三、Agent 行为规范

### 13.1 每次输出代码前

- 先说明本次要实现什么功能、涉及哪些文件
- 不要一次性生成大量代码，按模块逐步实现
- 实现前先确认理解了对应的文档章节

### 13.2 每次输出必须包含

- **修改/新增文件列表**（路径 + 一句话说明用途）
- **功能说明**（实现了什么，关键业务逻辑在哪里）
- **验证方法**（如何确认功能正常）

### 13.3 每次完成一个模块后

- 提示用户运行验证命令（见第十二节）
- 确认无误后提醒是否提交 Git，并提供 commit 命令示例：

```bash
git add .
git commit -m "feat(product): 完成商品列表和详情接口"
git push origin feature/product-module
```

### 13.4 禁止行为

- 禁止一次性生成整个系统的所有代码
- 禁止修改任务描述中未提及的模块
- 禁止删除已有的功能代码
- 禁止在未验证当前模块的情况下开始下一个模块

---

## 十四、代码注释规范（强制）

### 14.1 注释语言和位置

- 所有注释使用**中文**
- 注释写在代码**上方**，不写行尾注释（特殊标记除外）

### 14.2 必须注释的位置

| 位置 | 要求 |
|---|---|
| 每个 Service 方法 | 功能说明 + 关键参数说明 |
| 事务代码块 | 说明事务包含哪些操作、原因 |
| 库存扣减 / 金额计算 | 说明计算逻辑和防护措施 |
| 复杂条件判断 | 说明判断的业务含义 |
| 定时任务 | 说明触发频率和执行逻辑 |
| 中间件 | 说明拦截范围和处理规则 |

### 14.3 注释规范示例

```js
// ❌ 错误写法（描述代码动作，无意义）
// 给 total 赋值
const total = price * quantity;

// ✅ 正确写法（解释业务逻辑和原因）
// 服务端重新计算订单总金额，使用数据库中的最新价格
// 不信任客户端传来的金额，防止用户篡改价格下单
const total = sku.price * quantity;


// ❌ 错误写法（函数无注释）
async createOrder(params) {
  ...
}

// ✅ 正确写法（说明功能、关键逻辑、注意事项）
/**
 * 创建订单
 * - 校验购物车商品有效性和库存
 * - 使用事务：扣减库存 → 创建订单主记录 → 创建订单明细 → 清除购物车
 * - 金额由服务端重新计算，不使用前端传值
 * @param {number} userId - 下单用户 ID
 * @param {number[]} cartIds - 选中的购物车 ID 列表
 * @param {number} addressId - 收货地址 ID
 * @param {string} remark - 买家备注（可选）
 * @returns {object} { orderId, orderNo, payAmount }
 */
async createOrder({ userId, cartIds, addressId, remark }) {
  ...
}
```

### 14.4 不需要注释的地方

- 变量赋值（值本身即说明，如 `const page = 1`）
- 简单的 CRUD 查询（如 `findByPk`、`findAll` 无特殊逻辑时）
- 框架约定代码（如 Sequelize Model 字段定义中的常规字段）
