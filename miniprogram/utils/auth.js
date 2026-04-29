const login = async () => {
  const result = await wx.login();
  return result.code;
};

module.exports = {
  login,
};
