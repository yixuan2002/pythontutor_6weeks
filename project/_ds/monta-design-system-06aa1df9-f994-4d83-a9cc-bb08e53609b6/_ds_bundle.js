/* @ds-bundle: {"format":3,"namespace":"MONTADesignSystem_06aa1d","components":[],"sourceHashes":{"logos/logo.js":"13f115b9fa82","logos/snake.js":"0ef49e86714e","ui_kits/website/data.jsx":"3d9411b360de","ui_kits/website/icons.jsx":"6f8f91c3ce1d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MONTADesignSystem_06aa1d = window.MONTADesignSystem_06aa1d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// logos/logo.js
try { (() => {
/* ============================================================
   Python 入門課程 — official logo lockup (direction "B").
   Pixel wordmark + 拍拍 orange wave underline.
   Requires snake.js (buildSnake) loaded first.

   buildLogo(mountEl, {
     scale = 1,          // overall size multiplier
     theme = 'light',    // 'light' | 'dark'
     ink,                // text color override
     snake = { body:'#ff9d3d', edge:'#e07c12', head:'#ffe06a', headEdge:'#ecc23a' },
     tongue = true,
     segments = 6
   })
   ============================================================ */
(function (global) {
  function el(tag, style, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    return e;
  }
  function buildLogo(mount, opts) {
    const o = Object.assign({
      scale: 1,
      theme: 'light',
      tongue: true,
      segments: 6,
      snake: {
        body: '#ff9d3d',
        edge: '#e07c12',
        head: '#ffe06a',
        headEdge: '#ecc23a'
      }
    }, opts || {});
    const s = o.scale;
    const ink = o.ink || (o.theme === 'dark' ? '#f4f0dd' : '#2c3a1b');
    const wrap = el('div', {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10 * s + 'px',
      position: 'relative',
      lineHeight: '1'
    }, 'paipai-logo');
    const row = el('div', {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 14 * s + 'px',
      whiteSpace: 'nowrap'
    });
    const py = el('span', {
      fontFamily: "'Pixelify Sans','Cubic 11',system-ui,sans-serif",
      fontWeight: '700',
      fontSize: 58 * s + 'px',
      color: ink,
      letterSpacing: '.01em'
    });
    py.textContent = 'Python';
    const cjk = el('span', {
      fontFamily: "'Cubic 11','Pixelify Sans',system-ui,sans-serif",
      fontSize: 40 * s + 'px',
      color: ink
    });
    cjk.textContent = '入門課程';
    row.appendChild(py);
    row.appendChild(cjk);
    wrap.appendChild(row);

    // snake underline
    const seg = Math.round(18 * s),
      gap = Math.round(3 * s);
    const snakeEl = buildSnake(null, {
      count: o.segments,
      seg: seg,
      gap: gap,
      radius: Math.round(5 * s),
      path: 'wave',
      amp: Math.round(6 * s),
      cycles: 1.2,
      dir: 1,
      tongue: o.tongue,
      ...o.snake
    });
    const line = el('div', {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 2 * s + 'px',
      height: seg + 16 * s + 'px',
      alignItems: 'center'
    });
    line.appendChild(snakeEl);
    wrap.appendChild(line);
    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(wrap);
    }
    return wrap;
  }
  global.buildLogo = buildLogo;
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "logos/logo.js", error: String((e && e.message) || e) }); }

// logos/snake.js
try { (() => {
/* ============================================================
   拍拍 (Pai-Pai) — the snake mascot, as flexible pixel art.
   Builds a snake from rounded-square segments along a path so it
   can be recolored / reshaped around a logo lockup.

   Usage:
     buildSnake(mountEl, {
       count, seg, gap, radius, body, edge, head, headEdge,
       path: 'line'|'arc'|'wave'|'corner'|'ring'|'vertical',
       amp, dir, eyes, tongue
     });
   Palette defaults match the reference: body #90d24a / head #ecd84e.
   ============================================================ */
(function (global) {
  function el(tag, style) {
    const e = document.createElement(tag);
    if (style) Object.assign(e.style, style);
    return e;
  }

  // returns {x,y,rot} positions for `count` segments along a path
  function pathPoints(o) {
    const n = o.count,
      step = o.seg + o.gap,
      pts = [];
    if (o.path === 'vertical') {
      for (let i = 0; i < n; i++) pts.push({
        x: 0,
        y: i * step,
        rot: 0
      });
    } else if (o.path === 'arc') {
      const span = (n - 1) * step,
        amp = o.amp ?? 26;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1);
        const x = t * span;
        const y = -Math.sin(t * Math.PI) * amp;
        const rot = -Math.cos(t * Math.PI) * 16;
        pts.push({
          x,
          y,
          rot
        });
      }
    } else if (o.path === 'wave') {
      const span = (n - 1) * step,
        amp = o.amp ?? 12,
        cyc = o.cycles ?? 1.5;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1);
        const x = t * span;
        const y = Math.sin(t * Math.PI * 2 * cyc) * amp;
        const rot = Math.cos(t * Math.PI * 2 * cyc) * 14;
        pts.push({
          x,
          y,
          rot
        });
      }
    } else if (o.path === 'corner') {
      const half = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        if (i < half) pts.push({
          x: i * step,
          y: 0,
          rot: 0
        });else pts.push({
          x: (half - 1) * step,
          y: (i - half + 1) * step,
          rot: 0
        });
      }
    } else if (o.path === 'ring') {
      // distribute around a rounded rectangle of w x h
      const w = o.ringW ?? 320,
        h = o.ringH ?? 120;
      const perim = 2 * (w + h);
      for (let i = 0; i < n; i++) {
        let d = i / n * perim,
          x,
          y;
        if (d < w) {
          x = d;
          y = 0;
        } else if (d < w + h) {
          x = w;
          y = d - w;
        } else if (d < 2 * w + h) {
          x = w - (d - w - h);
          y = h;
        } else {
          x = 0;
          y = h - (d - 2 * w - h);
        }
        pts.push({
          x,
          y,
          rot: 0
        });
      }
    } else {
      // line
      for (let i = 0; i < n; i++) pts.push({
        x: i * step,
        y: 0,
        rot: 0
      });
    }
    return pts;
  }
  function buildSnake(mount, opts) {
    const o = Object.assign({
      count: 6,
      seg: 20,
      gap: 3,
      radius: 6,
      body: '#90d24a',
      edge: '#6fb02d',
      head: '#ecd84e',
      headEdge: '#d8c12f',
      path: 'line',
      dir: 1,
      eyes: true,
      tongue: false,
      amp: undefined
    }, opts || {});
    const pts = pathPoints(o);
    // bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const wrap = el('div', {
      position: 'relative',
      width: maxX - minX + o.seg + 'px',
      height: maxY - minY + o.seg + 'px',
      pointerEvents: 'none'
    });
    pts.forEach((p, i) => {
      const isHead = o.dir > 0 ? i === pts.length - 1 : i === 0;
      const c = el('div', {
        position: 'absolute',
        left: p.x - minX + 'px',
        top: p.y - minY + 'px',
        width: o.seg + 'px',
        height: o.seg + 'px',
        borderRadius: (isHead ? o.radius + 2 : o.radius) + 'px',
        background: isHead ? o.head : o.body,
        boxShadow: 'inset 0 -2px 0 ' + (isHead ? o.headEdge : o.edge) + ', inset 0 0 0 1px rgba(0,0,0,.06)',
        transform: 'rotate(' + (p.rot || 0) + 'deg)',
        transformOrigin: '50% 50%'
      });
      if (isHead && o.eyes) {
        const mkEye = dx => el('div', {
          position: 'absolute',
          top: '28%',
          left: dx,
          width: '18%',
          height: '24%',
          background: '#2c2a14',
          borderRadius: '1px'
        });
        // eyes face direction of travel
        const facingRight = o.dir > 0;
        c.appendChild(mkEye(facingRight ? '52%' : '24%'));
        c.appendChild(mkEye(facingRight ? '74%' : '46%'));
        if (o.tongue) {
          c.appendChild(el('div', {
            position: 'absolute',
            top: '64%',
            left: facingRight ? '94%' : '-22%',
            width: '26%',
            height: '10%',
            background: '#ff5d73',
            borderRadius: '2px'
          }));
        }
      }
      wrap.appendChild(c);
    });
    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(wrap);
    }
    return wrap;
  }
  global.buildSnake = buildSnake;
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "logos/snake.js", error: String((e && e.message) || e) }); }

// ui_kits/website/data.jsx
try { (() => {
/* MONTA UI kit — product data (toys reuse the 3 real cropped photos) */
const PRODUCTS = [{
  id: 'sprout',
  name: 'Sprout',
  tag: 'The leggy one',
  price: 38,
  img: '../../assets/toy-blue.png',
  bg: 'var(--monta-blue)',
  tilt: -4
}, {
  id: 'tooth',
  name: 'Two-Tooth',
  tag: 'Always grinning',
  price: 42,
  img: '../../assets/toy-pink.png',
  bg: 'var(--monta-pink)',
  tilt: 3
}, {
  id: 'cone',
  name: 'Cone Head',
  tag: 'Pointy & proud',
  price: 42,
  img: '../../assets/toy-yellow.png',
  bg: 'var(--monta-yellow)',
  tilt: 5
}, {
  id: 'pip',
  name: 'Pip',
  tag: 'Tiny troublemaker',
  price: 34,
  img: '../../assets/toy-blue.png',
  bg: 'var(--monta-yellow)',
  tilt: -3
}, {
  id: 'bubs',
  name: 'Bubs',
  tag: 'Soft & lumpy',
  price: 40,
  img: '../../assets/toy-pink.png',
  bg: 'var(--monta-blue)',
  tilt: 4
}, {
  id: 'horn',
  name: 'Hornlet',
  tag: 'One green dot',
  price: 44,
  img: '../../assets/toy-yellow.png',
  bg: 'var(--monta-pink)',
  tilt: -5
}];
window.PRODUCTS = PRODUCTS;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* MONTA UI kit — icons
   Functional icons are rounded, 2.2px stroke (Lucide-style substitute).
   Brand decorations (Sparkle, Rays) are the brand's own drawn marks. */

const Ic = ({
  d,
  size = 22,
  stroke = 'currentColor',
  fill = 'none',
  sw = 2.2
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: stroke,
  strokeWidth: sw,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, d);
const IconCart = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "20",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "20",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 3h2.2l2 12.5a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L20 7H5.5"
  }))
}));
const IconPlus = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  }))
}));
const IconMinus = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }))
}));
const IconX = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6l-12 12"
  }))
}));
const IconArrow = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  }))
}));
const IconHeart = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.6 12 20 12 20z"
  }))
}));
const IconMenu = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16M4 12h16M4 17h16"
  }))
}));
const IconCheck = p => /*#__PURE__*/React.createElement(Ic, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7"
  }))
}));

/* Brand decorations */
const Sparkle = ({
  size = 40,
  color = 'var(--monta-orange)',
  style
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 100 100",
  style: style
}, /*#__PURE__*/React.createElement("path", {
  d: "M50 4 C53 36, 64 47, 96 50 C64 53, 53 64, 50 96 C47 64, 36 53, 4 50 C36 47, 47 36, 50 4 Z",
  fill: color
}));
const Rays = ({
  size = 80,
  color = 'var(--monta-orange-soft)',
  style
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 100 100",
  style: style,
  stroke: color,
  strokeWidth: "6",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("line", {
  x1: "50",
  y1: "8",
  x2: "50",
  y2: "30"
}), /*#__PURE__*/React.createElement("line", {
  x1: "80",
  y1: "20",
  x2: "66",
  y2: "38"
}), /*#__PURE__*/React.createElement("line", {
  x1: "20",
  y1: "20",
  x2: "34",
  y2: "38"
}), /*#__PURE__*/React.createElement("line", {
  x1: "88",
  y1: "52",
  x2: "66",
  y2: "52"
}), /*#__PURE__*/React.createElement("line", {
  x1: "12",
  y1: "52",
  x2: "34",
  y2: "52"
}));
Object.assign(window, {
  IconCart,
  IconPlus,
  IconMinus,
  IconX,
  IconArrow,
  IconHeart,
  IconMenu,
  IconCheck,
  Sparkle,
  Rays
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/icons.jsx", error: String((e && e.message) || e) }); }

})();
