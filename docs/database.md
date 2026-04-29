# DATABASE — tom-mall 数据库设计文档

> 版本：v1.1
> 数据库：MySQL 8.0+
> 字符集：utf8mb4 / utf8mb4_unicode_ci
> 引擎：InnoDB
> 更新时间：2026-04-29

---

## 一、数据库总览

数据库名：`tom-mall`，共 **28 张表**，MVP 阶段使用 **17 张核心表**。

### 1.1 核心表（MVP 使用）

| 模块 | 表名 |
|---|---|
| 用户 | users、user_addresses、wechat_users |
| 商品 | categories、products、product_skus、product_attributes、product_images |
| 购物车 | carts |
| 订单 | orders、order_items |
| 支付 | payments |
| 后台管理 | admins、roles、menus、admin_roles、role_menus |
| 系统 | system_configs、file_uploads |

### 1.2 预留表（表结构已建，MVP 不开发接口）

| 表名 | 预留功能 |
|---|---|
| permissions、role_permissions | 操作级权限（MVP 仅做菜单权限） |
| reviews | 商品评价 |
| coupons、user_coupons | 优惠券营销 |
| shipments | 物流轨迹 |
| banners | 首页轮播图管理 |
| notifications | 消息通知 |
| wechat_subscriptions | 微信订阅消息 |
| admin_logs | 管理员操作日志 |

---

## 二、主要表关系说明

```
users ──1:N──▶ user_addresses       用户有多个收货地址
users ──1:1──▶ wechat_users         用户绑定一个微信账号
users ──1:N──▶ carts                用户有多条购物车记录
users ──1:N──▶ orders               用户有多个订单

products ──1:N──▶ product_skus      商品有多个 SKU
products ──1:N──▶ product_attributes 商品有多个规格属性定义
products ──1:N──▶ product_images    商品有多张轮播图
categories ──1:N──▶ products        分类包含多个商品
categories ──1:N──▶ categories      分类自关联（parent_id）

carts.sku_id ──▶ product_skus       购物车关联 SKU
carts.product_id ──▶ products       购物车关联商品（冗余，方便查询）

orders ──1:N──▶ order_items         订单有多条商品明细
orders ──1:1──▶ payments            订单对应一条支付记录

admins ──N:N──▶ roles（通过 admin_roles）
roles  ──N:N──▶ menus（通过 role_menus）
```

---

## 三、核心表结构详细说明

---

### 3.1 用户模块

#### users — 用户主表

```sql
CREATE TABLE `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '用户ID',
  `username`      VARCHAR(50)     NOT NULL                 COMMENT '用户名',
  `password`      VARCHAR(255)    NOT NULL                 COMMENT '密码（bcrypt加密）',
  `nickname`      VARCHAR(50)     DEFAULT NULL             COMMENT '昵称',
  `avatar`        VARCHAR(500)    DEFAULT NULL             COMMENT '头像完整URL',
  `mobile`        VARCHAR(20)     DEFAULT NULL             COMMENT '手机号（唯一）',
  `email`         VARCHAR(100)    DEFAULT NULL             COMMENT '邮箱',
  `gender`        TINYINT         DEFAULT 0                COMMENT '性别：0未知 1男 2女',
  `birthday`      DATE            DEFAULT NULL             COMMENT '生日',
  `status`        TINYINT         DEFAULT 1                COMMENT '状态：0禁用 1正常',
  `last_login_at` DATETIME        DEFAULT NULL             COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50)     DEFAULT NULL             COMMENT '最后登录IP',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME        DEFAULT NULL             COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mobile` (`mobile`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
);
```

**设计说明：**
- 软删除：`deleted_at IS NULL` 为正常记录，所有查询必须加此条件
- 禁用用户（status=0）登录时接口返回 401，提示"账号已被禁用"
- avatar 存储完整 URL（含域名），前端直接使用，不做拼接

---

#### wechat_users — 微信用户信息

```sql
CREATE TABLE `wechat_users` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL  COMMENT '关联 users.id，绑定手机号后填入',
  `openid`      VARCHAR(100)    NOT NULL      COMMENT '微信 openid（唯一标识）',
  `unionid`     VARCHAR(100)    DEFAULT NULL  COMMENT '微信 unionid',
  `nickname`    VARCHAR(100)    DEFAULT NULL  COMMENT '微信昵称',
  `avatar`      VARCHAR(500)    DEFAULT NULL  COMMENT '微信头像',
  `session_key` VARCHAR(255)    DEFAULT NULL  COMMENT '会话密钥（每次登录刷新）',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_user_id` (`user_id`)
);
```

**微信登录完整流程：**

```
小程序 wx.login()
    │ 返回 code
    ▼
POST /api/v1/mp/auth/login { code }
    │
    ├─ 调微信接口：code → openid + session_key
    │
    ├─ 查 wechat_users WHERE openid = ?
    │
    ├─ [不存在] → INSERT wechat_users（user_id=NULL）
    │              → 生成临时 JWT（payload: { wechatId, bound: false }）
    │              → 前端跳转"绑定手机号"页
    │
    └─ [已存在] ─┬─ user_id 不为空 → 查 users，生成正式 JWT（payload: { userId }）
                 └─ user_id 为空   → 生成临时 JWT，引导绑定手机号

绑定手机号流程（POST /api/v1/mp/auth/bind-mobile）：
    │
    ├─ 验证手机验证码
    ├─ 查 users WHERE mobile = ?
    ├─ [不存在] → INSERT users（从 wechat_users 取昵称和头像）
    └─ UPDATE wechat_users SET user_id = ? WHERE openid = ?
       → 返回正式 JWT
```

---

#### user_addresses — 收货地址

```sql
CREATE TABLE `user_addresses` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `receiver_name`   VARCHAR(50)     NOT NULL,
  `receiver_mobile` VARCHAR(20)     NOT NULL,
  `province`        VARCHAR(50)     NOT NULL,
  `city`            VARCHAR(50)     NOT NULL,
  `district`        VARCHAR(50)     NOT NULL,
  `detail`          VARCHAR(200)    NOT NULL  COMMENT '详细地址',
  `postcode`        VARCHAR(20)     DEFAULT NULL,
  `is_default`      TINYINT         DEFAULT 0 COMMENT '0否 1是',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`)
);
```

**设计说明：**
- 每个用户最多 5 个地址（Service 层控制，超出提示）
- 设置默认地址：事务内先 `UPDATE SET is_default=0 WHERE user_id=?`，再 `UPDATE SET is_default=1 WHERE id=?`
- 下单时将 province+city+district+detail 拼接为完整地址存入 orders.receiver_address 快照

---

### 3.2 商品模块

#### categories — 商品分类

```sql
CREATE TABLE `categories` (
  `id`        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `parent_id` INT UNSIGNED  DEFAULT 0   COMMENT '父级ID，0为顶级',
  `name`      VARCHAR(100)  NOT NULL,
  `icon`      VARCHAR(500)  DEFAULT NULL COMMENT '完整图标URL',
  `image`     VARCHAR(500)  DEFAULT NULL COMMENT '完整图片URL',
  `sort`      INT           DEFAULT 0   COMMENT '数字越小越靠前',
  `level`     TINYINT       DEFAULT 1   COMMENT '1一级 2二级 3三级',
  `status`    TINYINT       DEFAULT 1   COMMENT '0禁用 1启用',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status_sort` (`status`, `sort`)
);
```

**设计说明：**
- level 冗余存储层级，避免递归查询父子关系时计算层级
- 查询顶级启用分类：`WHERE parent_id = 0 AND status = 1 ORDER BY sort ASC`
- 禁用父分类不自动级联禁用子分类，Service 层提示"请先禁用子分类"

---

#### products — 商品主表

```sql
CREATE TABLE `products` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`  INT UNSIGNED    NOT NULL    COMMENT '所属分类ID',
  `name`         VARCHAR(200)    NOT NULL    COMMENT '商品名称',
  `subtitle`     VARCHAR(300)    DEFAULT NULL,
  `main_image`   VARCHAR(500)    NOT NULL    COMMENT '主图完整URL',
  `description`  LONGTEXT        DEFAULT NULL COMMENT '图文详情（富文本HTML）',
  `brand`        VARCHAR(100)    DEFAULT NULL,
  `unit`         VARCHAR(20)     DEFAULT '件',
  `min_price`    DECIMAL(10,2)   DEFAULT 0.00 COMMENT '最低售价（冗余，列表展示用）',
  `max_price`    DECIMAL(10,2)   DEFAULT 0.00 COMMENT '最高售价（冗余）',
  `total_stock`  INT             DEFAULT 0    COMMENT '总库存（冗余）',
  `sales_count`  INT             DEFAULT 0    COMMENT '销量',
  `view_count`   INT             DEFAULT 0    COMMENT '浏览量',
  `sort`         INT             DEFAULT 0,
  `is_hot`       TINYINT         DEFAULT 0,
  `is_new`       TINYINT         DEFAULT 0,
  `is_recommend` TINYINT         DEFAULT 0,
  `status`       TINYINT         DEFAULT 1    COMMENT '0下架 1上架 2草稿',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   DATETIME        DEFAULT NULL,
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_hot` (`is_hot`),
  KEY `idx_is_recommend` (`is_recommend`)
);
```

**冗余字段同步规则：**

| 时机 | 操作 |
|---|---|
| 新增/编辑 SKU | 重新计算所有 SKU 的 min_price / max_price / total_stock，UPDATE products |
| 订单创建扣库存 | `UPDATE products SET total_stock = total_stock - ? WHERE id = ?` |
| 订单取消归还库存 | `UPDATE products SET total_stock = total_stock + ? WHERE id = ?` |

---

#### product_skus — 商品 SKU

```sql
CREATE TABLE `product_skus` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`     BIGINT UNSIGNED NOT NULL,
  `sku_code`       VARCHAR(100)    DEFAULT NULL COMMENT '商家自定义 SKU 编码',
  `specs`          JSON            NOT NULL     COMMENT '规格组合（见下方示例）',
  `price`          DECIMAL(10,2)   NOT NULL,
  `original_price` DECIMAL(10,2)   DEFAULT NULL COMMENT '划线原价',
  `cost_price`     DECIMAL(10,2)   DEFAULT NULL COMMENT '成本价（后台展示，不对用户暴露）',
  `stock`          INT             NOT NULL DEFAULT 0,
  `sales_count`    INT             DEFAULT 0,
  `image`          VARCHAR(500)    DEFAULT NULL COMMENT 'SKU 独立图片完整URL，优先级高于主图',
  `weight`         DECIMAL(8,3)    DEFAULT NULL COMMENT '重量(kg)，物流计费用',
  `status`         TINYINT         DEFAULT 1    COMMENT '0禁用 1启用',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_product_id` (`product_id`)
);
```

**specs 字段 JSON 数据结构示例：**

```json
// 单规格（只有颜色）
{ "颜色": "红色" }

// 双规格（颜色 + 尺码）
{ "颜色": "红色", "尺码": "XL" }

// 三规格
{ "颜色": "白色", "尺码": "M", "版型": "修身" }
```

**对应 product_attributes 数据示例：**

```json
// product_id=1 的 attributes 数据（两条记录）
[
  { "attr_name": "颜色", "attr_values": ["红色", "蓝色", "白色"], "sort": 0 },
  { "attr_name": "尺码", "attr_values": ["S", "M", "L", "XL"],   "sort": 1 }
]

// product_id=1 的 skus 数据（6条记录，2色×3码）
[
  { "specs": {"颜色":"红色","尺码":"S"}, "price": 99,  "stock": 10 },
  { "specs": {"颜色":"红色","尺码":"M"}, "price": 99,  "stock": 20 },
  { "specs": {"颜色":"红色","尺码":"L"}, "price": 109, "stock": 15 },
  { "specs": {"颜色":"蓝色","尺码":"S"}, "price": 99,  "stock": 0  },
  { "specs": {"颜色":"蓝色","尺码":"M"}, "price": 99,  "stock": 8  },
  { "specs": {"颜色":"蓝色","尺码":"L"}, "price": 109, "stock": 5  }
]
```

**库存扣减（必须在事务内执行）：**

```sql
BEGIN;
-- 1. 加行锁读取库存
SELECT stock FROM product_skus WHERE id = {sku_id} AND status = 1 FOR UPDATE;
-- 2. 应用层判断 stock >= quantity，不足则 ROLLBACK 并返回错误
-- 3. 扣减 SKU 库存
UPDATE product_skus SET stock = stock - {quantity}, sales_count = sales_count + {quantity}
WHERE id = {sku_id};
-- 4. 同步冗余字段
UPDATE products SET total_stock = total_stock - {quantity}, sales_count = sales_count + {quantity}
WHERE id = {product_id};
COMMIT;
```

---

#### product_attributes — 规格属性定义

```sql
CREATE TABLE `product_attributes` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_id`  BIGINT UNSIGNED NOT NULL,
  `attr_name`   VARCHAR(50)     NOT NULL COMMENT '属性名，如：颜色、尺码',
  `attr_values` JSON            NOT NULL COMMENT '属性值数组，如：["红色","蓝色","白色"]',
  `sort`        INT             DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_product_id` (`product_id`)
);
```

---

#### product_images — 商品轮播图

```sql
CREATE TABLE `product_images` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `url`        VARCHAR(500)    NOT NULL COMMENT '完整图片URL',
  `sort`       INT             DEFAULT 0,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_product_id` (`product_id`)
);
```

---

### 3.3 购物车

#### carts — 购物车

```sql
CREATE TABLE `carts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '冗余，方便查询商品信息',
  `sku_id`     BIGINT UNSIGNED NOT NULL,
  `quantity`   INT             NOT NULL DEFAULT 1,
  `selected`   TINYINT         DEFAULT 1 COMMENT '1已勾选 0未勾选',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_sku` (`user_id`, `sku_id`),
  KEY `idx_user_id` (`user_id`)
);
```

**UPSERT 逻辑（加入购物车）：**

```sql
INSERT INTO carts (user_id, product_id, sku_id, quantity)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = NOW();
```

**查询购物车（JOIN 获取最新商品信息）：**

```sql
SELECT
  c.id, c.quantity, c.selected,
  p.name AS product_name, p.status AS product_status,
  pi_main.main_image,
  s.specs, s.price, s.stock, s.status AS sku_status, s.image AS sku_image
FROM carts c
JOIN products p ON p.id = c.product_id AND p.deleted_at IS NULL
JOIN product_skus s ON s.id = c.sku_id
WHERE c.user_id = ?
ORDER BY c.updated_at DESC;
-- isValid = (p.status = 1 AND s.status = 1 AND s.stock > 0)
```

---

### 3.4 订单模块

#### orders — 订单主表

```sql
CREATE TABLE `orders` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`         VARCHAR(64)     NOT NULL  COMMENT '业务订单号（唯一）',
  `user_id`          BIGINT UNSIGNED NOT NULL,
  `status`           TINYINT         NOT NULL DEFAULT 0,
  `total_amount`     DECIMAL(10,2)   NOT NULL  COMMENT '商品总金额',
  `discount_amount`  DECIMAL(10,2)   DEFAULT 0.00,
  `freight_amount`   DECIMAL(10,2)   DEFAULT 0.00,
  `pay_amount`       DECIMAL(10,2)   NOT NULL  COMMENT '实付金额（服务端计算）',
  `pay_type`         TINYINT         DEFAULT NULL COMMENT '1微信支付',
  `pay_time`         DATETIME        DEFAULT NULL,
  `receiver_name`    VARCHAR(50)     NOT NULL  COMMENT '地址快照',
  `receiver_mobile`  VARCHAR(20)     NOT NULL  COMMENT '地址快照',
  `receiver_address` VARCHAR(500)    NOT NULL  COMMENT '完整地址快照（省市区+详细地址）',
  `remark`           VARCHAR(100)    DEFAULT NULL,
  `cancel_reason`    VARCHAR(200)    DEFAULT NULL,
  `cancelled_at`     DATETIME        DEFAULT NULL,
  `completed_at`     DATETIME        DEFAULT NULL,
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
);
```

**订单号生成规则（Service 层实现）：**

```js
// 格式：年月日时分秒（14位）+ 用户ID后4位（补零）+ 随机4位数字
// 示例：20260429153012000182341
function generateOrderNo(userId) {
  const date = dayjs().format('YYYYMMDDHHmmss')  // 14位
  const uid  = String(userId).slice(-4).padStart(4, '0')  // 4位
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')  // 4位
  return date + uid + rand  // 共 22 位
}
// 并发场景：在创建时加 UNIQUE KEY uk_order_no 约束，重复则重新生成（概率极低）
```

**金额计算规则（Service 层，不信任客户端）：**

```js
// 1. 重新查询所有 SKU 的当前价格（不用客户端传来的价格）
// 2. total_amount = sum(sku.price × quantity)
// 3. freight_amount = total_amount >= freeAmount ? 0 : defaultFee
// 4. pay_amount = total_amount - discount_amount + freight_amount
```

---

#### order_items — 订单商品明细

```sql
CREATE TABLE `order_items` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`      BIGINT UNSIGNED NOT NULL,
  `order_no`      VARCHAR(64)     NOT NULL,
  `product_id`    BIGINT UNSIGNED NOT NULL  COMMENT '商品ID（快照，不做外键）',
  `sku_id`        BIGINT UNSIGNED NOT NULL  COMMENT 'SKU ID（快照，不做外键）',
  `product_name`  VARCHAR(200)    NOT NULL  COMMENT '下单时的商品名称',
  `product_image` VARCHAR(500)    DEFAULT NULL COMMENT '下单时的商品图片完整URL',
  `specs`         JSON            DEFAULT NULL COMMENT '下单时的规格快照',
  `price`         DECIMAL(10,2)   NOT NULL  COMMENT '下单时的单价',
  `quantity`      INT             NOT NULL,
  `total_amount`  DECIMAL(10,2)   NOT NULL  COMMENT 'price × quantity',
  `is_reviewed`   TINYINT         DEFAULT 0,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`)
);
```

**快照说明：**
- product_id / sku_id 仅作记录，不做外键约束，即使商品被软删除，历史订单数据完整
- specs 存储下单时的规格值，如 `{"颜色":"红色","尺码":"M"}`

---

### 3.5 支付模块

#### payments — 支付记录

```sql
CREATE TABLE `payments` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pay_no`         VARCHAR(64)     NOT NULL  COMMENT '内部支付单号（唯一）',
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `order_no`       VARCHAR(64)     NOT NULL,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `pay_type`       TINYINT         NOT NULL  COMMENT '1微信支付',
  `amount`         DECIMAL(10,2)   NOT NULL,
  `status`         TINYINT         DEFAULT 0 COMMENT '0待支付 1成功 2失败 3已退款',
  `transaction_id` VARCHAR(100)    DEFAULT NULL COMMENT '微信流水号（用于幂等）',
  `paid_at`        DATETIME        DEFAULT NULL,
  `refund_amount`  DECIMAL(10,2)   DEFAULT 0.00,
  `refunded_at`    DATETIME        DEFAULT NULL,
  `raw_response`   JSON            DEFAULT NULL COMMENT '微信回调原始数据（调试用）',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_pay_no` (`pay_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_transaction_id` (`transaction_id`)
);
```

**微信支付回调处理流程：**

```
POST /api/v1/pay/wechat/notify（微信服务器调用）
  │
  ├─ 1. 验证微信签名（使用 API v3 公钥验证）
  ├─ 2. 解密 resource 密文，获取 transaction_id 和 out_trade_no
  ├─ 3. 幂等检查：SELECT FROM payments WHERE transaction_id = ?
  │      └─ 已存在且 status=1 → 直接返回成功（忽略重复通知）
  ├─ 4. 开启事务：
  │      ├─ UPDATE payments SET status=1, transaction_id=?, paid_at=NOW()
  │      └─ UPDATE orders SET status=1, pay_time=NOW(), pay_type=1
  ├─ 5. COMMIT
  └─ 6. 返回 HTTP 200 + 微信要求的成功响应体
```

---

### 3.6 后台管理模块（RBAC）

#### admins — 管理员

```sql
CREATE TABLE `admins` (
  `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)   NOT NULL UNIQUE,
  `password`      VARCHAR(255)  NOT NULL COMMENT 'bcrypt加密',
  `real_name`     VARCHAR(50)   DEFAULT NULL,
  `avatar`        VARCHAR(500)  DEFAULT NULL,
  `mobile`        VARCHAR(20)   DEFAULT NULL,
  `email`         VARCHAR(100)  DEFAULT NULL,
  `status`        TINYINT       DEFAULT 1 COMMENT '0禁用 1正常',
  `is_super`      TINYINT       DEFAULT 0 COMMENT '1超级管理员（跳过所有权限校验）',
  `last_login_at` DATETIME      DEFAULT NULL,
  `last_login_ip` VARCHAR(50)   DEFAULT NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME      DEFAULT NULL
);
```

#### roles — 角色

```sql
CREATE TABLE `roles` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(50)   NOT NULL  COMMENT '角色名称',
  `code`        VARCHAR(50)   NOT NULL  COMMENT '唯一标识，如：operator',
  `description` VARCHAR(200)  DEFAULT NULL,
  `status`      TINYINT       DEFAULT 1,
  `sort`        INT           DEFAULT 0,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_code` (`code`)
);
```

#### menus — 后台菜单

```sql
CREATE TABLE `menus` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `parent_id`  INT UNSIGNED  DEFAULT 0   COMMENT '0为顶级',
  `name`       VARCHAR(100)  NOT NULL,
  `icon`       VARCHAR(100)  DEFAULT NULL,
  `path`       VARCHAR(200)  DEFAULT NULL COMMENT '前端路由路径',
  `component`  VARCHAR(200)  DEFAULT NULL COMMENT '前端组件路径，如 views/products/index',
  `permission` VARCHAR(100)  DEFAULT NULL COMMENT '权限标识，如 product:list',
  `type`       TINYINT       DEFAULT 1   COMMENT '1目录 2菜单 3按钮',
  `sort`       INT           DEFAULT 0,
  `is_hidden`  TINYINT       DEFAULT 0   COMMENT '0显示 1隐藏',
  `is_cache`   TINYINT       DEFAULT 0   COMMENT '0不缓存 1缓存页面',
  `status`     TINYINT       DEFAULT 1,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parent_id` (`parent_id`)
);
```

**MVP 权限校验简化方案（仅菜单级，不做按钮级）：**

```
登录时：查询管理员的所有角色 → 查询角色关联的菜单（role_menus）→ 返回菜单树 + 权限标识列表
接口请求时：中间件从 ctx.admin 中取权限列表，校验当前接口的 permission 标识是否在列表中
is_super = 1 的管理员直接跳过校验
```

#### admin_roles / role_menus — 关联表

```sql
CREATE TABLE `admin_roles` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`   INT UNSIGNED NOT NULL,
  `role_id`    INT UNSIGNED NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_admin_role` (`admin_id`, `role_id`)
);

CREATE TABLE `role_menus` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id`    INT UNSIGNED NOT NULL,
  `menu_id`    INT UNSIGNED NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_menu` (`role_id`, `menu_id`)
);
```

---

### 3.7 系统通用

#### system_configs — 系统配置

| group | key | 默认值 | 说明 |
|---|---|---|---|
| shop | shop_name | 我的小店 | 店铺名称 |
| shop | service_phone | （空） | 客服电话 |
| freight | free_amount | 99 | 免运费门槛（元） |
| freight | default_fee | 10 | 默认运费（元） |
| wechat | app_id | （空） | 微信小程序 AppID |
| wechat | app_secret | （空） | 微信小程序 AppSecret |

**EggJS 中读取配置：**

```js
// app/service/config.js
async get(group, key) {
  const row = await this.ctx.model.SystemConfig.findOne({ where: { group, key } })
  return row ? row.value : null
}
```

#### file_uploads — 文件上传记录

所有图片上传均记录此表，file_url 为完整访问 URL（含域名），返回给前端直接使用。

---

## 四、初始化数据

数据库创建完成后执行以下初始化（已包含在 SQL 文件中）：

```sql
-- 默认超级管理员（密码 admin123 的 bcrypt 值需在部署时替换为真实加密结果）
INSERT INTO admins (username, password, real_name, is_super, status)
VALUES ('admin', '$2a$10$实际bcrypt加密值', '超级管理员', 1, 1);

-- 默认角色
INSERT INTO roles (name, code, description, sort) VALUES
('超级管理员', 'super_admin', '拥有所有权限', 1),
('运营人员',   'operator',   '商品、订单、营销管理', 2),
('客服人员',   'customer_service', '订单查看和售后处理', 3);

-- 顶级菜单
INSERT INTO menus (parent_id, name, icon, path, type, sort) VALUES
(0, '首页',     'HomeFilled',  '/dashboard', 1, 1),
(0, '商品管理', 'Goods',       '/products',  1, 2),
(0, '订单管理', 'List',        '/orders',    1, 3),
(0, '用户管理', 'User',        '/users',     1, 4),
(0, '系统设置', 'Setting',     '/system',    1, 5);

-- 系统配置
INSERT INTO system_configs (group_name, `key`, value, type, description) VALUES
('shop',    'shop_name',    '我的小店', 'string', '店铺名称'),
('freight', 'free_amount',  '99',       'number', '免运费金额（元）'),
('freight', 'default_fee',  '10',       'number', '默认运费（元）'),
('wechat',  'app_id',       '',         'string', '微信小程序AppID'),
('wechat',  'app_secret',   '',         'string', '微信小程序AppSecret');
```

> 注意：初始管理员密码 `admin123` 的 bcrypt 加密值需在实际部署前替换，不要使用占位符。

---

## 五、EggJS 中的软删除处理规范

所有含 `deleted_at` 字段的表（users、products、admins），在 EggJS Model 中统一处理：

```js
// app/model/product.js
module.exports = app => {
  const { STRING, INTEGER, DECIMAL, DATE, TEXT } = app.Sequelize;
  const Product = app.model.define('product', { /* 字段定义 */ });

  // 默认 scope：自动过滤软删除记录
  Product.addScope('defaultScope', {
    where: { deleted_at: null }
  }, { override: true });

  return Product;
};
```

**规范：**
- 查询时不需要手动加 `deleted_at IS NULL`，defaultScope 自动添加
- 物理删除禁止使用（`destroy` 方法改为 `update({ deleted_at: new Date() })`）
- 后台管理员列表查询同样走 defaultScope，被软删除的账号不展示

---

## 六、索引设计汇总

| 表 | 索引字段 | 用途 |
|---|---|---|
| users | mobile（唯一）、email（唯一）、status | 登录查询、状态筛选 |
| wechat_users | openid（唯一）、user_id | 微信登录查询 |
| products | category_id、status、is_hot、is_recommend | 列表筛选 |
| product_skus | product_id | 商品详情关联 |
| carts | (user_id, sku_id)唯一、user_id | 购物车查询 |
| orders | user_id、status、created_at | 用户订单列表、后台筛选 |
| order_items | order_id、order_no | 订单明细查询 |
| payments | order_id、transaction_id（唯一） | 支付查询、回调幂等 |
| admins | username（唯一）、status | 管理员登录 |
| admin_roles | (admin_id, role_id)唯一 | 权限查询 |
| role_menus | (role_id, menu_id)唯一、role_id | 菜单权限查询 |
| categories | parent_id、(status, sort) | 分类树查询 |



## 七、索引设计原则

- 高频查询字段必须加索引（user_id、status）
-  组合索引优先（status + created_at）
-  避免全表扫描



## 八、命名规范

- 表名：复数形式（users, orders）
- 字段：snake_case
- 时间字段：created_at / updated_at