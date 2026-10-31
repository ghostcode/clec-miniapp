const catMap = require('../../utils/quotes').catMap;

// 卡片配色主题（循环切换）
const THEMES = [
  { name: '宣纸', bg: '#f7f2e7', text: '#3a3630', sub: '#9c9484', mark: 'rgba(176,141,70,0.32)', border: 'rgba(176,141,70,0.45)' },
  { name: '青瓷', bg: '#e9f1ec', text: '#2f4038', sub: '#7f958a', mark: 'rgba(74,111,90,0.28)', border: 'rgba(74,111,90,0.40)' },
  { name: '暖阳', bg: '#faf0e2', text: '#4a3a2c', sub: '#a08a6e', mark: 'rgba(192,116,60,0.28)', border: 'rgba(192,116,60,0.40)' },
  { name: '墨韵', bg: '#2f4a3d', text: '#f3eede', sub: '#b9c6bd', mark: 'rgba(243,238,222,0.22)', border: 'rgba(243,238,222,0.30)' }
];

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(nv) {
        if (nv) {
          // 等 canvas 节点渲染完成后再绘制
          setTimeout(() => this.draw(), 120);
        }
      }
    },
    quote: { type: Object, value: null }
  },

  data: {
    tempPath: '',
    drawing: true,
    themeIndex: 0
  },

  methods: {
    noop() {},

    onClose() {
      this.triggerEvent('close');
    },

    // ---------- 绘制 ----------
    draw() {
      const q = this.properties.quote;
      if (!q) return;
      this.setData({ drawing: true });
      const query = this.createSelectorQuery();
      query.select('#shareCanvas').fields({ node: true, size: true });
      query.exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        let dpr = 2;
        try {
          const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          dpr = info.pixelRatio || 2;
        } catch (e) { /* 使用默认 */ }

        // 设计稿 750 x 1200，按实际渲染尺寸缩放
        const cssW = res[0].width;
        const cssH = res[0].height;
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        const scale = (cssW * dpr) / 750;
        ctx.scale(scale, scale);
        this.drawCard(ctx, q);
        wx.canvasToTempFilePath({
          canvas,
          fileType: 'png',
          quality: 1,
          success: (r) => this.setData({ tempPath: r.tempFilePath, drawing: false }),
          fail: () => this.setData({ drawing: false })
        });
      });
    },

    drawCard(ctx, q) {
      const T = THEMES[this.data.themeIndex];
      const catColor = (catMap[q.cat] && catMap[q.cat].color) || '#2f4a3d';

      // 背景
      ctx.fillStyle = T.bg;
      ctx.fillRect(0, 0, 750, 1200);

      // 内边框
      this.roundRect(ctx, 26, 26, 698, 1148, 14);
      ctx.strokeStyle = T.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 顶部标题
      ctx.textAlign = 'center';
      ctx.fillStyle = T.sub;
      ctx.font = '26px sans-serif';
      ctx.fillText('C  L  E  C   ·   语  录', 375, 104);

      // 分类徽章（胶囊）
      ctx.font = '26px sans-serif';
      const catText = q.cat;
      const badgeW = ctx.measureText(catText).width + 64;
      const badgeY = 150;
      this.roundRect(ctx, 375 - badgeW / 2, badgeY, badgeW, 52, 26);
      ctx.fillStyle = catColor;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(catText, 375, badgeY + 35);

      // 正文（字号自适应，避免溢出）
      let fontSize = 44;
      let lineH = 84;
      let lines = [];
      for (; fontSize >= 34; fontSize -= 5, lineH -= 8) {
        ctx.font = this.kaiFont(fontSize);
        lines = this.wrapText(ctx, q.text, 556);
        if (lines.length <= 7) break;
      }
      const blockH = lines.length * lineH + 70; // 含来源行
      let textTop = 640 - blockH / 2;
      if (textTop < 400) textTop = 400;

      // 装饰引号
      ctx.textAlign = 'left';
      ctx.font = '170px Georgia, serif';
      ctx.fillStyle = T.mark;
      ctx.fillText('\u201C', 78, textTop - 18);

      // 语录正文
      ctx.fillStyle = T.text;
      ctx.font = this.kaiFont(fontSize);
      lines.forEach((ln, i) => {
        ctx.fillText(ln, 97, textTop + i * lineH);
      });

      // 来源
      ctx.textAlign = 'center';
      ctx.font = '27px sans-serif';
      ctx.fillStyle = T.sub;
      ctx.fillText('—— ' + q.src, 375, textTop + lines.length * lineH + 46);

      // 底部信息
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} 星期${WEEK[now.getDay()]}`;
      ctx.strokeStyle = T.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(120, 1086);
      ctx.lineTo(630, 1086);
      ctx.stroke();
      ctx.font = '24px sans-serif';
      ctx.fillStyle = T.sub;
      ctx.fillText(dateStr, 375, 1124);
      ctx.font = '23px sans-serif';
      ctx.fillText('富有是天赋 · 快乐是人权', 375, 1160);
    },

    kaiFont(size) {
      return `${size}px "Kaiti SC", "KaiTi", "STKaiti", "BiauKai", serif`;
    },

    // 逐字测量自动换行
    wrapText(ctx, text, maxW) {
      const lines = [];
      let line = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (line && ctx.measureText(line + ch).width > maxW) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
      if (line) lines.push(line);
      return lines;
    },

    // 圆角矩形路径
    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    // ---------- 交互 ----------
    changeTheme() {
      this.setData({ themeIndex: (this.data.themeIndex + 1) % THEMES.length });
      this.draw();
    },

    save() {
      if (!this.data.tempPath) return;
      const doSave = () => {
        wx.saveImageToPhotosAlbum({
          filePath: this.data.tempPath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
        });
      };
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许「保存到相册」，以便保存语录卡片',
              confirmText: '去设置',
              success: (r) => r.confirm && wx.openSetting()
            });
          } else {
            doSave();
          }
        }
      });
    },

    share() {
      if (!this.data.tempPath) return;
      wx.showShareImageMenu({
        path: this.data.tempPath,
        fail: () => {
          // 低版本基础库不支持图片分享时，引导保存后手动分享
          wx.showToast({ title: '当前版本不支持，请保存图片后分享', icon: 'none' });
        }
      });
    }
  }
});
