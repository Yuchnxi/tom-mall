'use strict';

const Service = require('egg').Service;

class BaseService extends Service {
  /**
   * 抛出统一业务错误
   * @param {number} code - 业务错误码
   * @param {string} message - 错误信息
   */
  throwBusinessError(code, message) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  /**
   * 规范化分页参数
   * - 所有列表接口默认 page=1、pageSize=20
   * - pageSize 最大限制为 50
   * @param {object} payload - 原始分页参数
   * @param {number|string} payload.page - 页码
   * @param {number|string} payload.pageSize - 每页条数
   * @return {object} 规范化后的分页参数
   */
  normalizePagination({ page = 1, pageSize = 20 } = {}) {
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safePageSize = Number(pageSize) > 0 ? Math.min(Number(pageSize), 50) : 20;

    return {
      page: safePage,
      pageSize: safePageSize,
      offset: (safePage - 1) * safePageSize,
      limit: safePageSize,
    };
  }

  /**
   * 将时间字段统一格式化为字符串
   * @param {Date|string|null} value - 原始时间
   * @param {string} format - 格式化模板
   * @return {string|null} 格式化后的时间字符串
   */
  formatDateTime(value, format = 'YYYY-MM-DD HH:mm:ss') {
    return this.ctx.helper.formatDate(value, format);
  }
}

module.exports = BaseService;
