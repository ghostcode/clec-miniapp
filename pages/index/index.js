const quotes = require('../../utils/quotes');

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    quote: null,
    catInfo: null,
    isFav: false,
    dateStr: '',
    weekday: '',
    seq: 0,
    total: 0,
    five: [],
    shareShow: false,
    shareQuote: null
  },

  onLoad() {
    this.favs = wx.getStorageSync('favorites') || [];
    // 以「今天是当年第几天」决定今日语录，每天固定一条
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const index = dayOfYear % quotes.quotes.length;
    this.setData({
      dateStr: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
      weekday: `星期${WEEK[now.getDay()]}`,
      total: quotes.quotes.length
    });
    this.showQuote(index);
    this.setData({ five: this.dailyFive(dayOfYear, quotes.quotes[index].id) });
  },

  onShow() {
    // 返回本页时刷新收藏状态（主卡 + 今日精选）
    this.favs = wx.getStorageSync('favorites') || [];
    if (this.data.quote) {
      this.setData({
        isFav: this.favs.indexOf(this.data.quote.id) > -1,
        five: this.data.five.map(q => ({ ...q, isFav: this.favs.indexOf(q.id) > -1 }))
      });
    }
  },

  showQuote(index) {
    const q = quotes.quotes[index];
    this.setData({
      quote: q,
      catInfo: quotes.catMap[q.cat],
      isFav: this.favs.indexOf(q.id) > -1,
      seq: index + 1
    });
  },

  // 今日精选：以日期为种子的确定性伪随机，同一天结果固定
  dailyFive(seed, excludeId) {
    // LCG 伪随机数
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
    // Fisher-Yates 洗牌
    const arr = quotes.quotes.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr
      .filter(q => q.id !== excludeId)
      .slice(0, 5)
      .map(q => ({
        ...q,
        catInfo: quotes.catMap[q.cat],
        isFav: this.favs.indexOf(q.id) > -1
      }));
  },

  // 换一句（随机且不与当前重复）
  nextQuote() {
    const cur = this.data.quote;
    let idx;
    do {
      idx = Math.floor(Math.random() * quotes.quotes.length);
    } while (quotes.quotes.length > 1 && quotes.quotes[idx].id === cur.id);
    this.showQuote(idx);
  },

  toggleFav() {
    const id = this.data.quote.id;
    const pos = this.favs.indexOf(id);
    if (pos > -1) {
      this.favs.splice(pos, 1);
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      this.favs.push(id);
      wx.showToast({ title: '已收藏', icon: 'success' });
    }
    wx.setStorageSync('favorites', this.favs);
    this.setData({ isFav: pos === -1 });
  },

  // 今日精选：切换收藏
  toggleFavFive(e) {
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
      five: this.data.five.map(q => ({ ...q, isFav: this.favs.indexOf(q.id) > -1 }))
    });
  },

  // 今日精选：复制
  copyFive(e) {
    const q = this.data.five.find(x => x.id === e.currentTarget.dataset.id);
    if (q) {
      wx.setClipboardData({ data: `「${q.text}」\n—— ${q.src}` });
    }
  },

  copyQuote() {
    const q = this.data.quote;
    wx.setClipboardData({
      data: `「${q.text}」\n—— ${q.src}`
    });
  },

  openShareCard() {
    this.setData({ shareQuote: this.data.quote, shareShow: true });
  },

  // 今日精选：生成分享卡片
  openShareCardFive(e) {
    const q = this.data.five.find(x => x.id === e.currentTarget.dataset.id);
    if (q) this.setData({ shareQuote: q, shareShow: true });
  },

  onShareClose() {
    this.setData({ shareShow: false });
  },

  goCategory() {
    wx.switchTab({ url: '/pages/category/category' });
  },

  onShareAppMessage() {
    const q = this.data.quote;
    return {
      title: `「${q.text.slice(0, 30)}${q.text.length > 30 ? '…' : ''}」`,
      path: '/pages/index/index'
    };
  }
});
