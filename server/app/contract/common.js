'use strict';

module.exports = {
  baseResponse: {
    code: { type: 'integer', required: true, example: 0 },
    message: { type: 'string', required: true, example: 'ok' },
    data: { type: 'string', required: false, example: '{}' },
  },
};
