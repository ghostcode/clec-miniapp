const quotes = require('../../utils/quotes');

Page({
  data: {
    title: '',
    catInfo: null,
    list: [],
    favs: [],
    shareShow: false,
    shareQuote: null
  },

  onLoad(options) {
    this.favs = wx.getStorageSync('favorites') || [];
    let list = [];
    let title = '';
    let catInfo = null;

    if (options.cat) {
      const cat = decodeURIComponent(options.cat);
      list = quotes.getByCat(cat);
      title = cat;
      catInfo = quotes.catMap[cat];
      wx.setNavigationBarTitle({ title: cat + ' · ' + list.length + ' 条' });
    } else if (options.kw) {
      const kw = decodeURIComponent(options.kw);
      list = quotes.search(kw);
      title = `搜索「${kw}」`;
      wx.setNavigationBarTitle({ title: `搜索：${kw}（${list.length} 条）` });
    }

    this.setData({
      title,
      catInfo,
      list: list.map(q => ({ ...q, isFav: this.favs.indexOf(q.id) > -1 }))
    });
  },

  onShow() {
    this.favs = wx.getStorageSync('favorites') || [];
    this.setData({
      list: this.data.list.map(q => ({ ...q, isFav: this.favs.indexOf(q.id) > -1 }))
    });
  },

  toggleFav(e) {
    const id = e.currentTarget.dataset.id;
    const pos = this.favs.indexOf(id);
    if (pos > -1) {
      this.favs.splice(pos, 1);
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      this.favs.push(id);
      wx.showToast({ title: '已收藏', icon: 'success' });
    }
    wx.setStorageSync('favorites', this.favs);
    this.setData({
      list: this.data.list.map(q => ({ ...q, isFav: this.favs.indexOf(q.id) > -1 }))
    });
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

  onShareAppMessage() {
    return {
      title: `CLEC 语录 · ${this.data.title}`,
      path: '/pages/index/index'
    };
  }
});
