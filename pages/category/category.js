const quotes = require('../../utils/quotes');

Page({
  data: {
    cats: [],
    total: 0,
    kw: ''
  },

  onLoad() {
    const cats = quotes.categories.map(c => ({
      ...c,
      count: quotes.quotes.filter(q => q.cat === c.name).length
    }));
    this.setData({ cats, total: quotes.quotes.length });
  },

  onShow() {
    // 若从列表页返回，无状态需要刷新
  },

  onKwInput(e) {
    this.setData({ kw: e.detail.value });
  },

  doSearch() {
    const kw = (this.data.kw || '').trim();
    if (!kw) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/list/list?kw=${encodeURIComponent(kw)}` });
  },

  goList(e) {
    const cat = e.currentTarget.dataset.cat;
    wx.navigateTo({ url: `/pages/list/list?cat=${encodeURIComponent(cat)}` });
  }
});
