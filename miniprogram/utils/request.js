const app = getApp();

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(options.header || {}),
      },
      success: res => {
        const { code, message, data } = res.data;
        if (code === 0) {
          resolve(data);
          return;
        }

        wx.showToast({
          title: message || '请求失败',
          icon: 'none',
        });
        reject(new Error(message || '请求失败'));
      },
      fail: error => {
        wx.showToast({
          title: '网络错误',
          icon: 'none',
        });
        reject(error);
      },
    });
  });
};

module.exports = request;
