-- ================================================================
-- 电商系统数据库设计（自营模式）
-- 共 28 张表，涵盖：用户、商品、订单、支付、评价、营销、物流、后台管理、系统通用
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- 创建时间：2026-04-28
-- ================================================================

CREATE DATABASE IF NOT EXISTS `tom-mall` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tom-mall`;

-- ================================================================
-- 👤 用户模块（4张表）
-- ================================================================

-- 用户主表
CREATE TABLE `users` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`     VARCHAR(50)     NOT NULL                COMMENT '用户名',
  `password`     VARCHAR(255)    NOT NULL                COMMENT '密码（加密存储）',
  `nickname`     VARCHAR(50)     DEFAULT NULL            COMMENT '昵称',
  `avatar`       VARCHAR(500)    DEFAULT NULL            COMMENT '头像URL',
  `mobile`       VARCHAR(20)     DEFAULT NULL            COMMENT '手机号',
  `email`        VARCHAR(100)    DEFAULT NULL            COMMENT '邮箱',
  `gender`       TINYINT         DEFAULT 0               COMMENT '性别：0未知 1男 2女',
  `birthday`     DATE            DEFAULT NULL            COMMENT '生日',
  `status`       TINYINT         DEFAULT 1               COMMENT '状态：0禁用 1正常',
  `last_login_at` DATETIME       DEFAULT NULL            COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50)    DEFAULT NULL            COMMENT '最后登录IP',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`   DATETIME        DEFAULT NULL            COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mobile` (`mobile`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户主表';


-- 用户收货地址
CREATE TABLE `user_addresses` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id`      BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `receiver_name`  VARCHAR(50)   NOT NULL               COMMENT '收货人姓名',
  `receiver_mobile` VARCHAR(20)  NOT NULL               COMMENT '收货人手机号',
  `province`     VARCHAR(50)     NOT NULL               COMMENT '省',
  `city`         VARCHAR(50)     NOT NULL               COMMENT '市',
  `district`     VARCHAR(50)     NOT NULL               COMMENT '区/县',
  `detail`       VARCHAR(200)    NOT NULL               COMMENT '详细地址',
  `postcode`     VARCHAR(20)     DEFAULT NULL           COMMENT '邮政编码',
  `is_default`   TINYINT         DEFAULT 0              COMMENT '是否默认地址：0否 1是',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_default` (`user_id`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收货地址';


-- 微信用户信息
CREATE TABLE `wechat_users` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`      BIGINT UNSIGNED DEFAULT NULL            COMMENT '关联用户ID（绑定后填入）',
  `openid`       VARCHAR(100)    NOT NULL                COMMENT '微信openid',
  `unionid`      VARCHAR(100)    DEFAULT NULL            COMMENT '微信unionid',
  `nickname`     VARCHAR(100)    DEFAULT NULL            COMMENT '微信昵称',
  `avatar`       VARCHAR(500)    DEFAULT NULL            COMMENT '微信头像',
  `gender`       TINYINT         DEFAULT 0               COMMENT '性别：0未知 1男 2女',
  `session_key`  VARCHAR(255)    DEFAULT NULL            COMMENT '会话密钥',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_unionid` (`unionid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信用户信息';


-- 微信订阅消息记录
CREATE TABLE `wechat_subscriptions` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`      BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `openid`       VARCHAR(100)    NOT NULL               COMMENT '微信openid',
  `template_id`  VARCHAR(100)    NOT NULL               COMMENT '订阅消息模板ID',
  `scene`        VARCHAR(100)    DEFAULT NULL           COMMENT '订阅场景（如：order_status订单状态）',
  `status`       TINYINT         DEFAULT 1              COMMENT '状态：0拒绝 1同意',
  `subscribed_at` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订阅时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_openid_template` (`openid`, `template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信订阅消息记录';


-- ================================================================
-- 🛍️ 商品模块（5张表）
-- ================================================================

-- 商品分类（支持多级）
CREATE TABLE `categories` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `parent_id`    INT UNSIGNED    DEFAULT 0              COMMENT '父级ID，0为顶级',
  `name`         VARCHAR(100)    NOT NULL               COMMENT '分类名称',
  `icon`         VARCHAR(500)    DEFAULT NULL           COMMENT '分类图标',
  `image`        VARCHAR(500)    DEFAULT NULL           COMMENT '分类图片',
  `sort`         INT             DEFAULT 0              COMMENT '排序（数字越小越靠前）',
  `level`        TINYINT         DEFAULT 1              COMMENT '层级：1一级 2二级 3三级',
  `status`       TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1启用',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类（支持多级）';


-- 商品主表
CREATE TABLE `products` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `category_id`  INT UNSIGNED    NOT NULL               COMMENT '分类ID',
  `name`         VARCHAR(200)    NOT NULL               COMMENT '商品名称',
  `subtitle`     VARCHAR(300)    DEFAULT NULL           COMMENT '副标题/简介',
  `main_image`   VARCHAR(500)    NOT NULL               COMMENT '主图URL',
  `description`  LONGTEXT        DEFAULT NULL           COMMENT '图文详情（富文本HTML）',
  `brand`        VARCHAR(100)    DEFAULT NULL           COMMENT '品牌',
  `unit`         VARCHAR(20)     DEFAULT '件'           COMMENT '单位',
  `min_price`    DECIMAL(10,2)   DEFAULT 0.00           COMMENT '最低售价（冗余，方便列表展示）',
  `max_price`    DECIMAL(10,2)   DEFAULT 0.00           COMMENT '最高售价',
  `total_stock`  INT             DEFAULT 0              COMMENT '总库存（冗余）',
  `sales_count`  INT             DEFAULT 0              COMMENT '销量',
  `view_count`   INT             DEFAULT 0              COMMENT '浏览量',
  `sort`         INT             DEFAULT 0              COMMENT '排序',
  `is_hot`       TINYINT         DEFAULT 0              COMMENT '是否热门：0否 1是',
  `is_new`       TINYINT         DEFAULT 0              COMMENT '是否新品：0否 1是',
  `is_recommend`  TINYINT        DEFAULT 0              COMMENT '是否推荐：0否 1是',
  `status`       TINYINT         DEFAULT 1              COMMENT '状态：0下架 1上架 2草稿',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`   DATETIME        DEFAULT NULL           COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`),
  KEY `idx_is_hot` (`is_hot`),
  KEY `idx_is_recommend` (`is_recommend`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品主表';


-- 商品SKU（规格库存）
CREATE TABLE `product_skus` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'SKU ID',
  `product_id`   BIGINT UNSIGNED NOT NULL               COMMENT '商品ID',
  `sku_code`     VARCHAR(100)    DEFAULT NULL           COMMENT 'SKU编码',
  `specs`        JSON            DEFAULT NULL           COMMENT '规格组合，如：{"颜色":"红色","尺码":"XL"}',
  `price`        DECIMAL(10,2)   NOT NULL               COMMENT '售价',
  `original_price` DECIMAL(10,2) DEFAULT NULL           COMMENT '原价/划线价',
  `cost_price`   DECIMAL(10,2)   DEFAULT NULL           COMMENT '成本价',
  `stock`        INT             NOT NULL DEFAULT 0     COMMENT '库存数量',
  `sales_count`  INT             DEFAULT 0              COMMENT '该SKU销量',
  `image`        VARCHAR(500)    DEFAULT NULL           COMMENT 'SKU图片（可覆盖主图）',
  `weight`       DECIMAL(8,3)    DEFAULT NULL           COMMENT '重量（kg）',
  `status`       TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1启用',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_sku_code` (`sku_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SKU规格库存';


-- 商品规格属性定义
CREATE TABLE `product_attributes` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '属性ID',
  `product_id`   BIGINT UNSIGNED NOT NULL               COMMENT '商品ID',
  `attr_name`    VARCHAR(50)     NOT NULL               COMMENT '属性名称，如：颜色、尺码',
  `attr_values`  JSON            NOT NULL               COMMENT '属性值列表，如：["红色","蓝色","白色"]',
  `sort`         INT             DEFAULT 0              COMMENT '排序',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品规格属性定义';


-- 商品图片
CREATE TABLE `product_images` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `product_id`   BIGINT UNSIGNED NOT NULL               COMMENT '商品ID',
  `url`          VARCHAR(500)    NOT NULL               COMMENT '图片URL',
  `sort`         INT             DEFAULT 0              COMMENT '排序',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品图片';


-- ================================================================
-- 🛒 购物车 & 订单模块（3张表）
-- ================================================================

-- 购物车
CREATE TABLE `carts` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`      BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `product_id`   BIGINT UNSIGNED NOT NULL               COMMENT '商品ID',
  `sku_id`       BIGINT UNSIGNED NOT NULL               COMMENT 'SKU ID',
  `quantity`     INT             NOT NULL DEFAULT 1     COMMENT '数量',
  `selected`     TINYINT         DEFAULT 1              COMMENT '是否选中：0否 1是',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sku` (`user_id`, `sku_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车';


-- 订单主表
CREATE TABLE `orders` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`        VARCHAR(64)     NOT NULL               COMMENT '订单编号（唯一）',
  `user_id`         BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `status`          TINYINT         NOT NULL DEFAULT 0      COMMENT '订单状态：0待付款 1待发货 2待收货 3已完成 4已取消 5售后中',
  `total_amount`    DECIMAL(10,2)   NOT NULL               COMMENT '商品总金额',
  `discount_amount` DECIMAL(10,2)   DEFAULT 0.00           COMMENT '优惠金额',
  `freight_amount`  DECIMAL(10,2)   DEFAULT 0.00           COMMENT '运费',
  `pay_amount`      DECIMAL(10,2)   NOT NULL               COMMENT '实际支付金额',
  `coupon_id`       BIGINT UNSIGNED DEFAULT NULL           COMMENT '使用的优惠券ID',
  `pay_type`        TINYINT         DEFAULT NULL           COMMENT '支付方式：1微信支付 2支付宝',
  `pay_time`        DATETIME        DEFAULT NULL           COMMENT '支付时间',
  `receiver_name`   VARCHAR(50)     NOT NULL               COMMENT '收货人姓名（快照）',
  `receiver_mobile` VARCHAR(20)     NOT NULL               COMMENT '收货人手机号（快照）',
  `receiver_address` VARCHAR(500)   NOT NULL               COMMENT '完整收货地址（快照）',
  `remark`          VARCHAR(500)    DEFAULT NULL           COMMENT '买家备注',
  `cancel_reason`   VARCHAR(200)    DEFAULT NULL           COMMENT '取消原因',
  `cancelled_at`    DATETIME        DEFAULT NULL           COMMENT '取消时间',
  `completed_at`    DATETIME        DEFAULT NULL           COMMENT '完成时间',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';


-- 订单商品明细
CREATE TABLE `order_items` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_id`      BIGINT UNSIGNED NOT NULL               COMMENT '订单ID',
  `order_no`      VARCHAR(64)     NOT NULL               COMMENT '订单编号',
  `product_id`    BIGINT UNSIGNED NOT NULL               COMMENT '商品ID（快照）',
  `sku_id`        BIGINT UNSIGNED NOT NULL               COMMENT 'SKU ID（快照）',
  `product_name`  VARCHAR(200)    NOT NULL               COMMENT '商品名称（快照）',
  `product_image` VARCHAR(500)    DEFAULT NULL           COMMENT '商品主图（快照）',
  `specs`         JSON            DEFAULT NULL           COMMENT '规格信息（快照）',
  `price`         DECIMAL(10,2)   NOT NULL               COMMENT '购买单价（快照）',
  `quantity`      INT             NOT NULL               COMMENT '购买数量',
  `total_amount`  DECIMAL(10,2)   NOT NULL               COMMENT '小计金额',
  `is_reviewed`   TINYINT         DEFAULT 0              COMMENT '是否已评价：0否 1是',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细';


-- ================================================================
-- 💳 支付模块（1张表）
-- ================================================================

-- 支付记录
CREATE TABLE `payments` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '支付ID',
  `pay_no`          VARCHAR(64)     NOT NULL               COMMENT '支付单号（内部）',
  `order_id`        BIGINT UNSIGNED NOT NULL               COMMENT '订单ID',
  `order_no`        VARCHAR(64)     NOT NULL               COMMENT '订单编号',
  `user_id`         BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `pay_type`        TINYINT         NOT NULL               COMMENT '支付方式：1微信支付 2支付宝',
  `amount`          DECIMAL(10,2)   NOT NULL               COMMENT '支付金额',
  `status`          TINYINT         DEFAULT 0              COMMENT '状态：0待支付 1支付成功 2支付失败 3已退款',
  `transaction_id`  VARCHAR(100)    DEFAULT NULL           COMMENT '第三方支付流水号',
  `paid_at`         DATETIME        DEFAULT NULL           COMMENT '支付成功时间',
  `refund_amount`   DECIMAL(10,2)   DEFAULT 0.00           COMMENT '退款金额',
  `refunded_at`     DATETIME        DEFAULT NULL           COMMENT '退款时间',
  `raw_response`    JSON            DEFAULT NULL           COMMENT '第三方支付原始响应（调试用）',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pay_no` (`pay_no`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录';


-- ================================================================
-- ⭐ 评价模块（1张表）
-- ================================================================

-- 商品评价
CREATE TABLE `reviews` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `user_id`       BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `order_id`      BIGINT UNSIGNED NOT NULL               COMMENT '订单ID',
  `order_item_id` BIGINT UNSIGNED NOT NULL               COMMENT '订单明细ID',
  `product_id`    BIGINT UNSIGNED NOT NULL               COMMENT '商品ID',
  `sku_id`        BIGINT UNSIGNED NOT NULL               COMMENT 'SKU ID',
  `rating`        TINYINT         NOT NULL DEFAULT 5     COMMENT '评分：1-5星',
  `content`       TEXT            DEFAULT NULL           COMMENT '评价内容',
  `images`        JSON            DEFAULT NULL           COMMENT '评价图片URL列表',
  `is_anonymous`  TINYINT         DEFAULT 0              COMMENT '是否匿名：0否 1是',
  `status`        TINYINT         DEFAULT 1              COMMENT '状态：0隐藏 1显示',
  `reply`         TEXT            DEFAULT NULL           COMMENT '商家回复',
  `replied_at`    DATETIME        DEFAULT NULL           COMMENT '回复时间',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_item` (`order_item_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品评价';


-- ================================================================
-- 🎟️ 营销模块（2张表）
-- ================================================================

-- 优惠券定义
CREATE TABLE `coupons` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `name`            VARCHAR(100)    NOT NULL               COMMENT '优惠券名称',
  `type`            TINYINT         NOT NULL               COMMENT '类型：1满减券 2折扣券 3无门槛券',
  `discount_amount` DECIMAL(10,2)   DEFAULT 0.00           COMMENT '满减金额（满减券用）',
  `discount_rate`   DECIMAL(4,2)    DEFAULT NULL           COMMENT '折扣率（折扣券用，如0.85表示85折）',
  `min_amount`      DECIMAL(10,2)   DEFAULT 0.00           COMMENT '使用门槛（最低消费金额）',
  `max_discount`    DECIMAL(10,2)   DEFAULT NULL           COMMENT '最高优惠金额（折扣券封顶）',
  `total_count`     INT             DEFAULT NULL           COMMENT '发放总量，NULL为不限',
  `received_count`  INT             DEFAULT 0              COMMENT '已领取数量',
  `used_count`      INT             DEFAULT 0              COMMENT '已使用数量',
  `per_user_limit`  INT             DEFAULT 1              COMMENT '每人限领数量',
  `valid_type`      TINYINT         DEFAULT 1              COMMENT '有效期类型：1固定时间段 2领取后N天',
  `valid_days`      INT             DEFAULT NULL           COMMENT '领取后有效天数',
  `start_time`      DATETIME        DEFAULT NULL           COMMENT '固定有效期开始时间',
  `end_time`        DATETIME        DEFAULT NULL           COMMENT '固定有效期结束时间',
  `status`          TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1启用',
  `description`     VARCHAR(300)    DEFAULT NULL           COMMENT '使用说明',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券定义';


-- 用户优惠券
CREATE TABLE `user_coupons` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`     BIGINT UNSIGNED NOT NULL               COMMENT '用户ID',
  `coupon_id`   INT UNSIGNED    NOT NULL               COMMENT '优惠券ID',
  `status`      TINYINT         DEFAULT 0              COMMENT '状态：0未使用 1已使用 2已过期',
  `order_id`    BIGINT UNSIGNED DEFAULT NULL           COMMENT '使用的订单ID',
  `used_at`     DATETIME        DEFAULT NULL           COMMENT '使用时间',
  `expire_at`   DATETIME        DEFAULT NULL           COMMENT '过期时间',
  `received_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_coupon_id` (`coupon_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券';


-- ================================================================
-- 📦 物流模块（1张表）
-- ================================================================

-- 发货物流记录
CREATE TABLE `shipments` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_id`        BIGINT UNSIGNED NOT NULL               COMMENT '订单ID',
  `order_no`        VARCHAR(64)     NOT NULL               COMMENT '订单编号',
  `express_company` VARCHAR(100)    DEFAULT NULL           COMMENT '快递公司名称',
  `express_code`    VARCHAR(50)     DEFAULT NULL           COMMENT '快递公司编码（如：SF、YTO）',
  `tracking_no`     VARCHAR(100)    NOT NULL               COMMENT '快递单号',
  `status`          TINYINT         DEFAULT 0              COMMENT '物流状态：0已揽件 1运输中 2派送中 3已签收 4异常',
  `shipped_at`      DATETIME        DEFAULT NULL           COMMENT '发货时间',
  `received_at`     DATETIME        DEFAULT NULL           COMMENT '签收时间',
  `receiver_name`   VARCHAR(50)     DEFAULT NULL           COMMENT '收货人（快照）',
  `receiver_mobile` VARCHAR(20)     DEFAULT NULL           COMMENT '收货人电话（快照）',
  `receiver_address` VARCHAR(500)   DEFAULT NULL           COMMENT '收货地址（快照）',
  `remark`          VARCHAR(300)    DEFAULT NULL           COMMENT '备注',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_tracking_no` (`tracking_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发货物流记录';


-- ================================================================
-- 🔐 后台管理模块（8张表）
-- ================================================================

-- 管理员账号
CREATE TABLE `admins` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username`     VARCHAR(50)     NOT NULL               COMMENT '用户名',
  `password`     VARCHAR(255)    NOT NULL               COMMENT '密码（加密）',
  `real_name`    VARCHAR(50)     DEFAULT NULL           COMMENT '真实姓名',
  `avatar`       VARCHAR(500)    DEFAULT NULL           COMMENT '头像',
  `mobile`       VARCHAR(20)     DEFAULT NULL           COMMENT '手机号',
  `email`        VARCHAR(100)    DEFAULT NULL           COMMENT '邮箱',
  `status`       TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1正常',
  `is_super`     TINYINT         DEFAULT 0              COMMENT '是否超级管理员：0否 1是',
  `last_login_at` DATETIME       DEFAULT NULL           COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50)    DEFAULT NULL           COMMENT '最后登录IP',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`   DATETIME        DEFAULT NULL           COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员账号';


-- 角色
CREATE TABLE `roles` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name`         VARCHAR(50)     NOT NULL               COMMENT '角色名称',
  `code`         VARCHAR(50)     NOT NULL               COMMENT '角色标识（英文唯一码，如：super_admin）',
  `description`  VARCHAR(200)    DEFAULT NULL           COMMENT '角色描述',
  `status`       TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1启用',
  `sort`         INT             DEFAULT 0              COMMENT '排序',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色';


-- 权限（操作级/按钮级）
CREATE TABLE `permissions` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `parent_id`    INT UNSIGNED    DEFAULT 0              COMMENT '父级ID，0为顶级',
  `name`         VARCHAR(100)    NOT NULL               COMMENT '权限名称，如：商品管理-新增',
  `code`         VARCHAR(100)    NOT NULL               COMMENT '权限标识，如：product:create',
  `type`         TINYINT         DEFAULT 2              COMMENT '类型：1模块 2操作',
  `description`  VARCHAR(200)    DEFAULT NULL           COMMENT '描述',
  `sort`         INT             DEFAULT 0              COMMENT '排序',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表（操作/按钮级）';


-- 角色 ↔ 权限（多对多）
CREATE TABLE `role_permissions` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id`       INT UNSIGNED    NOT NULL               COMMENT '角色ID',
  `permission_id` INT UNSIGNED    NOT NULL               COMMENT '权限ID',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联';


-- 管理员 ↔ 角色（多对多）
CREATE TABLE `admin_roles` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `admin_id`   INT UNSIGNED    NOT NULL               COMMENT '管理员ID',
  `role_id`    INT UNSIGNED    NOT NULL               COMMENT '角色ID',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_role` (`admin_id`, `role_id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色关联';


-- 菜单（支持多级树形）
CREATE TABLE `menus` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `parent_id`   INT UNSIGNED    DEFAULT 0              COMMENT '父级ID，0为顶级',
  `name`        VARCHAR(100)    NOT NULL               COMMENT '菜单名称',
  `icon`        VARCHAR(100)    DEFAULT NULL           COMMENT '菜单图标（icon class或svg）',
  `path`        VARCHAR(200)    DEFAULT NULL           COMMENT '前端路由路径',
  `component`   VARCHAR(200)    DEFAULT NULL           COMMENT '前端组件路径',
  `permission`  VARCHAR(100)    DEFAULT NULL           COMMENT '关联权限标识',
  `type`        TINYINT         DEFAULT 1              COMMENT '类型：1目录 2菜单 3按钮',
  `sort`        INT             DEFAULT 0              COMMENT '排序',
  `is_hidden`   TINYINT         DEFAULT 0              COMMENT '是否隐藏：0显示 1隐藏',
  `is_cache`    TINYINT         DEFAULT 0              COMMENT '是否缓存页面：0否 1是',
  `status`      TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1启用',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台菜单（支持多级树形）';


-- 角色 ↔ 菜单（多对多）
CREATE TABLE `role_menus` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id`    INT UNSIGNED    NOT NULL               COMMENT '角色ID',
  `menu_id`    INT UNSIGNED    NOT NULL               COMMENT '菜单ID',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_menu` (`role_id`, `menu_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联';


-- 管理员操作日志
CREATE TABLE `admin_logs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `admin_id`     INT UNSIGNED    NOT NULL               COMMENT '管理员ID',
  `admin_name`   VARCHAR(50)     DEFAULT NULL           COMMENT '管理员用户名（快照）',
  `module`       VARCHAR(50)     DEFAULT NULL           COMMENT '操作模块，如：商品管理',
  `action`       VARCHAR(100)    NOT NULL               COMMENT '操作描述，如：新增商品',
  `method`       VARCHAR(10)     DEFAULT NULL           COMMENT '请求方式：GET POST PUT DELETE',
  `url`          VARCHAR(300)    DEFAULT NULL           COMMENT '请求URL',
  `params`       JSON            DEFAULT NULL           COMMENT '请求参数',
  `ip`           VARCHAR(50)     DEFAULT NULL           COMMENT '操作IP',
  `user_agent`   VARCHAR(500)    DEFAULT NULL           COMMENT '浏览器UA',
  `result`       TINYINT         DEFAULT 1              COMMENT '操作结果：0失败 1成功',
  `error_msg`    VARCHAR(500)    DEFAULT NULL           COMMENT '失败原因',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_module` (`module`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志';


-- ================================================================
-- 🔧 系统通用模块（4张表）
-- ================================================================

-- 系统配置（键值对）
CREATE TABLE `system_configs` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `group`       VARCHAR(50)     NOT NULL               COMMENT '配置分组，如：shop、wechat、freight',
  `key`         VARCHAR(100)    NOT NULL               COMMENT '配置键名',
  `value`       TEXT            DEFAULT NULL           COMMENT '配置值',
  `type`        VARCHAR(20)     DEFAULT 'string'       COMMENT '值类型：string、number、boolean、json',
  `description` VARCHAR(200)    DEFAULT NULL           COMMENT '配置说明',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_key` (`group`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置键值对';


-- 首页轮播图
CREATE TABLE `banners` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `title`       VARCHAR(100)    DEFAULT NULL           COMMENT '标题',
  `image`       VARCHAR(500)    NOT NULL               COMMENT '图片URL',
  `link_type`   TINYINT         DEFAULT 0              COMMENT '链接类型：0无跳转 1商品 2分类 3外部URL',
  `link_value`  VARCHAR(300)    DEFAULT NULL           COMMENT '链接值（商品ID、分类ID或URL）',
  `position`    VARCHAR(50)     DEFAULT 'home'         COMMENT '展示位置：home首页 activity活动页',
  `sort`        INT             DEFAULT 0              COMMENT '排序',
  `status`      TINYINT         DEFAULT 1              COMMENT '状态：0禁用 1启用',
  `start_time`  DATETIME        DEFAULT NULL           COMMENT '展示开始时间',
  `end_time`    DATETIME        DEFAULT NULL           COMMENT '展示结束时间',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_position_sort` (`position`, `sort`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页轮播图';


-- 消息通知
CREATE TABLE `notifications` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`     BIGINT UNSIGNED DEFAULT NULL           COMMENT '用户ID，NULL为全体用户',
  `title`       VARCHAR(200)    NOT NULL               COMMENT '通知标题',
  `content`     TEXT            DEFAULT NULL           COMMENT '通知内容',
  `type`        TINYINT         DEFAULT 1              COMMENT '类型：1系统通知 2订单消息 3促销活动',
  `link_type`   TINYINT         DEFAULT 0              COMMENT '跳转类型：0无 1订单 2商品',
  `link_value`  VARCHAR(100)    DEFAULT NULL           COMMENT '跳转值',
  `is_read`     TINYINT         DEFAULT 0              COMMENT '是否已读：0未读 1已读',
  `read_at`     DATETIME        DEFAULT NULL           COMMENT '阅读时间',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知';


-- 文件上传记录
CREATE TABLE `file_uploads` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `uploader_id`  BIGINT UNSIGNED DEFAULT NULL           COMMENT '上传者ID（用户或管理员）',
  `uploader_type` TINYINT        DEFAULT 1              COMMENT '上传者类型：1用户 2管理员',
  `original_name` VARCHAR(255)   DEFAULT NULL           COMMENT '原始文件名',
  `file_name`    VARCHAR(255)    NOT NULL               COMMENT '存储文件名',
  `file_path`    VARCHAR(500)    NOT NULL               COMMENT '存储路径（OSS Key）',
  `file_url`     VARCHAR(500)    NOT NULL               COMMENT '访问URL',
  `file_type`    VARCHAR(50)     DEFAULT NULL           COMMENT '文件类型，如：image/jpeg',
  `file_size`    BIGINT          DEFAULT NULL           COMMENT '文件大小（字节）',
  `storage`      VARCHAR(50)     DEFAULT 'oss'          COMMENT '存储类型：oss、local、cos',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`id`),
  KEY `idx_uploader` (`uploader_id`, `uploader_type`),
  KEY `idx_file_type` (`file_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件上传记录';


-- ================================================================
-- 初始化数据
-- ================================================================

-- 默认超级管理员（密码：admin123，实际部署后请尽快修改）
INSERT INTO `admins` (`username`, `password`, `real_name`, `is_super`, `status`)
VALUES ('admin', '$2a$10$tca6jJOXDUKYOZwDP1Q9oefcbWUrkfTV2j1S7WagFJUmHW47E.e.i', '超级管理员', 1, 1);

-- 默认角色
INSERT INTO `roles` (`name`, `code`, `description`, `sort`) VALUES
('超级管理员', 'super_admin', '拥有所有权限', 1),
('运营人员',   'operator',   '负责商品、订单、营销管理', 2),
('客服人员',   'customer_service', '负责订单查看和售后处理', 3);

-- 默认顶级菜单
INSERT INTO `menus` (`parent_id`, `name`, `icon`, `path`, `type`, `sort`) VALUES
(0, '首页',     'HomeFilled', '/dashboard', 1, 1),
(0, '商品管理', 'Goods',      '/products',  1, 2),
(0, '订单管理', 'List',       '/orders',    1, 3),
(0, '用户管理', 'User',       '/users',     1, 4),
(0, '系统设置', 'Setting',    '/system',    1, 5);

-- 系统基础配置
INSERT INTO `system_configs` (`group`, `key`, `value`, `type`, `description`) VALUES
('shop',    'shop_name',     '我的小店',     'string', '店铺名称'),
('shop',    'shop_logo',     '',             'string', '店铺Logo'),
('shop',    'service_phone', '',             'string', '客服电话'),
('freight', 'free_amount',   '99',           'number', '免运费金额（元）'),
('freight', 'default_fee',   '10',           'number', '默认运费（元）'),
('wechat',  'app_id',        '',             'string', '微信小程序AppID'),
('wechat',  'app_secret',    '',             'string', '微信小程序AppSecret');
