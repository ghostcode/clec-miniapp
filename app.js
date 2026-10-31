App({
  onLaunch() {
    // 初始化收藏存储
    if (!wx.getStorageSync('favorites')) {
      wx.setStorageSync('favorites', []);
    }
  },
  globalData: {
    version: '1.0.0'
  }
});
