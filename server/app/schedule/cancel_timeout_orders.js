'use strict';

module.exports = {
  schedule: {
    interval: '5m',
    type: 'worker',
  },

  async task(ctx) {
    ctx.logger.info('[schedule:cancel_timeout_orders] 定时任务已触发');
  },
};
