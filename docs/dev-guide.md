# DEV-GUIDE — tom-mall 开发规范文档

> 版本：v1.0
> 更新时间：2026-04-29
> 本文档专供 Codex 参考，确保各模块代码风格统一

---

## 一、项目目录结构

### 1.1 服务端（EggJS）

```
server/
├── app/
│   ├── controller/          # 接收请求，参数校验，调用 service，返回响应
│   │   ├── mp/              # 小程序端接口
│   │   │   ├── auth.js
│   │   │   ├── product.js
│   │   │   ├── cart.js
│   │   │   └── order.js
│   │   └── admin/           # 后台管理接口
│   │       ├── auth.js
│   │       ├── product.js
│   │       ├── order.js
│   │       └── system.js
│   ├── service/             # 业务逻辑，数据库操作
│   │   ├── product.js
│   │   ├── cart.js
│   │   ├── order.js
│   │   ├── payment.js
│   │   └── auth.js
│   ├── model/               # Sequelize Model 定义
│   │   ├── user.js
│   │   ├── product.js
│   │   ├── product_sku.js
│   │   ├── order.js
│   │   └── ...
│   ├── middleware/          # 中间件
│   │   ├── jwt.js           # Token 解析和验证
│   │   └── permission.js    # 接口权限校验
│   ├── schedule/            # 定时任务
│   │   └── cancel_timeout_orders.js
│   ├── extend/              # EggJS 扩展
│   │   ├── helper.js        # 工具函数（响应格式化、订单号生成等）
│   │   └── context.js
│   └── router/
│       ├── mp.js            # 小程序端路由
│       └── admin.js         # 后台管理路由
├── config/
│   ├── config.default.js    # 通用配置
│   ├── config.local.js      # 本地开发配置（不提交 Git）
│   └── config.prod.js       # 生产配置（不提交 Git）
├── test/                    # 单元测试
└── package.json
```

### 1.2 后台管理系统（Vue3）

```
admin/
├── src/
│   ├── views/               # 页面组件（按模块分目录）
│   │   ├── dashboard/
│   │   │   └── index.vue
│   │   ├── products/
│   │   │   ├── list.vue     # 商品列表
│   │   │   └── edit.vue     # 新增/编辑
│   │   ├── orders/
│   │   │   ├── list.vue
│   │   │   └── detail.vue
│   │   ├── users/
│   │   │   └── list.vue
│   │   └── system/
│   │       ├── admins.vue
│   │       ├── roles.vue
│   │       └── menus.vue
│   ├── components/          # 通用组件
│   │   ├── layout/
│   │   │   ├── AppLayout.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppHeader.vue
│   │   └── common/
│   │       ├── PageHeader.vue
│   │       └── ConfirmDialog.vue
│   ├── stores/              # Pinia store
│   │   ├── auth.js          # 登录状态、token、权限列表
│   │   └── app.js           # 全局状态
│   ├── router/
│   │   └── index.js         # 动态路由（从菜单数据生成）
│   ├── api/                 # 接口请求封装
│   │   ├── request.js       # axios 实例 + 拦截器
│   │   ├── product.js
│   │   ├── order.js
│   │   └── system.js
│   └── utils/
│       ├── format.js        # dayjs 日期格式化、金额格式化
│       └── permission.js    # 按钮权限指令 v-permission
└── vite.config.js
```

### 1.3 微信小程序

```
miniprogram/
├── pages/
│   ├── index/               # 首页
│   ├── category/            # 分类页
│   ├── search/              # 搜索页
│   ├── product/
│   │   └── detail/          # 商品详情
│   ├── cart/                # 购物车
│   ├── order/
│   │   ├── confirm/         # 确认订单
│   │   ├── list/            # 订单列表
│   │   └── detail/          # 订单详情
│   ├── address/
│   │   ├── list/
│   │   └── edit/
│   └── user/                # 个人中心
├── components/              # 自定义组件
│   ├── product-card/
│   ├── sku-selector/        # 规格选择弹层
│   └── order-item/
├── utils/
│   ├── request.js           # wx.request 封装 + Token 管理
│   ├── auth.js              # 登录逻辑
│   └── format.js            # 格式化工具
├── store/                   # 全局状态（基于 getApp()）
│   └── cart.js
└── app.js
```

---

## 二、服务端编码规范（EggJS）

### 2.1 Controller 规范

Controller 只做三件事：**参数校验 → 调用 Service → 返回响应**，禁止在 Controller 中写业务逻辑和数据库操作。

```js
// app/controller/mp/product.js
class ProductController extends Controller {
  async list() {
    const { ctx } = this;
    // 1. 参数校验（使用 egg-validate 或手动校验）
    const { categoryId, keyword, page = 1, pageSize = 20 } = ctx.query;
    if (pageSize > 50) ctx.throw(400, '每页最多50条');

    // 2. 调用 Service
    const result = await ctx.service.product.getList({ categoryId, keyword, page, pageSize });

    // 3. 返回响应（统一用 ctx.helper.success）
    ctx.helper.success(result);
  }
}
```

### 2.2 统一响应格式（extend/helper.js）

```js
// app/extend/helper.js
module.exports = {
  // 成功响应
  success(data = null, message = 'ok') {
    this.ctx.body = { code: 0, message, data };
  },
  // 失败响应
  fail(code, message, data = null) {
    this.ctx.body = { code, message, data };
  }
};

// 使用示例
ctx.helper.success({ list: [], total: 0 });
ctx.helper.fail(1001, '库存不足');
```

### 2.3 Service 规范

```js
// app/service/order.js
class OrderService extends Service {
  async create({ userId, cartIds, addressId, remark }) {
    const { ctx, app } = this;

    // 1. 查询购物车商品（验证归属）
    // 2. 校验库存（循环校验，收集所有不足的商品一次性返回）
    // 3. 开启事务
    const transaction = await ctx.model.transaction();
    try {
      // 4. 扣减库存（FOR UPDATE）
      // 5. 创建订单主记录
      // 6. 创建订单明细
      // 7. 删除购物车记录
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    // 8. 返回订单信息
  }
}
```

### 2.4 Model 规范（Sequelize）

```js
// app/model/product.js
module.exports = app => {
  const { STRING, INTEGER, DECIMAL, DATE, TEXT, TINYINT } = app.Sequelize;

  const Product = app.model.define('product', {
    id:          { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    categoryId:  { type: INTEGER.UNSIGNED, allowNull: false },
    name:        { type: STRING(200),      allowNull: false },
    minPrice:    { type: DECIMAL(10, 2),   defaultValue: 0 },
    status:      { type: TINYINT,          defaultValue: 1 },
    deletedAt:   { type: DATE,             defaultValue: null },
    // ... 其他字段
  }, {
    tableName: 'products',
    underscored: true,        // 数据库字段 snake_case，JS 属性 camelCase 自动转换
    timestamps: true,         // 自动管理 created_at / updated_at
    paranoid: true,           // 软删除：自动处理 deleted_at，查询自动过滤
  });

  // 关联关系
  Product.associate = () => {
    app.model.Product.hasMany(app.model.ProductSku,       { foreignKey: 'productId', as: 'skus' });
    app.model.Product.hasMany(app.model.ProductAttribute, { foreignKey: 'productId', as: 'attributes' });
    app.model.Product.hasMany(app.model.ProductImage,     { foreignKey: 'productId', as: 'images' });
    app.model.Product.belongsTo(app.model.Category,       { foreignKey: 'categoryId', as: 'category' });
  };

  return Product;
};
```

**规范说明：**
- 统一使用 `underscored: true`，数据库列名 snake_case，JS 属性自动转 camelCase
- 含 `deleted_at` 的表使用 `paranoid: true`，Sequelize 自动处理软删除逻辑
- 关联关系在 `associate` 方法中定义，禁止在查询时临时 JOIN

### 2.5 错误处理规范

```js
// 在 Service 中抛出业务错误
const { createError } = require('egg-errors');

// 库存不足
if (sku.stock < quantity) {
  const err = new Error(`${productName}（${specsLabel}）库存不足`);
  err.code = 1001;
  err.status = 200;  // HTTP 状态码仍为 200，业务错误码在 body 中
  throw err;
}

// app/middleware/errorHandler.js（全局错误处理）
module.exports = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const code = err.code || 500;
    const message = err.message || '服务器内部错误';
    ctx.status = 200;
    ctx.body = { code, message, data: null };
    // 500 错误记录日志
    if (!err.code) ctx.logger.error(err);
  }
};
```

### 2.6 路由规范

```js
// app/router/mp.js
module.exports = app => {
  const { router, controller, middleware } = app;
  const jwt = middleware.jwt({ type: 'mp' });

  // 公开接口（无需 Token）
  router.get('/api/v1/mp/products',    controller.mp.product.list);
  router.get('/api/v1/mp/products/:id', controller.mp.product.detail);

  // 需要 Token 的接口
  router.get('/api/v1/mp/cart',    jwt, controller.mp.cart.index);
  router.post('/api/v1/mp/cart',   jwt, controller.mp.cart.create);
  router.post('/api/v1/mp/orders', jwt, controller.mp.order.create);
};

// app/router/admin.js
module.exports = app => {
  const { router, controller, middleware } = app;
  const jwt  = middleware.jwt({ type: 'admin' });
  const perm = middleware.permission;

  // 需要 Token + 权限校验
  router.get('/api/v1/admin/products',
    jwt, perm('product:list'), controller.admin.product.list);
  router.post('/api/v1/admin/products',
    jwt, perm('product:create'), controller.admin.product.create);
};
```

### 2.7 日期格式化规范（服务端）

```js
// app/extend/helper.js 中添加
formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return null;
  const dayjs = require('dayjs');
  return dayjs(date).format(format);
}

// Service 中返回数据时统一格式化
return {
  id: order.id,
  orderNo: order.orderNo,
  createdAt: ctx.helper.formatDate(order.createdAt),
  payTime: ctx.helper.formatDate(order.payTime),
};
```

---

## 三、后台管理系统规范（Vue3）

### 3.1 API 请求封装

```js
// src/api/request.js
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import router from '@/router';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 请求拦截：自动带 Token
request.interceptors.request.use(config => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// 响应拦截：统一错误处理
request.interceptors.response.use(
  response => {
    const { code, message, data } = response.data;
    if (code === 0) return data;
    if (code === 401) {
      useAuthStore().logout();
      router.push('/login');
      return Promise.reject(new Error(message));
    }
    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  error => {
    ElMessage.error('网络错误，请稍后重试');
    return Promise.reject(error);
  }
);

export default request;
```

### 3.2 按钮权限指令

```js
// src/utils/permission.js
import { useAuthStore } from '@/stores/auth';

// 全局指令：v-permission="'product:create'"
export const permissionDirective = {
  mounted(el, binding) {
    const auth = useAuthStore();
    const required = binding.value;
    if (!auth.hasPermission(required)) {
      el.parentNode?.removeChild(el);
    }
  }
};

// store/auth.js 中
hasPermission(code) {
  if (this.adminInfo?.isSuper) return true;
  return this.permissions.includes(code);
}
```

**使用示例：**
```html
<el-button v-permission="'product:create'" @click="handleCreate">新增商品</el-button>
```

### 3.3 日期格式化（dayjs）

```js
// src/utils/format.js
import dayjs from 'dayjs';

export const formatDate = (date, fmt = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(fmt);
};

export const formatAmount = (amount) => {
  if (amount == null) return '-';
  return `¥${Number(amount).toFixed(2)}`;
};
```

### 3.4 命名规范

| 类型 | 规范 | 示例 |
|---|---|---|
| 组件文件名 | PascalCase | `ProductList.vue` |
| 页面路由 | kebab-case | `/products/list` |
| Pinia store | camelCase | `useAuthStore` |
| API 函数 | camelCase，动词+名词 | `getProductList`, `createOrder` |
| CSS class | kebab-case | `product-card__title` |

---

## 四、微信小程序规范

### 4.1 request 封装

```js
// utils/request.js
const BASE_URL = 'http://localhost:7001/api/v1';

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: async (res) => {
        const { code, message, data } = res.data;
        if (code === 0) {
          resolve(data);
        } else if (code === 401) {
          // 静默重新登录
          await silentLogin();
          // 重试一次
          resolve(request(url, options));
        } else {
          wx.showToast({ title: message, icon: 'none' });
          reject(new Error(message));
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(new Error('网络错误'));
      },
    });
  });
};

// 静默登录
const silentLogin = async () => {
  const { code } = await wx.login();
  const data = await request('/mp/auth/login', { method: 'POST', data: { code } });
  wx.setStorageSync('token', data.token);
};

export default request;
```

### 4.2 页面规范

```js
// 每个页面统一结构
Page({
  data: {
    loading: false,
    list: [],
    page: 1,
    hasMore: true,
  },

  onLoad(options) {
    this.loadData();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, list: [], hasMore: true });
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    // ...
  }
});
```

---

## 五、环境变量和配置

### 5.1 服务端配置（EggJS）

```js
// config/config.default.js
module.exports = appInfo => ({
  keys: appInfo.name + '_cookie_keys',
  middleware: ['errorHandler', 'cors'],

  // 数据库配置（敏感信息在 config.local.js / config.prod.js 中覆盖）
  sequelize: {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'tom-mall',
    username: 'root',
    password: '',
    define: { underscored: true, timestamps: true },
    timezone: '+08:00',
  },

  // JWT 配置
  jwt: {
    secret: '替换为随机字符串',
    mpExpire: '7d',     // 小程序 token 有效期
    adminExpire: '8h',  // 后台 token 有效期
  },

  // 微信小程序配置（从 system_configs 表读取，此处为备用）
  wechat: {
    appId: '',
    appSecret: '',
  },

  // 文件上传
  upload: {
    // 本地存储路径（开发环境）
    localDir: 'app/public/uploads',
    // OSS 配置（生产环境）
    oss: {
      region: 'oss-cn-shenzhen',
      bucket: 'tom-mall',
      accessKeyId: '',
      accessKeySecret: '',
      cdnDomain: 'https://oss.tom-mall.com',
    },
  },
});
```

### 5.2 后台管理环境变量（Vite）

```env
# .env.development
VITE_API_BASE_URL=http://localhost:7001/api/v1

# .env.production
VITE_API_BASE_URL=https://api.tom-mall.com/api/v1
```

### 5.3 敏感信息规范

- `config.local.js` 和 `config.prod.js` 加入 `.gitignore`，不提交版本库
- 微信 AppSecret、JWT Secret、OSS 密钥均不写在代码中
- 提供 `config.local.example.js` 作为模板供开发人员参考

---

## 六、Git 规范

### 6.1 分支策略

```
main        ← 生产环境，只接受来自 dev 的 PR，禁止直接推送
dev         ← 集成分支，功能开发完成后合并到此
feature/*   ← 功能分支，如 feature/order-module
```

### 6.2 Commit Message 格式

```
类型(模块): 描述

feat(order): 新增创建订单接口
fix(cart): 修复重复加购数量计算错误
refactor(product): 重构商品 SKU 保存逻辑
docs: 更新 API 文档
```

---

## 七、开发顺序建议

按以下顺序逐模块开发，每个模块完成后进行基本测试再进入下一个：

```
1. 数据库初始化（执行 SQL，验证表结构）
2. EggJS 项目初始化（目录结构、基础中间件、统一响应格式）
3. 后台管理系统登录（admins 表、JWT、菜单权限）
4. 商品分类管理（后台 CRUD + 小程序列表）
5. 商品管理（后台 CRUD + SKU + 小程序列表/详情）
6. 用户登录（微信登录 + 绑定手机号）
7. 购物车（小程序端完整功能）
8. 订单（创建 + 确认 + 状态管理 + 定时取消）
9. 微信支付（统一下单 + 回调处理）
10. 会员管理（后台查看）
11. 系统管理（角色/管理员/菜单后台 CRUD）
12. Dashboard 数据接口
```
