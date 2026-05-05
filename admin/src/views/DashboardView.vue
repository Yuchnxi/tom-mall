<template>
  <div class="dashboard-page">
    <section class="overview-grid">
      <article
        v-for="card in overviewCards"
        :key="card.label"
        class="overview-card tm-panel"
      >
        <div class="overview-card__copy">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <p>
            较昨日
            <em>{{ card.trend }}</em>
          </p>
        </div>

        <div
          class="overview-card__icon"
          :style="{ '--icon-color': card.color }"
        >
          <el-icon>
            <component :is="card.icon" />
          </el-icon>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="chart-card tm-panel">
        <div class="card-head">
          <div>
            <span class="card-kicker">销售额趋势</span>
            <h3>近 7 天销售表现</h3>
          </div>

          <div class="head-tabs">
            <button
              class="is-active"
              type="button"
            >
              近 7 天
            </button>
            <button
              type="button"
            >
              近 30 天
            </button>
            <button
              type="button"
            >
              近一年
            </button>
          </div>
        </div>

        <div class="line-chart">
          <div class="line-chart__grid" />

          <svg
            viewBox="0 0 720 300"
            class="line-chart__svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="lineFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stop-color="rgba(61, 213, 152, 0.26)"
                />
                <stop
                  offset="100%"
                  stop-color="rgba(61, 213, 152, 0)"
                />
              </linearGradient>
            </defs>

            <path
              d="M0,225 C65,145 125,138 180,188 C225,226 275,214 316,156 C348,110 398,160 434,154 C470,147 494,103 530,122 C572,144 604,205 644,188 C676,174 700,124 720,94 L720,300 L0,300 Z"
              fill="url(#lineFill)"
            />
            <path
              d="M0,225 C65,145 125,138 180,188 C225,226 275,214 316,156 C348,110 398,160 434,154 C470,147 494,103 530,122 C572,144 604,205 644,188 C676,174 700,124 720,94"
              fill="none"
              stroke="#43dea4"
              stroke-width="4"
              stroke-linecap="round"
            />
          </svg>

          <div class="line-chart__tooltip">
            <span>05-20</span>
            <strong>¥ 68,688</strong>
          </div>

          <div class="line-chart__axis">
            <span>05-16</span>
            <span>05-17</span>
            <span>05-18</span>
            <span>05-19</span>
            <span>05-20</span>
            <span>05-21</span>
            <span>05-22</span>
          </div>
        </div>
      </article>

      <article class="distribution-card tm-panel">
        <div class="card-head">
          <div>
            <span class="card-kicker">订单状态分布</span>
            <h3>当前订单结构</h3>
          </div>
        </div>

        <div class="distribution-body">
          <div class="donut-wrap">
            <div class="donut-chart">
              <div class="donut-chart__center">
                <strong>2,456</strong>
                <span>总订单</span>
              </div>
            </div>
          </div>

          <ul class="status-list">
            <li
              v-for="item in orderStatus"
              :key="item.label"
            >
              <span
                class="status-dot"
                :style="{ '--dot-color': item.color }"
              />
              <span class="status-label">{{ item.label }}</span>
              <strong>{{ item.percent }}</strong>
              <em>({{ item.count }})</em>
            </li>
          </ul>
        </div>
      </article>
    </section>

    <section class="table-card tm-panel">
      <div class="card-head">
        <div>
          <span class="card-kicker">最近订单</span>
          <h3>订单动态</h3>
        </div>

        <button
          type="button"
          class="more-link"
        >
          查看更多
        </button>
      </div>

      <el-table
        :data="recentOrders"
        class="dashboard-table"
      >
        <el-table-column
          prop="orderNo"
          label="订单号"
          min-width="160"
        />
        <el-table-column
          prop="userName"
          label="用户"
          min-width="100"
        />
        <el-table-column
          prop="productName"
          label="商品"
          min-width="240"
        />
        <el-table-column
          prop="amount"
          label="金额"
          min-width="120"
        />
        <el-table-column
          label="状态"
          min-width="110"
        >
          <template #default="{ row }">
            <span
              class="status-pill"
              :class="`status-pill--${row.statusType}`"
            >
              {{ row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="下单时间"
          min-width="180"
        />
        <el-table-column
          label="操作"
          min-width="80"
          fixed="right"
        >
          <template #default>
            <button
              type="button"
              class="table-action"
            >
              查看
            </button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import {
  Checked,
  Document,
  Money,
  User,
} from '@element-plus/icons-vue';

const overviewCards = [
  { label: '今日订单数', value: '356', trend: '+12.8%', icon: Document, color: '#f3b857' },
  { label: '今日销售额', value: '¥ 68,888.00', trend: '+18.0%', icon: Money, color: '#3dd598' },
  { label: '今日新增用户', value: '236', trend: '+9.3%', icon: User, color: '#9b6cff' },
  { label: '待处理订单', value: '78', trend: '-2.1%', icon: Checked, color: '#f3b857' },
];

const orderStatus = [
  { label: '待付款', percent: '15.6%', count: 383, color: '#44bafc' },
  { label: '待发货', percent: '18.9%', count: 464, color: '#3dd598' },
  { label: '待收货', percent: '26.3%', count: 645, color: '#f4c15f' },
  { label: '已完成', percent: '30.2%', count: 741, color: '#31c1a6' },
  { label: '已关闭', percent: '9.0%', count: 223, color: '#8468ff' },
];

const recentOrders = [
  {
    orderNo: '202405220001',
    userName: '张三',
    productName: 'Apple iPhone 15 Pro Max 256GB',
    amount: '¥ 8,999.00',
    status: '待发货',
    statusType: 'success',
    createdAt: '2024-05-22 14:30:25',
  },
  {
    orderNo: '202405220002',
    userName: '李四',
    productName: '华为 Mate 60 Pro 12GB+512GB',
    amount: '¥ 6,999.00',
    status: '待付款',
    statusType: 'warning',
    createdAt: '2024-05-22 13:21:10',
  },
  {
    orderNo: '202405220003',
    userName: '王五',
    productName: '小米 14 Ultra 16GB+512GB',
    amount: '¥ 5,999.00',
    status: '已完成',
    statusType: 'info',
    createdAt: '2024-05-22 10:06:48',
  },
];
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.overview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
}

.overview-card__copy span,
.card-kicker {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--tm-color-text-faint);
}

.overview-card__copy strong {
  display: block;
  font-family: var(--tm-font-display);
  font-size: clamp(24px, 2vw, 34px);
  color: var(--tm-color-text);
}

.overview-card__copy p {
  margin: 12px 0 0;
  color: var(--tm-color-text-soft);
  font-size: 13px;
}

.overview-card__copy em {
  margin-left: 6px;
  color: var(--tm-color-primary);
  font-style: normal;
}

.overview-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  color: var(--icon-color);
  background: color-mix(in srgb, var(--icon-color) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--icon-color) 18%, transparent);
  font-size: 22px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1.1fr;
  gap: 20px;
}

.chart-card,
.distribution-card,
.table-card {
  padding: 22px 24px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-head h3 {
  margin: 0;
  font-size: 20px;
  color: var(--tm-color-text);
}

.head-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
}

.head-tabs button,
.more-link,
.table-action {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.head-tabs button {
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--tm-color-text-faint);
}

.head-tabs button.is-active {
  color: #ffffff;
  background: rgba(61, 213, 152, 0.16);
}

.line-chart {
  position: relative;
  margin-top: 22px;
  padding-top: 14px;
}

.line-chart__grid {
  position: absolute;
  inset: 14px 0 30px;
  border-radius: 16px;
  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 100% 56px;
}

.line-chart__svg {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 280px;
}

.line-chart__tooltip {
  position: absolute;
  top: 74px;
  left: 58%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(6, 12, 17, 0.88);
  border: 1px solid rgba(145, 177, 193, 0.12);
}

.line-chart__tooltip span {
  font-size: 12px;
  color: var(--tm-color-text-faint);
}

.line-chart__tooltip strong {
  font-size: 14px;
  color: #ffffff;
}

.line-chart__axis {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-top: -6px;
  color: var(--tm-color-text-faint);
  font-size: 12px;
}

.distribution-body {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 16px;
  align-items: center;
  margin-top: 28px;
}

.donut-wrap {
  display: flex;
  justify-content: center;
}

.donut-chart {
  position: relative;
  width: 186px;
  height: 186px;
  border-radius: 50%;
  background:
    conic-gradient(
      #44bafc 0% 15.6%,
      #3dd598 15.6% 34.5%,
      #f4c15f 34.5% 60.8%,
      #31c1a6 60.8% 91%,
      #8468ff 91% 100%
    );
}

.donut-chart::before {
  content: '';
  position: absolute;
  inset: 26px;
  border-radius: 50%;
  background: var(--tm-color-panel);
  box-shadow: inset 0 0 0 1px var(--tm-color-border);
}

.donut-chart__center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-chart__center strong {
  font-size: 30px;
  color: var(--tm-color-text);
}

.donut-chart__center span {
  margin-top: 6px;
  font-size: 13px;
  color: var(--tm-color-text-faint);
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.status-list li {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  gap: 10px;
  align-items: center;
  color: var(--tm-color-text-soft);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot-color);
}

.status-label {
  min-width: 0;
}

.status-list strong {
  color: var(--tm-color-text);
}

.status-list em {
  color: var(--tm-color-text-faint);
  font-style: normal;
}

.more-link,
.table-action {
  color: var(--tm-color-primary);
  font-weight: 600;
}

.dashboard-table {
  margin-top: 18px;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-border-color: rgba(136, 170, 189, 0.08);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.02);
  --el-table-header-text-color: var(--tm-color-text-soft);
  --el-table-text-color: var(--tm-color-text);
}

.dashboard-table :deep(th.el-table__cell) {
  font-weight: 500;
}

.dashboard-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.status-pill--success {
  color: #61e3ad;
  background: rgba(61, 213, 152, 0.12);
}

.status-pill--warning {
  color: #f5c46c;
  background: rgba(245, 196, 108, 0.12);
}

.status-pill--info {
  color: #62c5ff;
  background: rgba(98, 197, 255, 0.12);
}

@media (max-width: 1280px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .distribution-body {
    grid-template-columns: 1fr;
  }

  .line-chart__tooltip {
    left: auto;
    right: 16px;
  }
}

@media (max-width: 640px) {
  .chart-card,
  .distribution-card,
  .table-card {
    padding: 18px 16px;
  }

  .card-head {
    flex-direction: column;
  }

  .head-tabs {
    width: 100%;
    overflow: auto;
  }
}
</style>
