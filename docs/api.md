# API — tom-mall 接口设计文档

> 版本：v1.1
> 服务端：EggJS
> 鉴权方案：JWT Bearer Token
> 更新时间：2026-04-29

---

## 一、全局规范

### 1.1 Base URL

| 环境 | Base URL |
|---|---|
| 开发 | `http://localhost:7001/api/v1` |
| 生产 | `https://api.tom-mall.com/api/v1` |

### 1.2 请求规范

- 所有请求 `Content-Type: application/json`（文件上传接口除外）
- 需鉴权的接口在 Header 中携带：`Authorization: Bearer {token}`
- GET 请求参数通过 Query String 传递
- POST / PUT / DELETE 参数通过 Request Body（JSON）传递

### 1.3 统一响应格式

**成功响应：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

**失败响应：**

```json
{
  "code": 400,
  "message": "商品名称不能为空",
  "data": null
}
```

**分页列表响应（data 结构）：**

```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 1.4 日期时间规范

- 所有日期时间字段统一使用格式：`YYYY-MM-DD HH:mm:ss`（如 `2026-04-29 15:30:12`）
- 纯日期字段（如生日）使用：`YYYY-MM-DD`（如 `1995-01-01`）
- 前端使用 dayjs 解析，初始化时设置：`dayjs('2026-04-29 15:30:12')`
- 服务端使用 MySQL `DATETIME` 类型存储，EggJS 返回前统一格式化（不返回时间戳）

### 1.5 图片 URL 规范

- **数据库存储：完整 URL**（含域名），如 `https://oss.tom-mall.com/products/2026/04/xxx.jpg`
- **接口返回：完整 URL**，前端直接用于 `<image src="">` 或 `img.src`，不做任何拼接
- 本地开发环境图片路径示例：`http://localhost:7001/public/uploads/2026/04/xxx.jpg`

### 1.6 金额规范

- 所有金额字段类型为 `Number`（JSON），保留两位小数，如 `129.00`
- 前端展示时直接使用，无需换算（单位：元）
- 绝不信任客户端传来的金额，服务端必须重新计算校验

### 1.7 分页参数规范（全局默认值）

| 参数 | 类型 | 默认值 | 最大值 | 说明 |
|---|---|---|---|---|
| page | Number | 1 | — | 页码，从 1 开始 |
| pageSize | Number | 20 | 50 | 每页数量 |

### 1.8 错误码定义

| code | 说明 |
|---|---|
| 0 | 成功 |
| 400 | 参数错误（message 中说明具体字段） |
| 401 | 未登录 / Token 无效或已过期 |
| 403 | 无权限访问该接口 |
| 404 | 资源不存在 |
| 409 | 数据冲突（如手机号已注册） |
| 500 | 服务器内部错误 |
| 1001 | 库存不足（message 中说明具体商品） |
| 1002 | 商品已下架或不存在 |
| 1003 | 订单状态不允许该操作 |
| 1004 | 支付金额与订单金额不匹配 |
| 1005 | 验证码错误或已过期 |

**错误响应示例：**

```json
// 401 未登录
{ "code": 401, "message": "请先登录", "data": null }

// 400 参数错误
{ "code": 400, "message": "手机号格式不正确", "data": null }

// 1001 库存不足
{ "code": 1001, "message": "春季连衣裙（红色/M）库存不足，当前库存：3件", "data": null }

// 403 无权限
{ "code": 403, "message": "无权访问该接口", "data": null }
```

### 1.9 鉴权说明

| 端 | 路径前缀 | Token 有效期 | 说明 |
|---|---|---|---|
| 小程序端 | `/api/v1/mp/` | 7 天 | 微信登录接口颁发 |
| 后台管理端 | `/api/v1/admin/` | 8 小时 | 管理员登录接口颁发 |
| 公开接口 | 无需 Token | — | 商品列表、商品详情等 |

**小程序端 Token 失效处理（静默续期）：**

```js
// 小程序 app.js 请求拦截器
request.interceptors.response.use(async (response) => {
  if (response.data.code === 401) {
    // 静默重新登录：调用 wx.login 获取新 code
    const { code } = await wx.login()
    // 用新 code 换取新 token
    const res = await loginByCode(code)
    // 保存新 token
    wx.setStorageSync('token', res.data.token)
    // 重试原请求
    return request(response.config)
  }
  return response
})
```

---

## 二、EggJS 中间件规划

```
请求进入
  ↓
cors 中间件（允许跨域，后台管理系统需要）
  ↓
jwt 中间件
  ├─ 解析 Authorization Header 中的 Token
  ├─ 验证 Token 合法性和有效期
  ├─ 解析 payload，挂载到 ctx.user（小程序端）或 ctx.admin（后台端）
  ├─ Token 无效 → 返回 { code: 401, message: '请先登录' }
  └─ 白名单路径（登录、支付回调等）跳过验证
  ↓
permission 中间件（仅后台接口）
  ├─ 从路由元信息读取所需权限标识
  ├─ 无权限要求的接口 → 放行
  ├─ ctx.admin.isSuper = 1 → 放行
  ├─ 检查 ctx.admin.permissions 是否包含所需标识
  └─ 不包含 → 返回 { code: 403, message: '无权访问该接口' }
  ↓
Controller → Service → Model
```

---

## 三、小程序端接口（/api/v1/mp）

---

### 3.1 认证模块

#### POST /api/v1/mp/auth/login
微信小程序登录

**请求：**
```json
{ "code": "wx_login_code_from_wx.login()" }
```

**响应（已绑定手机号）：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGci...",
    "bound": true,
    "userInfo": {
      "id": 1,
      "nickname": "Tom",
      "avatar": "https://oss.tom-mall.com/avatar/xxx.jpg",
      "mobile": "138****8888"
    }
  }
}
```

**响应（未绑定手机号）：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGci...",
    "bound": false,
    "userInfo": null
  }
}
```

**说明：** 前端根据 `bound` 字段决定是否跳转绑定手机号页面

---

#### POST /api/v1/mp/auth/send-sms
发送手机验证码（需 Token）

```json
{ "mobile": "13800138000" }
```

**说明：** 60 秒内不可重复发送，同一手机号每日最多 10 次

---

#### POST /api/v1/mp/auth/bind-mobile
绑定手机号（需 Token，bound=false 时调用）

```json
{
  "mobile": "13800138000",
  "code": "123456"
}
```

**响应：** 返回正式 token 和完整 userInfo（同登录成功响应）

---

#### GET /api/v1/mp/user/info
获取当前用户信息（需 Token）

**响应：**
```json
{
  "data": {
    "id": 1,
    "nickname": "Tom",
    "avatar": "https://...",
    "mobile": "138****8888",
    "gender": 1,
    "birthday": "1995-01-01"
  }
}
```

---

#### PUT /api/v1/mp/user/info
更新用户信息（需 Token）

```json
{
  "nickname": "新昵称",
  "avatar": "https://...",
  "gender": 1,
  "birthday": "1995-01-01"
}
```

---

### 3.2 首页

#### GET /api/v1/mp/home
首页数据（公开接口，一次性返回首页所需全部数据）

**响应：**
```json
{
  "data": {
    "banners": [
      {
        "id": 1,
        "image": "https://...",
        "linkType": 1,
        "linkValue": "100"
      }
    ],
    "categories": [
      { "id": 1, "name": "服装", "icon": "https://..." }
    ],
    "recommends": [ /* 商品列表，同商品列表接口的 item 结构 */ ],
    "hots": [],
    "news": []
  }
}
```

---

### 3.3 商品模块

#### GET /api/v1/mp/categories
分类列表（公开）

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| parentId | Number | 否 | 不传则返回所有一级分类 |

---

#### GET /api/v1/mp/products
商品列表（公开）

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| categoryId | Number | 否 | 分类 ID 筛选 |
| keyword | String | 否 | 商品名称关键词 |
| isHot | Number | 否 | 1=热门 |
| isNew | Number | 否 | 1=新品 |
| isRecommend | Number | 否 | 1=推荐 |
| sortField | String | 否 | price / sales_count / created_at（默认） |
| sortOrder | String | 否 | asc / desc（默认 desc） |
| page | Number | 否 | 默认 1 |
| pageSize | Number | 否 | 默认 20，最大 50 |

**响应 data.list 中每条 item：**
```json
{
  "id": 1,
  "name": "春季连衣裙",
  "mainImage": "https://...",
  "minPrice": 99.00,
  "maxPrice": 199.00,
  "salesCount": 328,
  "isHot": 1,
  "isNew": 0,
  "isRecommend": 1
}
```

---

#### GET /api/v1/mp/products/:id
商品详情（公开）

**响应：**
```json
{
  "data": {
    "id": 1,
    "name": "春季连衣裙",
    "subtitle": "轻薄透气，百搭显瘦",
    "brand": "Tom品牌",
    "unit": "件",
    "mainImage": "https://...",
    "images": ["https://...", "https://..."],
    "description": "<p>富文本内容</p>",
    "salesCount": 328,
    "attributes": [
      {
        "attrName": "颜色",
        "attrValues": ["红色", "蓝色", "白色"],
        "sort": 0
      },
      {
        "attrName": "尺码",
        "attrValues": ["S", "M", "L", "XL"],
        "sort": 1
      }
    ],
    "skus": [
      {
        "id": 10,
        "specs": { "颜色": "红色", "尺码": "M" },
        "price": 129.00,
        "originalPrice": 199.00,
        "hasStock": true,
        "image": "https://..."
      }
    ]
  }
}
```

**说明：**
- `hasStock` 为 `true/false`，不返回具体库存数量
- `cost_price` 不对小程序端暴露

---

### 3.4 购物车模块

#### GET /api/v1/mp/cart
购物车列表（需 Token）

**响应：**
```json
{
  "data": {
    "list": [
      {
        "id": 1,
        "productId": 100,
        "skuId": 10,
        "productName": "春季连衣裙",
        "productImage": "https://...",
        "specs": { "颜色": "红色", "尺码": "M" },
        "price": 129.00,
        "quantity": 2,
        "subtotal": 258.00,
        "selected": 1,
        "hasStock": true,
        "isValid": true
      }
    ],
    "selectedTotal": 258.00,
    "selectedCount": 2,
    "invalidCount": 0
  }
}
```

**字段说明：**
- `isValid`：false 表示商品已下架或 SKU 已禁用，不参与结算
- `selectedTotal`：仅 selected=1 且 isValid=true 的商品金额之和

---

#### POST /api/v1/mp/cart
加入购物车（需 Token）

```json
{ "skuId": 10, "quantity": 1 }
```

**说明：** 同一 skuId 已在购物车则数量累加（UPSERT）

---

#### PUT /api/v1/mp/cart/:id
修改数量（需 Token）

```json
{ "quantity": 3 }
```

---

#### PUT /api/v1/mp/cart/:id/selected
切换选中状态（需 Token）

```json
{ "selected": 1 }
```

---

#### PUT /api/v1/mp/cart/selected-all
全选/取消全选（需 Token）

```json
{ "selected": 1 }
```

---

#### DELETE /api/v1/mp/cart
删除购物车商品（需 Token）

```json
{ "ids": [1, 2, 3] }
```

---

### 3.5 订单模块

#### POST /api/v1/mp/orders/preview
结算预览（需 Token）

**请求：**
```json
{
  "cartIds": [1, 2],
  "addressId": 5
}
```

**响应：**
```json
{
  "data": {
    "address": {
      "id": 5,
      "receiverName": "张三",
      "receiverMobile": "13800138000",
      "fullAddress": "广东省 深圳市 南山区 科技园北区 xxx 号"
    },
    "items": [
      {
        "productName": "春季连衣裙",
        "productImage": "https://...",
        "specs": { "颜色": "红色", "尺码": "M" },
        "price": 129.00,
        "quantity": 2,
        "subtotal": 258.00
      }
    ],
    "totalAmount": 258.00,
    "freightAmount": 0.00,
    "payAmount": 258.00,
    "freeShippingThreshold": 99.00
  }
}
```

---

#### POST /api/v1/mp/orders
创建订单（需 Token）

**请求：**
```json
{
  "cartIds": [1, 2],
  "addressId": 5,
  "remark": "尽快发货"
}
```

**响应（成功）：**
```json
{
  "data": {
    "orderId": 1001,
    "orderNo": "20260429153012000182341",
    "payAmount": 258.00
  }
}
```

**响应（库存不足）：**
```json
{
  "code": 1001,
  "message": "春季连衣裙（红色/M）库存不足，当前库存：1件",
  "data": null
}
```

---

#### POST /api/v1/mp/orders/:id/pay
发起支付（需 Token）

**请求：**
```json
{ "payType": 1 }
```

**响应（微信支付参数，直接传给 wx.requestPayment）：**
```json
{
  "data": {
    "timeStamp": "1619000000",
    "nonceStr": "abc123",
    "package": "prepay_id=wx...",
    "signType": "RSA",
    "paySign": "..."
  }
}
```

---

#### GET /api/v1/mp/orders
订单列表（需 Token）

| 参数 | 类型 | 说明 |
|---|---|---|
| status | Number | 不传返回全部；0/1/2/3/4/5 |
| page | Number | 默认 1 |
| pageSize | Number | 默认 10 |

**响应 data.list 每条 item：**
```json
{
  "id": 1001,
  "orderNo": "20260429153012000182341",
  "status": 1,
  "statusLabel": "待发货",
  "payAmount": 258.00,
  "createdAt": "2026-04-29 15:30:12",
  "items": [
    {
      "productName": "春季连衣裙",
      "productImage": "https://...",
      "specs": { "颜色": "红色", "尺码": "M" },
      "price": 129.00,
      "quantity": 2
    }
  ]
}
```

---

#### GET /api/v1/mp/orders/:id
订单详情（需 Token）

**响应：**
```json
{
  "data": {
    "id": 1001,
    "orderNo": "20260429153012000182341",
    "status": 2,
    "statusLabel": "待收货",
    "receiverName": "张三",
    "receiverMobile": "13800138000",
    "receiverAddress": "广东省 深圳市 南山区 科技园北区 xxx 号",
    "remark": "尽快发货",
    "totalAmount": 258.00,
    "freightAmount": 0.00,
    "payAmount": 258.00,
    "payType": 1,
    "payTime": "2026-04-29 15:32:00",
    "createdAt": "2026-04-29 15:30:12",
    "items": [ /* 同列表结构，增加 subtotal 字段 */ ],
    "shipment": {
      "expressCompany": "顺丰速运",
      "trackingNo": "SF1234567890",
      "shippedAt": "2026-04-30 09:00:00"
    }
  }
}
```

---

#### POST /api/v1/mp/orders/:id/cancel
取消订单（需 Token）

```json
{ "cancelReason": "不想要了" }
```

**说明：** 仅 status=0 可取消，取消后归还库存

---

#### POST /api/v1/mp/orders/:id/confirm
确认收货（需 Token）

**说明：** 仅 status=2 可操作

---

### 3.6 地址模块

#### GET /api/v1/mp/addresses
地址列表（需 Token）

**响应 data 为数组，每条：**
```json
{
  "id": 5,
  "receiverName": "张三",
  "receiverMobile": "13800138000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detail": "科技园北区 xxx 号",
  "fullAddress": "广东省 深圳市 南山区 科技园北区 xxx 号",
  "isDefault": 1
}
```

---

#### POST /api/v1/mp/addresses
新增地址（需 Token，最多 5 个）

```json
{
  "receiverName": "张三",
  "receiverMobile": "13800138000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detail": "科技园北区 xxx 号",
  "isDefault": 1
}
```

#### PUT /api/v1/mp/addresses/:id
修改地址（需 Token）

#### DELETE /api/v1/mp/addresses/:id
删除地址（需 Token）

#### PUT /api/v1/mp/addresses/:id/default
设为默认地址（需 Token）

---

### 3.7 文件上传

#### POST /api/v1/mp/upload
上传图片（需 Token，multipart/form-data，字段名 file）

**响应：**
```json
{
  "data": {
    "url": "https://oss.tom-mall.com/avatar/2026/04/xxx.jpg"
  }
}
```

**限制：** 仅 jpg / png / gif / webp，单文件最大 5MB

---

### 3.8 支付回调（微信服务器调用）

#### POST /api/v1/pay/wechat/notify
无需鉴权，微信服务器直接调用

**说明：** 见 database.md 支付回调处理流程

---

## 四、后台管理接口（/api/v1/admin）

---

### 4.1 认证模块

#### POST /api/v1/admin/auth/login
管理员登录

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应：**
```json
{
  "data": {
    "token": "eyJhbGci...",
    "adminInfo": {
      "id": 1,
      "username": "admin",
      "realName": "超级管理员",
      "avatar": "https://...",
      "isSuper": 1
    },
    "menus": [
      {
        "id": 1,
        "parentId": 0,
        "name": "商品管理",
        "icon": "Goods",
        "path": "/products",
        "component": "views/products/index",
        "type": 1,
        "sort": 2,
        "isHidden": 0,
        "isCache": 0,
        "children": [
          {
            "id": 10,
            "name": "商品列表",
            "path": "/products/list",
            "component": "views/products/list",
            "permission": "product:list",
            "type": 2
          }
        ]
      }
    ],
    "permissions": ["product:list", "product:create", "order:list"]
  }
}
```

**说明：** 前端 Pinia store 保存 token + menus + permissions；menus 用于动态路由生成；permissions 用于按钮级权限控制

---

#### POST /api/v1/admin/auth/logout
退出登录（需 Token）

#### GET /api/v1/admin/auth/info
获取当前管理员信息（需 Token）

#### PUT /api/v1/admin/auth/password
修改自己的密码（需 Token）

```json
{
  "oldPassword": "admin123",
  "newPassword": "NewPass@456"
}
```

---

### 4.2 Dashboard

#### GET /api/v1/admin/dashboard/overview
数据概览卡片（需 Token）

**响应：**
```json
{
  "data": {
    "todayOrderCount": 28,
    "todaySaleAmount": 3680.00,
    "totalUserCount": 1520,
    "pendingOrderCount": 15
  }
}
```

#### GET /api/v1/admin/dashboard/sales-trend
销售趋势（需 Token）

| 参数 | 说明 |
|---|---|
| days | 7 或 30，默认 7 |

**响应：**
```json
{
  "data": {
    "dates": ["2026-04-23", "2026-04-24", "..."],
    "amounts": [1200.00, 980.00, "..."]
  }
}
```

#### GET /api/v1/admin/dashboard/order-status
订单状态分布（需 Token）

```json
{
  "data": [
    { "status": 0, "label": "待付款", "count": 12 },
    { "status": 1, "label": "待发货", "count": 15 },
    { "status": 2, "label": "待收货", "count": 38 },
    { "status": 3, "label": "已完成", "count": 420 },
    { "status": 4, "label": "已取消", "count": 25 }
  ]
}
```

#### GET /api/v1/admin/dashboard/top-products
热销商品 Top10（需 Token）

```json
{
  "data": [
    { "rank": 1, "productId": 1, "productName": "春季连衣裙", "mainImage": "https://...", "salesCount": 328 }
  ]
}
```

---

### 4.3 商品管理

#### GET /api/v1/admin/products
商品列表（需 Token，权限：product:list）

**Query 参数：** categoryId / status / keyword / page / pageSize

**响应 data.list 每条 item（后台字段，比小程序端更多）：**
```json
{
  "id": 1,
  "name": "春季连衣裙",
  "mainImage": "https://...",
  "categoryId": 3,
  "categoryName": "连衣裙",
  "minPrice": 99.00,
  "maxPrice": 199.00,
  "totalStock": 150,
  "salesCount": 328,
  "status": 1,
  "statusLabel": "上架",
  "isHot": 1,
  "isNew": 0,
  "sort": 0,
  "createdAt": "2026-01-15 10:00:00"
}
```

---

#### POST /api/v1/admin/products
新增商品（需 Token，权限：product:create）

```json
{
  "categoryId": 3,
  "name": "春季连衣裙",
  "subtitle": "轻薄透气",
  "mainImage": "https://...",
  "images": ["https://...", "https://..."],
  "description": "<p>详情HTML</p>",
  "brand": "Tom品牌",
  "unit": "件",
  "sort": 0,
  "isHot": 0,
  "isNew": 1,
  "isRecommend": 0,
  "status": 2,
  "attributes": [
    { "attrName": "颜色", "attrValues": ["红色", "蓝色"], "sort": 0 },
    { "attrName": "尺码", "attrValues": ["S", "M", "L"],  "sort": 1 }
  ],
  "skus": [
    {
      "specs": { "颜色": "红色", "尺码": "M" },
      "price": 129.00,
      "originalPrice": 199.00,
      "costPrice": 60.00,
      "stock": 100,
      "skuCode": "SKU-RED-M",
      "image": "https://...",
      "weight": 0.35
    }
  ]
}
```

**说明：** 服务端在事务内创建 product + product_attributes + product_skus + product_images，并同步 min_price / max_price / total_stock

---

#### GET /api/v1/admin/products/:id
商品详情（需 Token，返回完整信息含 costPrice）

#### PUT /api/v1/admin/products/:id
编辑商品（需 Token，权限：product:edit，结构同新增）

#### PUT /api/v1/admin/products/:id/status
上下架（需 Token，权限：product:edit）

```json
{ "status": 0 }
```

#### DELETE /api/v1/admin/products/:id
删除商品（需 Token，权限：product:delete，软删除）

---

### 4.4 分类管理

#### GET /api/v1/admin/categories
分类树（需 Token，返回全部层级树形结构）

#### POST /api/v1/admin/categories
新增分类（需 Token，权限：category:create）

```json
{
  "parentId": 0,
  "name": "服装",
  "icon": "https://...",
  "image": "https://...",
  "sort": 1,
  "status": 1
}
```

#### PUT /api/v1/admin/categories/:id
编辑分类（需 Token，权限：category:edit）

#### DELETE /api/v1/admin/categories/:id
删除分类（需 Token，权限：category:delete，有子分类或关联商品时拒绝）

---

### 4.5 订单管理

#### GET /api/v1/admin/orders
订单列表（需 Token，权限：order:list）

| 参数 | 说明 |
|---|---|
| status | 订单状态 |
| orderNo | 精确查询 |
| mobile | 用户手机号 |
| startTime | 下单时间起（YYYY-MM-DD） |
| endTime | 下单时间止（YYYY-MM-DD） |
| page / pageSize | 分页 |

---

#### GET /api/v1/admin/orders/:id
订单详情（需 Token）

---

#### POST /api/v1/admin/orders/:id/ship
发货（需 Token，权限：order:ship）

```json
{
  "expressCompany": "顺丰速运",
  "expressCode": "SF",
  "trackingNo": "SF1234567890"
}
```

**说明：** status 必须为 1（待发货），操作后写入 shipments 表，订单状态变为 2（待收货）

---

### 4.6 会员管理

#### GET /api/v1/admin/users
会员列表（需 Token，权限：user:list）

| 参数 | 说明 |
|---|---|
| keyword | 昵称或手机号 |
| status | 0/1 |
| startTime / endTime | 注册时间范围 |
| page / pageSize | 分页 |

**响应 data.list 每条 item：**
```json
{
  "id": 1,
  "nickname": "Tom",
  "mobile": "138****8888",
  "avatar": "https://...",
  "gender": 1,
  "status": 1,
  "createdAt": "2026-01-01 10:00:00",
  "lastLoginAt": "2026-04-29 08:30:00"
}
```

---

#### GET /api/v1/admin/users/:id
会员详情（需 Token）

```json
{
  "data": {
    "userInfo": { /* 同列表 item，手机号完整显示 */ },
    "addresses": [ /* 收货地址列表 */ ],
    "recentOrders": [ /* 最近 10 条订单 */ ]
  }
}
```

---

#### PUT /api/v1/admin/users/:id/status
禁用/启用会员（需 Token，权限：user:edit）

```json
{ "status": 0 }
```

---

### 4.7 管理员管理

| Method | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /api/v1/admin/admins | admin:list | 管理员列表（支持关键词、状态筛选） |
| POST | /api/v1/admin/admins | admin:create | 新增管理员 |
| PUT | /api/v1/admin/admins/:id | admin:edit | 编辑信息 |
| PUT | /api/v1/admin/admins/:id/status | admin:edit | 禁用/启用 |
| PUT | /api/v1/admin/admins/:id/password | admin:edit | 重置密码（超级管理员操作） |
| DELETE | /api/v1/admin/admins/:id | admin:delete | 软删除 |

**新增管理员请求体：**
```json
{
  "username": "operator01",
  "password": "Pass@123",
  "realName": "运营小李",
  "mobile": "13900139000",
  "email": "li@tom-mall.com",
  "roleIds": [2]
}
```

---

### 4.8 角色管理

| Method | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /api/v1/admin/roles | role:list | 角色列表 |
| POST | /api/v1/admin/roles | role:create | 新增角色 |
| PUT | /api/v1/admin/roles/:id | role:edit | 编辑角色基本信息 |
| PUT | /api/v1/admin/roles/:id/menus | role:edit | 分配菜单权限 |
| DELETE | /api/v1/admin/roles/:id | role:delete | 删除（有关联管理员时拒绝） |

**分配菜单请求体：**
```json
{ "menuIds": [1, 2, 10, 11, 3, 30] }
```

---

### 4.9 菜单管理

| Method | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /api/v1/admin/menus | menu:list | 菜单树（全量，不受角色限制） |
| POST | /api/v1/admin/menus | menu:create | 新增节点 |
| PUT | /api/v1/admin/menus/:id | menu:edit | 编辑节点 |
| DELETE | /api/v1/admin/menus/:id | menu:delete | 删除（有子节点时拒绝） |

**新增菜单请求体：**
```json
{
  "parentId": 2,
  "name": "商品列表",
  "icon": "List",
  "path": "/products/list",
  "component": "views/products/list",
  "permission": "product:list",
  "type": 2,
  "sort": 1,
  "isHidden": 0,
  "isCache": 1,
  "status": 1
}
```

---

### 4.10 文件上传

#### POST /api/v1/admin/upload
上传图片（需 Token，multipart/form-data，字段名 file）

**响应：**
```json
{
  "data": {
    "url": "https://oss.tom-mall.com/products/2026/04/xxx.jpg",
    "fileId": 123
  }
}
```

**限制：** jpg / png / gif / webp，最大 10MB（后台比小程序宽松）

---

## 五、接口权限矩阵

| 模块 | 权限标识 | 说明 |
|---|---|---|
| 商品 | product:list | 查看商品列表和详情 |
| 商品 | product:create | 新增商品 |
| 商品 | product:edit | 编辑/上下架 |
| 商品 | product:delete | 删除商品 |
| 分类 | category:list | 查看分类 |
| 分类 | category:create | 新增分类 |
| 分类 | category:edit | 编辑分类 |
| 分类 | category:delete | 删除分类 |
| 订单 | order:list | 查看订单列表和详情 |
| 订单 | order:ship | 发货操作 |
| 会员 | user:list | 查看会员列表和详情 |
| 会员 | user:edit | 禁用/启用会员 |
| 管理员 | admin:list | 查看管理员列表 |
| 管理员 | admin:create | 新增管理员 |
| 管理员 | admin:edit | 编辑/禁用/重置密码 |
| 管理员 | admin:delete | 删除管理员 |
| 角色 | role:list | 查看角色 |
| 角色 | role:create | 新增角色 |
| 角色 | role:edit | 编辑/分配菜单 |
| 角色 | role:delete | 删除角色 |
| 菜单 | menu:list | 查看菜单 |
| 菜单 | menu:create | 新增菜单 |
| 菜单 | menu:edit | 编辑菜单 |
| 菜单 | menu:delete | 删除菜单 |

> `is_super = 1` 的超级管理员跳过所有权限校验，无需配置。
