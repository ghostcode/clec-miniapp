const quotes = require('../../utils/quotes');

Page({
  data: {
    list: [],
    shareShow: false,
    shareQuote: null
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const favs = wx.getStorageSync('favorites') || [];
    const list = favs
      .map(id => quotes.getById(id))
      .filter(Boolean)
      .map(q => ({ ...q, catInfo: quotes.catMap[q.cat] }));
    this.setData({ list });
  },

  removeFav(e) {
    const id = e.currentTarget.dataset.id;
    const favs = wx.getStorageSync('favorites') || [];
    const pos = favs.indexOf(id);
    if (pos > -1) {
      favs.splice(pos, 1);
      wx.setStorageSync('favorites', favs);
      wx.showToast({ title: '已移出收藏', icon: 'none' });
      this.refresh();
    }
  },

  copyQuote(e) {
    const q = this.data.list.find(x => x.id === e.currentTarget.dataset.id);
    if (q) {
      wx.setClipboardData({ data: `「${q.text}」\n—— ${q.src}` });
    }
  },

  openShareCard(e) {
    const q = this.data.list.find(x => x.id === e.currentTarget.dataset.id);
    if (q) this.setData({ shareQuote: q, shareShow: true });
  },

  onShareClose() {
    this.setData({ shareShow: false });
  },

  goBrowse() {
    wx.switchTab({ url: '/pages/category/category' });
  },

  onShareAppMessage() {
    return {
      title: 'CLEC 语录 · 我的收藏',
      path: '/pages/index/index'
    };
  }
});
