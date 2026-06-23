/* Interactive teaching widgets — ported from the Python tutor trial,
   restyled with inline styles so they mount inside a Design Component.
   Exports (via window): PyRunner, QuizQuestion, SnakeGame, CodeBlock, CodeOut. */

/* ============================================================
   MONTA tokens (inline, since DC has no stylesheet)
   ============================================================ */
const M = {
  orange: '#ff8a1e', orangeDeep: '#ec7a00', orangeSoft: '#ffb46b',
  green: '#4d8e02', greenDeep: '#3c7300', greenSoft: '#cfe6a8',
  blue: '#8fc0f5', pink: '#fe9cdc', yellow: '#f7da5a',
  paper: '#fffbef', paper2: '#fdf4dc', paper3: '#f6ecd2',
  line: '#e7dcc0', lineSoft: '#efe6cf',
  ink: '#2c3a1b', ink2: '#546a27', ink3: '#8a9472', onColor: '#fffdf3',
  fontUI: "'DM Sans','Noto Sans TC',system-ui,sans-serif",
  fontDisplay: "'Pixelify Sans','Cubic 11',system-ui,sans-serif",
  mono: "'SF Mono','JetBrains Mono',ui-monospace,monospace",
};

/* ============================================================
   Syntax highlighter (display only)
   ============================================================ */
const COL = { kw: '#ff9d4d', str: '#c4e07a', num: '#8fc0f5', fn: '#f7da5a',
  com: '#7d8c63', bool: '#fe9cdc', op: '#cdbf99', def: '#e9e4d0' };
const KW = new Set(['def','if','elif','else','while','for','in','return','import','from','as','and','or','not','break','continue','pass','with','try','except','is']);
const BOOL = new Set(['True','False','None']);
const BUILTIN = new Set(['print','input','int','float','str','len','type','range','bool','list','append','format','abs','round']);

function highlightLine(line, key) {
  const re = /(#.*$)|(f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')|(\d+\.?\d*)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z0-9_])/g;
  const out = []; let m, i = 0;
  while ((m = re.exec(line))) {
    let cls = 'def', text = m[0];
    if (m[1]) cls = 'com';
    else if (m[2]) cls = 'str';
    else if (m[3]) cls = 'num';
    else if (m[4]) {
      const w = m[4];
      if (KW.has(w)) cls = 'kw';
      else if (BOOL.has(w)) cls = 'bool';
      else if (BUILTIN.has(w)) cls = 'fn';
      else cls = 'def';
    } else if (m[5]) cls = 'ws';
    else if (m[6]) cls = 'op';
    const style = { color: COL[cls] || COL.def };
    if (cls === 'com') style.fontStyle = 'italic';
    if (cls === 'kw' || cls === 'bool') style.fontWeight = 600;
    out.push(React.createElement('span', { key: i++, style }, text));
  }
  return React.createElement('span', { key }, out.length ? out : '\u00a0');
}

function highlight(code) {
  const lines = String(code).split('\n');
  const nodes = [];
  lines.forEach((ln, i) => {
    nodes.push(highlightLine(ln, 'l' + i));
    if (i < lines.length - 1) nodes.push('\n');
  });
  return nodes;
}

/* ============================================================
   CodeBlock — read-only highlighted code with a window bar
   ============================================================ */
function CodeBlock({ code, file = 'main.py' }) {
  return (
    <div style={{ background: '#25301a', borderRadius: 20, boxShadow: '0 14px 30px rgba(74,90,20,0.18)', overflow: 'hidden', margin: '0 0 8px', border: '1.5px solid #1c2613' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', background: '#1f2915', borderBottom: '1px solid #2f3d20' }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff8a1e' }}></span>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f7da5a' }}></span>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#8fd14b' }}></span>
        <span style={{ marginLeft: 8, fontFamily: M.mono, fontSize: 12.5, color: '#9db380' }}>{file}</span>
      </div>
      <pre style={{ margin: 0, padding: '18px 20px', fontFamily: M.mono, fontSize: 14.5, lineHeight: 1.75, color: '#e9e4d0', overflowX: 'auto', tabSize: 4 }}><code>{highlight(code)}</code></pre>
    </div>
  );
}

/* ============================================================
   CodeOut — expected-output well
   ============================================================ */
function CodeOut({ children, label = '執行結果' }) {
  return (
    <div style={{ background: M.paper3, border: `1.5px dashed ${M.line}`, borderRadius: 20, padding: '14px 18px', marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: M.ink3, marginBottom: 8 }}>{label}</div>
      <pre style={{ margin: 0, fontFamily: M.mono, fontSize: 14, lineHeight: 1.7, color: M.ink, whiteSpace: 'pre-wrap' }}>{children}</pre>
    </div>
  );
}

/* ============================================================
   Mini Python interpreter (teaching subset)
   ============================================================ */
function pyRepr(v) { if (typeof v === 'string') return "'" + v + "'"; return pyStr(v); }
function pyStr(v) {
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (v === null || v === undefined) return 'None';
  if (Array.isArray(v)) return '[' + v.map(pyRepr).join(', ') + ']';
  if (v && v.__dict__) return '{' + [...v.__dict__].map(([k, val]) => pyRepr(k) + ': ' + pyRepr(val)).join(', ') + '}';
  return String(v);
}
function toNum(v) { const n = Number(v); if (Number.isNaN(n)) throw new Error('沒辦法把「' + v + '」當成數字來算'); return n; }
function truthy(v) { return !(v === false || v === 0 || v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))); }
function cmpEq(l, r) {
  if (typeof l === 'number' && typeof r === 'number') return l === r;
  if (Array.isArray(l) && Array.isArray(r)) { if (l.length !== r.length) return false; for (let i = 0; i < l.length; i++) if (!cmpEq(l[i], r[i])) return false; return true; }
  if (l && l.__dict__ && r && r.__dict__) { if (l.__dict__.size !== r.__dict__.size) return false; for (const [k, v] of l.__dict__) { if (!r.__dict__.has(k) || !cmpEq(v, r.__dict__.get(k))) return false; } return true; }
  if (typeof l !== typeof r) return false;
  return l === r;
}
function pyIn(x, container) {
  if (Array.isArray(container)) return container.some((el) => cmpEq(el, x));
  if (typeof container === 'string') return container.indexOf(String(x)) !== -1;
  if (container && container.__dict__) { for (const k of container.__dict__.keys()) if (cmpEq(k, x)) return true; return false; }
  return false;
}

function stripComment(s) {
  let inStr = null, out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { out += c; if (c === inStr && s[i - 1] !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; out += c; continue; }
    if (c === '#') break;
    out += c;
  }
  return out;
}
function tokenize(s) {
  const toks = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if ((c === 'f' || c === 'F') && (s[i + 1] === '"' || s[i + 1] === "'")) {
      const q = s[i + 1]; let j = i + 2, str = '';
      while (j < s.length && s[j] !== q) { str += s[j]; j++; }
      toks.push({ t: 'fstr', v: str }); i = j + 1; continue;
    }
    if (c === '"' || c === "'") {
      const q = c; let j = i + 1, str = '';
      while (j < s.length && s[j] !== q) { str += s[j]; j++; }
      toks.push({ t: 'str', v: str }); i = j + 1; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1]))) {
      let j = i, num = '';
      while (j < s.length && /[0-9.]/.test(s[j])) { num += s[j]; j++; }
      toks.push({ t: 'num', v: num }); i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i, id = '';
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) { id += s[j]; j++; }
      toks.push({ t: 'name', v: id }); i = j; continue;
    }
    if (s[i] === '*' && s[i + 1] === '*') { toks.push({ t: 'op', v: '**' }); i += 2; continue; }
    if (s[i] === '/' && s[i + 1] === '/') { toks.push({ t: 'op', v: '//' }); i += 2; continue; }
    if (s[i] === '=' && s[i + 1] === '=') { toks.push({ t: 'op', v: '==' }); i += 2; continue; }
    if (s[i] === '!' && s[i + 1] === '=') { toks.push({ t: 'op', v: '!=' }); i += 2; continue; }
    if (s[i] === '>' && s[i + 1] === '=') { toks.push({ t: 'op', v: '>=' }); i += 2; continue; }
    if (s[i] === '<' && s[i + 1] === '=') { toks.push({ t: 'op', v: '<=' }); i += 2; continue; }
    if (c === '>' || c === '<') { toks.push({ t: 'op', v: c }); i++; continue; }
    if ('+-*/%(),:[].{}'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    i++;
  }
  return toks;
}
function parseTokens(toks) {
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  function parseExpr() { return parseOr(); }
  function parseOr() {
    let left = parseAnd();
    while (peek() && peek().t === 'name' && peek().v === 'or') { next(); left = { type: 'logic', op: 'or', left, right: parseAnd() }; }
    return left;
  }
  function parseAnd() {
    let left = parseNot();
    while (peek() && peek().t === 'name' && peek().v === 'and') { next(); left = { type: 'logic', op: 'and', left, right: parseNot() }; }
    return left;
  }
  function parseNot() {
    if (peek() && peek().t === 'name' && peek().v === 'not') { next(); return { type: 'not', val: parseNot() }; }
    return parseCompare();
  }
  function parseCompare() {
    let left = parseAdd();
    while (peek() && ((peek().t === 'op' && ['==', '!=', '>', '<', '>=', '<='].includes(peek().v)) || (peek().t === 'name' && (peek().v === 'in' || peek().v === 'not')))) {
      if (peek().t === 'name' && peek().v === 'not') {
        // "not in"
        next(); if (peek() && peek().v === 'in') next();
        left = { type: 'cmp', op: 'not in', left, right: parseAdd() };
      } else if (peek().t === 'name' && peek().v === 'in') {
        next(); left = { type: 'cmp', op: 'in', left, right: parseAdd() };
      } else {
        const op = next().v; left = { type: 'cmp', op, left, right: parseAdd() };
      }
    }
    return left;
  }
  function parseAdd() {
    let left = parseMul();
    while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = next().v; left = { type: 'bin', op, left, right: parseMul() };
    }
    return left;
  }
  function parseMul() {
    let left = parsePow();
    while (peek() && peek().t === 'op' && ['*', '/', '%', '//'].includes(peek().v)) {
      const op = next().v; left = { type: 'bin', op, left, right: parsePow() };
    }
    return left;
  }
  function parsePow() {
    let left = parseUnary();
    if (peek() && peek().t === 'op' && peek().v === '**') { next(); return { type: 'bin', op: '**', left, right: parsePow() }; }
    return left;
  }
  function parseUnary() {
    if (peek() && peek().t === 'op' && peek().v === '-') { next(); return { type: 'neg', val: parseUnary() }; }
    return parsePostfix();
  }
  function parsePostfix() {
    let node = parsePrimary();
    while (peek() && peek().t === 'op' && (peek().v === '[' || peek().v === '.')) {
      if (peek().v === '[') {
        next();
        let start = null, stop = null, isSlice = false;
        if (!(peek() && (peek().v === ':' || peek().v === ']'))) start = parseExpr();
        if (peek() && peek().v === ':') { isSlice = true; next(); if (peek() && peek().v !== ']') stop = parseExpr(); }
        if (peek() && peek().v === ']') next();
        node = isSlice ? { type: 'slice', obj: node, start, stop } : { type: 'index', obj: node, index: start };
      } else {
        next();
        const attr = next().v;
        if (peek() && peek().t === 'op' && peek().v === '(') {
          next(); const args = [];
          if (!(peek() && peek().v === ')')) { args.push(parseExpr()); while (peek() && peek().v === ',') { next(); args.push(parseExpr()); } }
          if (peek() && peek().v === ')') next();
          node = { type: 'method', obj: node, name: attr, args };
        } else node = { type: 'attr', obj: node, name: attr };
      }
    }
    return node;
  }
  function parsePrimary() {
    const tk = peek();
    if (!tk) return { type: 'lit', val: '' };
    if (tk.t === 'op' && tk.v === '[') {
      next(); const items = [];
      if (!(peek() && peek().v === ']')) {
        items.push(parseExpr());
        while (peek() && peek().v === ',') { next(); if (peek() && peek().v === ']') break; items.push(parseExpr()); }
      }
      if (peek() && peek().v === ']') next();
      return { type: 'list', items };
    }
    if (tk.t === 'op' && tk.v === '{') {
      next(); const pairs = [];
      if (!(peek() && peek().v === '}')) {
        do {
          if (peek() && peek().v === '}') break;
          const k = parseExpr();
          if (peek() && peek().v === ':') next();
          const v = parseExpr();
          pairs.push([k, v]);
        } while (peek() && peek().v === ',' && (next(), true));
      }
      if (peek() && peek().v === '}') next();
      return { type: 'dict', pairs };
    }
    if (tk.t === 'num') { next(); return { type: 'lit', val: tk.v.includes('.') ? parseFloat(tk.v) : parseInt(tk.v, 10) }; }
    if (tk.t === 'str') { next(); return { type: 'lit', val: tk.v }; }
    if (tk.t === 'fstr') { next(); return { type: 'fstr', val: tk.v }; }
    if (tk.t === 'op' && tk.v === '(') { next(); const e = parseExpr(); if (peek() && peek().v === ')') next(); return e; }
    if (tk.t === 'name') {
      if (tk.v === 'True') { next(); return { type: 'lit', val: true }; }
      if (tk.v === 'False') { next(); return { type: 'lit', val: false }; }
      if (tk.v === 'None') { next(); return { type: 'lit', val: null }; }
      const nm = next().v;
      if (peek() && peek().t === 'op' && peek().v === '(') {
        next(); const args = [];
        if (!(peek() && peek().v === ')')) {
          args.push(parseExpr());
          while (peek() && peek().v === ',') { next(); args.push(parseExpr()); }
        }
        if (peek() && peek().v === ')') next();
        return { type: 'call', name: nm, args };
      }
      return { type: 'var', name: nm };
    }
    next(); return { type: 'lit', val: '' };
  }
  return parseExpr();
}
function parseExprStr(s) { return parseTokens(tokenize(s)); }

/* format spec support inside f-string: {expr:spec} — supports .Nf, <N, >N */
function applyFormat(val, spec) {
  if (!spec) return pyStr(val);
  let m = spec.match(/^\.(\d+)f$/);
  if (m) return Number(val).toFixed(parseInt(m[1], 10));
  m = spec.match(/^([<>])(\d+)$/);
  if (m) {
    const s = pyStr(val), w = parseInt(m[2], 10);
    if (s.length >= w) return s;
    const pad = ' '.repeat(w - s.length);
    return m[1] === '<' ? s + pad : pad + s;
  }
  m = spec.match(/^(\d+)$/);
  if (m) {
    const s = pyStr(val), w = parseInt(m[1], 10);
    if (s.length >= w) return s;
    const pad = ' '.repeat(w - s.length);
    return typeof val === 'number' ? pad + s : s + pad;
  }
  return pyStr(val);
}

function runPython(code, inputFn) {
  const globals = {};
  let scope = globals;
  let globalDecls = new Set();
  let callDepth = 0;
  const out = [];
  const BREAK = { __break__: true }, CONTINUE = { __continue__: true };
  let loopGuard = 0;
  function evalFString(t) {
    let res = '', i = 0;
    while (i < t.length) {
      if (t[i] === '{') {
        if (t[i + 1] === '{') { res += '{'; i += 2; continue; }
        let j = i + 1, depth = 1, ex = '';
        while (j < t.length && depth > 0) {
          if (t[j] === '{') depth++;
          else if (t[j] === '}') { depth--; if (depth === 0) break; }
          ex += t[j]; j++;
        }
        let spec = '';
        const ci = ex.indexOf(':');
        if (ci !== -1) { spec = ex.slice(ci + 1); ex = ex.slice(0, ci); }
        res += applyFormat(evalNode(parseExprStr(ex)), spec); i = j + 1;
      } else if (t[i] === '}') {
        if (t[i + 1] === '}') { res += '}'; i += 2; continue; }
        i++;
      } else { res += t[i]; i++; }
    }
    return res;
  }
  function evalNode(node) {
    switch (node.type) {
      case 'lit': return node.val;
      case 'fstr': return evalFString(node.val);
      case 'var':
        if (node.name in scope) return scope[node.name];
        if (scope !== globals && node.name in globals) return globals[node.name];
        throw new Error('變數「' + node.name + '」還沒定義過喔（NameError）');
      case 'neg': return -toNum(evalNode(node.val));
      case 'bin': {
        const l = evalNode(node.left), r = evalNode(node.right);
        if (node.op === '+') {
          const ls = typeof l === 'string', rs = typeof r === 'string';
          if (ls && rs) return l + r;
          if (ls || rs) throw new Error('不能把文字和數字直接用 + 相加（TypeError）—— 想接成文字要先用 str()，想做數學要先用 int()');
          return l + r;
        }
        if (node.op === '-') return toNum(l) - toNum(r);
        if (node.op === '*') {
          if (typeof l === 'string') return l.repeat(toNum(r));
          if (typeof r === 'string') return r.repeat(toNum(l));
          return l * r;
        }
        if (node.op === '/') return toNum(l) / toNum(r);
        if (node.op === '//') return Math.floor(toNum(l) / toNum(r));
        if (node.op === '%') return toNum(l) % toNum(r);
        if (node.op === '**') return Math.pow(toNum(l), toNum(r));
        return 0;
      }
      case 'cmp': {
        const l = evalNode(node.left), r = evalNode(node.right);
        if (node.op === 'in') return pyIn(l, r);
        if (node.op === 'not in') return !pyIn(l, r);
        if (node.op === '==') return cmpEq(l, r);
        if (node.op === '!=') return !cmpEq(l, r);
        let a, b;
        if (typeof l === 'string' && typeof r === 'string') { a = l; b = r; }
        else { a = toNum(l); b = toNum(r); }
        if (node.op === '>') return a > b;
        if (node.op === '<') return a < b;
        if (node.op === '>=') return a >= b;
        if (node.op === '<=') return a <= b;
        return false;
      }
      case 'logic': {
        const l = evalNode(node.left);
        if (node.op === 'and') return truthy(l) ? evalNode(node.right) : l;
        return truthy(l) ? l : evalNode(node.right);
      }
      case 'not': return !truthy(evalNode(node.val));
      case 'list': return node.items.map(evalNode);
      case 'dict': {
        const map = new Map();
        for (const [k, v] of node.pairs) map.set(evalNode(k), evalNode(v));
        return { __dict__: map };
      }
      case 'index': {
        const obj = evalNode(node.obj);
        if (obj && obj.__dict__) {
          const key = evalNode(node.index);
          if (!obj.__dict__.has(key)) throw new Error('字典裡找不到這個 key：' + pyRepr(key) + '（KeyError）');
          return obj.__dict__.get(key);
        }
        let idx = toNum(evalNode(node.index));
        if (Array.isArray(obj) || typeof obj === 'string') {
          if (idx < 0) idx += obj.length;
          if (idx < 0 || idx >= obj.length) throw new Error('索引超出範圍了（IndexError）');
          return obj[idx];
        }
        throw new Error('這個值沒辦法用 [ ] 取裡面的東西');
      }
      case 'slice': {
        const obj = evalNode(node.obj);
        let s = node.start != null ? toNum(evalNode(node.start)) : 0;
        let e = node.stop != null ? toNum(evalNode(node.stop)) : obj.length;
        if (s < 0) s += obj.length; if (e < 0) e += obj.length;
        const sl = obj.slice(s, e);
        return typeof obj === 'string' ? sl : sl.slice();
      }
      case 'attr': {
        const obj = evalNode(node.obj);
        if (obj && obj.__module__) return { __module__: obj.__module__, __attr__: node.name };
        throw new Error('還不認識屬性「.' + node.name + '」');
      }
      case 'method': {
        const obj = evalNode(node.obj);
        const args = node.args.map(evalNode);
        if (obj && obj.__module__ === 'random') {
          if (node.name === 'randint') { const lo = Math.ceil(toNum(args[0])), hi = Math.floor(toNum(args[1])); return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
          if (node.name === 'choice') { const c = args[0]; return c[Math.floor(Math.random() * c.length)]; }
          if (node.name === 'random') return Math.random();
        }
        if (obj && obj.__module__ === 'time') { if (node.name === 'sleep') return null; }
        if (Array.isArray(obj)) {
          if (node.name === 'append') { obj.push(args[0]); return null; }
          if (node.name === 'pop') { return args.length ? obj.splice(toNum(args[0]), 1)[0] : obj.pop(); }
          if (node.name === 'insert') { obj.splice(toNum(args[0]), 0, args[1]); return null; }
          if (node.name === 'remove') { const idx = obj.findIndex((el) => cmpEq(el, args[0])); if (idx === -1) throw new Error('list.remove(x)：清單裡沒有 ' + pyRepr(args[0])); obj.splice(idx, 1); return null; }
          if (node.name === 'copy') return obj.slice();
          if (node.name === 'count') return obj.filter((el) => cmpEq(el, args[0])).length;
          if (node.name === 'index') { const idx = obj.findIndex((el) => cmpEq(el, args[0])); if (idx === -1) throw new Error('找不到 ' + pyRepr(args[0])); return idx; }
          if (node.name === 'sort') { obj.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)); return null; }
          if (node.name === 'reverse') { obj.reverse(); return null; }
        }
        if (obj && obj.__dict__) {
          const d = obj.__dict__;
          if (node.name === 'get') { for (const [k, v] of d) if (cmpEq(k, args[0])) return v; return args.length > 1 ? args[1] : null; }
          if (node.name === 'keys') return [...d.keys()];
          if (node.name === 'values') return [...d.values()];
          if (node.name === 'items') return [...d].map(([k, v]) => [k, v]);
          if (node.name === 'pop') { for (const k of d.keys()) if (cmpEq(k, args[0])) { const v = d.get(k); d.delete(k); return v; } return args.length > 1 ? args[1] : null; }
        }
        if (typeof obj === 'string') {
          if (node.name === 'upper') return obj.toUpperCase();
          if (node.name === 'lower') return obj.toLowerCase();
          if (node.name === 'strip') return obj.trim();
          if (node.name === 'split') {
            if (args[0] !== undefined && args[0] !== null && args[0] !== '') return obj.split(args[0]);
            return obj.trim().length ? obj.trim().split(/\s+/) : [];
          }
        }
        throw new Error('還不認識「.' + node.name + '()」這個方法');
      }
      case 'call': {
        const a = node.args.map(evalNode);
        const fnVal = (node.name in scope) ? scope[node.name] : globals[node.name];
        if (fnVal && fnVal.__func__) return callUserFunc(fnVal, a);
        if (node.name === 'input') {
          const prompt = a[0] !== undefined ? pyStr(a[0]) : '';
          const raw = inputFn(prompt);
          if (raw === null || raw === undefined) throw { __stopInput__: true };
          const val = String(raw);
          out.push(prompt + val + '\n');
          return val;
        }
        if (node.name === 'int') {
          const n = parseInt(a[0], 10);
          if (Number.isNaN(n)) throw new Error('int() 沒辦法把「' + a[0] + '」變成整數（ValueError）');
          return n;
        }
        if (node.name === 'float') {
          const n = parseFloat(a[0]);
          if (Number.isNaN(n)) throw new Error('float() 轉換失敗（ValueError）');
          return n;
        }
        if (node.name === 'str') return pyStr(a[0]);
        if (node.name === 'len') {
          if (a[0] && a[0].__dict__) return a[0].__dict__.size;
          return Array.isArray(a[0]) ? a[0].length : String(a[0]).length;
        }
        if (node.name === 'enumerate') {
          const seq = Array.isArray(a[0]) ? a[0] : String(a[0]).split('');
          const start = a.length > 1 ? toNum(a[1]) : 0;
          return seq.map((v, idx) => [idx + start, v]);
        }
        if (node.name === 'sorted') { const arr = (a[0] || []).slice(); arr.sort((x, y) => (x > y ? 1 : x < y ? -1 : 0)); return arr; }
        if (node.name === 'max') { const arr = a.length === 1 && Array.isArray(a[0]) ? a[0] : a; return arr.reduce((x, y) => (y > x ? y : x)); }
        if (node.name === 'min') { const arr = a.length === 1 && Array.isArray(a[0]) ? a[0] : a; return arr.reduce((x, y) => (y < x ? y : x)); }
        if (node.name === 'range') {
          let lo = 0, hi, step = 1;
          if (a.length === 1) hi = toNum(a[0]);
          else { lo = toNum(a[0]); hi = toNum(a[1]); if (a.length >= 3) step = toNum(a[2]); }
          if (step === 0) throw new Error('range() 的間隔（step）不能是 0');
          const arr = [];
          if (step > 0) { for (let k = lo; k < hi; k += step) arr.push(k); }
          else { for (let k = lo; k > hi; k += step) arr.push(k); }
          return arr;
        }
        if (node.name === 'abs') return Math.abs(toNum(a[0]));
        if (node.name === 'sum') return (a[0] || []).reduce((x, y) => x + toNum(y), 0);
        if (node.name === 'list') return Array.isArray(a[0]) ? a[0].slice() : String(a[0]).split('');
        if (node.name === 'type') {
          const v = a[0];
          let t = 'str';
          if (typeof v === 'boolean') t = 'bool';
          else if (typeof v === 'number') t = Number.isInteger(v) ? 'int' : 'float';
          return "<class '" + t + "'>";
        }
        throw new Error('還不認識「' + node.name + '()」這個函式');
      }
    }
    return '';
  }
  // ---- preprocess: join line-continuations (trailing \ and open brackets), strip comments, record indent ----
  function leadIndent(s) { let n = 0; for (let k = 0; k < s.length; k++) { const ch = s[k]; if (ch === ' ') n++; else if (ch === '\t') n += 4; else break; } return n; }
  function bracketDelta(s) {
    let d = 0, inStr = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) { if (c === inStr && s[i - 1] !== '\\') inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; continue; }
      if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--;
    }
    return d;
  }
  const rawLines = code.split('\n');
  const logical = [];
  let buf = null, depth = 0;
  for (let li = 0; li < rawLines.length; li++) {
    const codePart = stripComment(rawLines[li]);
    const trimmedRight = codePart.replace(/\s+$/, '');
    const cont = trimmedRight.endsWith('\\');
    const piece = cont ? trimmedRight.slice(0, -1) : codePart;
    if (buf === null) buf = piece;
    else buf += ' ' + piece.replace(/^\s+/, '');
    depth += bracketDelta(piece);
    if (!cont && depth <= 0) { logical.push(buf); buf = null; depth = 0; }
  }
  if (buf !== null) logical.push(buf);
  const stmts = [];
  for (const ln of logical) { if (ln.trim() === '') continue; stmts.push({ indent: leadIndent(ln), text: ln.trim() }); }

  function findTopAssign(s) {
    let depth = 0, inStr = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) { if (c === inStr && s[i - 1] !== '\\') inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; continue; }
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      else if (c === '=' && depth === 0) {
        if (s[i + 1] === '=') { i++; continue; }
        const p = s[i - 1];
        if (p === '!' || p === '<' || p === '>') continue;
        if (p === '+' || p === '-' || p === '*' || p === '/') return { idx: i, op: p, opStart: i - 1 };
        return { idx: i, op: '', opStart: i };
      }
    }
    return null;
  }
  function assignTarget(tgt, val) {
    const node = parseExprStr(tgt);
    if (node.type === 'var') { (globalDecls.has(node.name) ? globals : scope)[node.name] = val; return; }
    if (node.type === 'index') {
      const obj = evalNode(node.obj);
      if (obj && obj.__dict__) {
        const key = evalNode(node.index);
        for (const k of obj.__dict__.keys()) { if (cmpEq(k, key)) { obj.__dict__.set(k, val); return; } }
        obj.__dict__.set(key, val); return;
      }
      let idx = toNum(evalNode(node.index));
      if (idx < 0) idx += obj.length; obj[idx] = val; return;
    }
    // tuple unpacking: a, b = ...
    if (tgt.indexOf(',') !== -1) {
      const names = splitArgs(tgt).map((s) => s.trim()).filter(Boolean);
      const arr = Array.isArray(val) ? val : [val];
      names.forEach((nm, k) => assignTarget(nm, arr[k]));
      return;
    }
    throw new Error('沒辦法把值指定給這個目標');
  }
  function execPrint(argSrc) {
    const parts = splitArgs(argSrc);
    let end = '\n', sep = ' '; const vals = [];
    for (const p of parts) {
      const t = p.trim(); if (!t) continue; let m;
      if ((m = t.match(/^end\s*=\s*(.+)$/))) { end = pyStr(evalNode(parseExprStr(m[1]))); continue; }
      if ((m = t.match(/^sep\s*=\s*(.+)$/))) { sep = pyStr(evalNode(parseExprStr(m[1]))); continue; }
      vals.push(pyStr(evalNode(parseExprStr(t))));
    }
    out.push(vals.join(sep) + end);
  }
  function execSimple(line) {
    if (line === 'pass') return;
    if (line === 'break') throw BREAK;
    if (line === 'continue') throw CONTINUE;
    if (line.startsWith('"""') || line.startsWith("'''")) return;
    let m;
    if ((m = line.match(/^return\b(.*)$/))) {
      const ex = m[1].trim();
      throw { __return__: true, value: ex ? evalNode(parseExprStr(ex)) : null };
    }
    if ((m = line.match(/^global\s+(.+)$/))) { m[1].split(',').forEach((n) => globalDecls.add(n.trim())); return; }
    if ((m = line.match(/^del\s+(.+)$/))) {
      const node = parseExprStr(m[1].trim());
      if (node.type === 'index') {
        const obj = evalNode(node.obj);
        if (obj && obj.__dict__) { const key = evalNode(node.index); for (const k of obj.__dict__.keys()) if (cmpEq(k, key)) { obj.__dict__.delete(k); return; } throw new Error('字典裡沒有這個 key（KeyError）'); }
        if (Array.isArray(obj)) { let idx = toNum(evalNode(node.index)); if (idx < 0) idx += obj.length; obj.splice(idx, 1); return; }
      }
      if (node.type === 'var') { delete scope[node.name]; delete globals[node.name]; return; }
      return;
    }
    if ((m = line.match(/^import\s+([A-Za-z_]\w*)/))) { globals[m[1]] = { __module__: m[1] }; return; }
    if (/^from\s+/.test(line)) return;
    const pr = line.match(/^print\s*\((.*)\)\s*$/);
    if (pr) { execPrint(pr[1]); return; }
    const as = findTopAssign(line);
    if (as) {
      const tgt = line.slice(0, as.opStart).trim();
      const rhs = line.slice(as.idx + 1).trim();
      let val;
      if (as.op) val = evalNode({ type: 'bin', op: as.op, left: parseExprStr(tgt), right: parseExprStr(rhs) });
      else val = evalNode(parseExprStr(rhs));
      assignTarget(tgt, val); return;
    }
    evalNode(parseExprStr(line));
  }

  function execLines(start, blockIndent) {
    let i = start;
    while (i < stmts.length && stmts[i].indent >= blockIndent) {
      if (stmts[i].indent > blockIndent) { i++; continue; }
      const t = stmts[i].text;
      if (/^if\s+.*:\s*$/.test(t)) i = execIf(i, blockIndent);
      else if (/^for\s+.*:\s*$/.test(t)) i = execFor(i, blockIndent);
      else if (/^while\s+.*:\s*$/.test(t)) i = execWhile(i, blockIndent);
      else if (/^def\s+.*:\s*$/.test(t)) i = execDef(i, blockIndent);
      else { execSimple(t); i++; }
    }
    return i;
  }
  function blockRange(i, blockIndent) {
    let k = i + 1;
    while (k < stmts.length && stmts[k].indent > blockIndent) k++;
    return k;
  }
  function parseParams(src) {
    const parts = splitArgs(src);
    return parts.map((p) => {
      const t = p.trim(); if (!t) return null;
      const eq = t.indexOf('=');
      if (eq !== -1) return { name: t.slice(0, eq).trim(), default: parseExprStr(t.slice(eq + 1).trim()) };
      return { name: t };
    }).filter(Boolean);
  }
  function execDef(i, blockIndent) {
    const m = stmts[i].text.match(/^def\s+([A-Za-z_]\w*)\s*\((.*)\)\s*:\s*$/);
    const bodyStart = i + 1, bodyEnd = blockRange(i, blockIndent);
    if (m) {
      const bodyIndent = bodyStart < stmts.length ? stmts[bodyStart].indent : blockIndent + 4;
      scope[m[1]] = { __func__: true, name: m[1], params: parseParams(m[2]), bodyStart, bodyEnd, bodyIndent };
    }
    return bodyEnd;
  }
  function callUserFunc(fn, args) {
    const local = {};
    fn.params.forEach((p, idx) => {
      if (idx < args.length) local[p.name] = args[idx];
      else if (p.default != null) local[p.name] = evalNode(p.default);
      else local[p.name] = null;
    });
    const savedScope = scope, savedDecls = globalDecls;
    scope = local; globalDecls = new Set();
    if (++callDepth > 3000) { scope = savedScope; globalDecls = savedDecls; callDepth--; throw new Error('函式呼叫太多層了（可能無限遞迴）'); }
    let ret = null;
    try { if (fn.bodyEnd > fn.bodyStart) execLines(fn.bodyStart, fn.bodyIndent); }
    catch (e) {
      if (e && e.__return__) ret = e.value;
      else { scope = savedScope; globalDecls = savedDecls; callDepth--; throw e; }
    }
    scope = savedScope; globalDecls = savedDecls; callDepth--;
    return ret;
  }
  function execFor(i, blockIndent) {
    const m = stmts[i].text.match(/^for\s+(.+?)\s+in\s+(.+):\s*$/);
    const bodyStart = i + 1, bodyEnd = blockRange(i, blockIndent);
    if (!m) return bodyEnd;
    const target = m[1].trim();
    const iter = evalNode(parseExprStr(m[2]));
    const list = Array.isArray(iter) ? iter : (typeof iter === 'string' ? iter.split('') : (iter && iter.__dict__ ? [...iter.__dict__.keys()] : []));
    for (const item of list) {
      if (target.indexOf(',') !== -1) {
        const names = splitArgs(target).map((s) => s.trim()).filter(Boolean);
        const arr = Array.isArray(item) ? item : [item];
        names.forEach((nm, k) => { (globalDecls.has(nm) ? globals : scope)[nm] = arr[k]; });
      } else {
        scope[target] = item;
      }
      if (++loopGuard > 200000) throw new Error('迴圈跑太多次了（可能是無限迴圈）');
      try { if (bodyEnd > bodyStart) execLines(bodyStart, stmts[bodyStart].indent); }
      catch (e) { if (e === BREAK) break; if (e === CONTINUE) continue; throw e; }
    }
    return bodyEnd;
  }
  function execWhile(i, blockIndent) {
    const m = stmts[i].text.match(/^while\s+(.+):\s*$/);
    const bodyStart = i + 1, bodyEnd = blockRange(i, blockIndent);
    if (!m) return bodyEnd;
    const condStr = m[1];
    while (truthy(evalNode(parseExprStr(condStr)))) {
      if (++loopGuard > 200000) throw new Error('迴圈跑太多次了（可能是無限迴圈）');
      try { if (bodyEnd > bodyStart) execLines(bodyStart, stmts[bodyStart].indent); }
      catch (e) { if (e === BREAK) break; if (e === CONTINUE) continue; throw e; }
    }
    return bodyEnd;
  }

  function execIf(i, blockIndent) {
    const clauses = [];
    let j = i;
    while (j < stmts.length && stmts[j].indent === blockIndent) {
      const t = stmts[j].text; let m;
      if ((m = t.match(/^if\s+(.*):$/)) && clauses.length === 0) clauses.push({ kind: 'if', cond: m[1] });
      else if ((m = t.match(/^elif\s+(.*):$/)) && clauses.length > 0) clauses.push({ kind: 'elif', cond: m[1] });
      else if (/^else\s*:$/.test(t) && clauses.length > 0) clauses.push({ kind: 'else', cond: null });
      else break;
      let k = j + 1;
      while (k < stmts.length && stmts[k].indent > blockIndent) k++;
      const cl = clauses[clauses.length - 1]; cl.bodyStart = j + 1; cl.bodyEnd = k;
      j = k;
      if (!(j < stmts.length && stmts[j].indent === blockIndent && /^(elif|else)\b/.test(stmts[j].text))) break;
    }
    for (const cl of clauses) {
      if (cl.kind === 'else' || truthy(evalNode(parseExprStr(cl.cond)))) {
        if (cl.bodyEnd > cl.bodyStart) execLines(cl.bodyStart, stmts[cl.bodyStart].indent);
        break;
      }
    }
    return j;
  }

  try { execLines(0, 0); }
  catch (e) {
    if (e && e.__stopInput__) out.push('\n⏸ 還沒結束 —— 程式想再讀一次輸入。把左邊輸入框再多填幾個值（用逗號或換行分隔）就能繼續！');
    else throw e;
  }
  return out.join('').replace(/\n$/, '');
}
function splitArgs(s) {
  const parts = []; let depth = 0, inStr = null, cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { cur += c; if (c === inStr && s[i - 1] !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; cur += c; continue; }
    if (c === '(') { depth++; cur += c; continue; }
    if (c === ')') { depth--; cur += c; continue; }
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}
function detectPrompts(code) {
  const prompts = []; const re = /input\s*\(\s*(?:f?["']([^"']*)["'])?/g; let m;
  while ((m = re.exec(code))) prompts.push(m[1] !== undefined ? m[1] : '輸入：');
  return prompts;
}

/* ============================================================
   PyRunner — editable code (left) + output (right)
   ============================================================ */
function PyRunner({ initialCode, code: codeProp, file = 'main.py', defaultInputs = {} }) {
  const originalSeed = initialCode != null ? initialCode : (codeProp != null ? codeProp : '');
  const getSaved = () => (window.__codeSubmissions__ && window.__codeSubmissions__[file]) || originalSeed;
  const [code, setCode] = React.useState(getSaved);

  // 當 Supabase 非同步載完資料後，更新程式碼
  React.useEffect(() => {
    const handler = () => {
      const saved = window.__codeSubmissions__ && window.__codeSubmissions__[file];
      if (saved) setCode(saved);
    };
    window.addEventListener('sb:code-loaded', handler);
    return () => window.removeEventListener('sb:code-loaded', handler);
  }, [file]);
  const [inputs, setInputs] = React.useState(defaultInputs);
  const [output, setOutput] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const taRef = React.useRef(null);
  const prompts = React.useMemo(() => detectPrompts(code), [code]);
  // When a program LOOPS and asks more than one kind of question, the number of
  // inputs is dynamic — fixed labelled fields are misleading. Collapse to one box.
  const loopMode = React.useMemo(() => prompts.length > 1 && /(^|\n)\s*(while|for)\b/.test(code), [code, prompts]);

  function autoGrow(el) { if (!el) return; el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, 120) + 'px'; }
  React.useEffect(() => { autoGrow(taRef.current); }, [code]);

  function run() {
    const queue = [];
    if (loopMode) {
      const raw = inputs[0] !== undefined ? String(inputs[0]) : '';
      raw.split('\n').map((s) => s.trim()).filter((s) => s.length).forEach((tok) => queue.push(tok));
    } else {
      prompts.forEach((_, i) => {
        const raw = inputs[i] !== undefined ? String(inputs[i]) : '';
        const toks = raw.split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length);
        if (toks.length) queue.push(...toks); else queue.push('');
      });
    }
    let qi = 0; const stdin = () => (qi < queue.length ? queue[qi++] : null);
    try { setOutput(runPython(code, stdin)); setErr(null); }
    catch (e) { setErr(e.message || String(e)); setOutput(null); }
    // 存到 Supabase（fire and forget）
    if (typeof sbSaveCode === 'function') sbSaveCode(window.__lessonNo__ || 0, file, code);
  }
  function reset() { setCode(seed); setInputs(defaultInputs); setOutput(null); setErr(null); }
  function handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target, s = el.selectionStart, en = el.selectionEnd;
      const nv = code.slice(0, s) + '    ' + code.slice(en);
      setCode(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  }
  const paneBar = { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', minHeight: 50, background: '#1f2915', borderBottom: '1px solid #2f3d20' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 30px rgba(74,90,20,0.18)', border: '1.5px solid #1c2613', margin: '0 0 8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#25301a' }}>
        <div style={paneBar}>
          <span style={{ fontFamily: M.mono, fontSize: 13.5, color: '#9db380', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>📝 {file}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto' }}>
            <button onClick={reset} style={{ fontFamily: M.fontUI, fontWeight: 600, fontSize: 13, background: 'transparent', color: '#82915f', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 14 }}>↺ 重設</button>
            <button onClick={run} style={{ fontFamily: M.fontUI, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', background: M.green, color: M.onColor, border: 'none', borderRadius: 999, padding: '7px 15px', cursor: 'pointer', boxShadow: '0 3px 0 ' + M.greenDeep }}>▶ 執行</button>
          </span>
        </div>
        <textarea ref={taRef} value={code} spellCheck={false} onChange={(e) => setCode(e.target.value)} onKeyDown={handleTab}
          style={{ flex: '1 1 auto', display: 'block', width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: '#e9e4d0', fontFamily: M.mono, fontSize: 14.5, lineHeight: 1.85, padding: '18px 20px', tabSize: 4, overflow: 'hidden' }}></textarea>
        {prompts.length > 0 && (
          <div style={{ padding: '12px 18px 14px', background: '#1f2915', borderTop: '1px solid #2f3d20' }}>
            {loopMode ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9db380', marginBottom: 4 }}>輸入區（每行一個答案，照程式詢問的順序填）</div>
                <div style={{ fontSize: 11.5, color: '#82915f', marginBottom: 9, lineHeight: 1.5 }}>這個程式會重複問問題，所以把每次要回答的內容一行一個寫在這裡。</div>
                <textarea value={inputs[0] !== undefined ? inputs[0] : ''} spellCheck={false} onChange={(e) => setInputs({ ...inputs, 0: e.target.value })}
                  style={{ width: '100%', minHeight: 96, resize: 'vertical', fontFamily: M.mono, fontSize: 14, lineHeight: 1.7, color: M.ink, background: '#fff', border: '1.5px solid #2f3d20', borderRadius: 14, padding: '9px 12px', outline: 'none' }}></textarea>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9db380', marginBottom: 9 }}>程式會問你這些（先填好再執行）</div>
                {prompts.map((p, i) => (
                  <label key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontFamily: M.fontUI, fontSize: 13.5, fontWeight: 600, color: '#cfe0ad', lineHeight: 1.45 }}>{p.trim() || '輸入：'}</span>
                    <input value={inputs[i] !== undefined ? inputs[i] : ''} onChange={(e) => setInputs({ ...inputs, [i]: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', fontFamily: M.fontUI, fontSize: 14, color: M.ink, background: '#fff', border: '1.5px solid #2f3d20', borderRadius: 14, padding: '7px 11px', outline: 'none' }} />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#1c2613', borderLeft: '1.5px solid #11160b' }}>
        <div style={paneBar}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#8fd14b' }}></span>
          <span style={{ fontFamily: M.fontUI, fontSize: 13, fontWeight: 600, color: '#9db380' }}>輸出結果</span>
        </div>
        <div style={{ flex: '1 1 auto', padding: '18px 20px', minHeight: 130 }}>
          {err ? <pre style={{ margin: 0, fontFamily: M.mono, fontSize: 14, lineHeight: 1.85, color: M.orange, whiteSpace: 'pre-wrap' }}>{err}</pre>
            : output !== null ? <pre style={{ margin: 0, fontFamily: M.mono, fontSize: 14, lineHeight: 1.85, color: '#e9e4d0', whiteSpace: 'pre-wrap' }}>{output || '（沒有輸出）'}</pre>
              : <div style={{ color: '#6f7d55', fontStyle: 'italic', fontFamily: M.fontUI, fontSize: 14.5, lineHeight: 1.6 }}>← 點擊「執行」看結果</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   QuizQuestion
   ============================================================ */
function QuizQuestion({ no, question, options, answer, explain }) {
  const saved = window.__quizAnswers__ && window.__quizAnswers__[no];
  const [picked, setPicked] = React.useState(saved ? parseInt(saved.answer) : null);
  const ans = Number(answer);

  // 當 Supabase 非同步載完後，還原已作答狀態
  React.useEffect(() => {
    const handler = () => {
      const s = window.__quizAnswers__ && window.__quizAnswers__[no];
      if (s && picked === null) setPicked(parseInt(s.answer));
    };
    window.addEventListener('sb:quiz-loaded', handler);
    return () => window.removeEventListener('sb:quiz-loaded', handler);
  }, [no]);
  const letters = ['A', 'B', 'C', 'D'];
  const opts = Array.isArray(options) ? options : [];
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${M.line}`, borderRadius: 28, padding: '22px 24px', marginBottom: 16, boxShadow: '0 6px 16px rgba(74,90,20,0.14)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 15, background: M.orange, color: M.onColor, minWidth: 38, height: 38, padding: '0 8px', borderRadius: 14, display: 'grid', placeItems: 'center', boxShadow: '0 3px 0 ' + M.orangeDeep, whiteSpace: 'nowrap' }}>Q{no}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: M.ink, lineHeight: 1.4, fontFamily: M.fontUI }}>{question}</div>
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        {opts.map((opt, i) => {
          const isCorrect = picked !== null && i === ans;
          const isWrong = picked !== null && i === picked && i !== ans;
          const base = { display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: picked !== null ? 'default' : 'pointer', background: M.paper, border: `1.5px solid ${M.line}`, borderRadius: 20, padding: '13px 16px', fontFamily: M.fontUI, fontSize: 15.5, color: M.ink, transition: 'all .22s' };
          if (isCorrect) { base.borderColor = M.green; base.background = '#eef7e1'; }
          if (isWrong) { base.borderColor = M.orangeDeep; base.background = '#fdeee2'; }
          const okBase = { flex: '0 0 26px', width: 26, height: 26, borderRadius: '50%', border: `2px solid ${M.line}`, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, color: M.ink3 };
          if (isCorrect) { okBase.background = M.green; okBase.borderColor = M.green; okBase.color = '#fff'; }
          if (isWrong) { okBase.background = M.orangeDeep; okBase.borderColor = M.orangeDeep; okBase.color = '#fff'; }
          return (
            <button key={i} disabled={picked !== null} onClick={() => { setPicked(i); if (typeof sbSaveQuizAnswer === 'function') sbSaveQuizAnswer(window.__lessonNo__ || 0, no, 'choice', i, i === ans); }} style={base}>
              <span style={okBase}>{picked !== null && i === ans ? '✓' : picked === i ? '✕' : letters[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div style={{ marginTop: 14, fontSize: 14.5, fontWeight: 600, padding: '11px 15px', borderRadius: 14, background: picked === ans ? '#eef7e1' : '#fdeee2', color: picked === ans ? M.greenDeep : M.orangeDeep }}>
          {picked === ans ? '答對了！ ' + explain : '再想想～ 正確答案是 ' + letters[ans] + '。' + explain}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SnakeGame
   ============================================================ */
function SnakeGame() {
  const canvasRef = React.useRef(null);
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const stateRef = React.useRef(null);
  const scoreRef = React.useRef(0);
  const GRID = 17, CELL = 22;

  function resetState() {
    stateRef.current = { snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: { x: 12, y: 8 } };
    setScore(0); setOver(false);
  }
  function placeFood() {
    const s = stateRef.current; let f;
    do { f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
    while (s.snake.some((p) => p.x === f.x && p.y === f.y));
    s.food = f;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    const ctx = canvasRef.current.getContext('2d'); const s = stateRef.current;
    ctx.fillStyle = '#1c2613'; ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
    ctx.fillStyle = '#fe9cdc'; roundRect(ctx, s.food.x * CELL + 3, s.food.y * CELL + 3, CELL - 6, CELL - 6, 6); ctx.fill();
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#f7da5a' : '#8fd14b';
      roundRect(ctx, p.x * CELL + 2, p.y * CELL + 2, CELL - 4, CELL - 4, 6); ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#25301a'; const ex = p.x * CELL, ey = p.y * CELL;
        ctx.beginPath(); ctx.arc(ex + 8, ey + 9, 2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + 14, ey + 9, 2, 0, 7); ctx.fill();
      }
    });
  }
  React.useEffect(() => { scoreRef.current = score; }, [score]);
  React.useEffect(() => {
    if (!running) return;
    resetState(); placeFood(); draw();
    const handleKey = (e) => {
      const s = stateRef.current; if (!s) return; const k = e.key;
      if ((k === 'ArrowUp' || k === 'w') && s.dir.y === 0) s.nextDir = { x: 0, y: -1 };
      else if ((k === 'ArrowDown' || k === 's') && s.dir.y === 0) s.nextDir = { x: 0, y: 1 };
      else if ((k === 'ArrowLeft' || k === 'a') && s.dir.x === 0) s.nextDir = { x: -1, y: 0 };
      else if ((k === 'ArrowRight' || k === 'd') && s.dir.x === 0) s.nextDir = { x: 1, y: 0 };
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    const tick = setInterval(() => {
      const s = stateRef.current; s.dir = s.nextDir;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || s.snake.some((p) => p.x === head.x && p.y === head.y)) {
        clearInterval(tick); window.removeEventListener('keydown', handleKey);
        setOver(true); setRunning(false); setBest((b) => Math.max(b, scoreRef.current)); return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) { scoreRef.current += 1; setScore(scoreRef.current); placeFood(); }
      else s.snake.pop();
      draw();
    }, 130);
    return () => { clearInterval(tick); window.removeEventListener('keydown', handleKey); };
  }, [running]);
  function start() { scoreRef.current = 0; setRunning(true); }
  return (
    <div style={{ background: '#25301a', borderRadius: 28, padding: 24, boxShadow: '0 14px 30px rgba(74,90,20,0.18)', border: '1.5px solid #1c2613', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ color: '#e9e4d0', fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 18 }}>分數 <b style={{ color: M.yellow }}>{score}</b></div>
        <div style={{ fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 14, color: '#9db380' }}>最高 {best}</div>
      </div>
      <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} style={{ background: '#1c2613', borderRadius: 20, display: 'block', imageRendering: 'pixelated' }}></canvas>
      {over && <div style={{ color: M.orange, fontWeight: 700, fontSize: 15, fontFamily: M.fontUI }}>遊戲結束！得分 {score} — 再玩一次？</div>}
      {!running
        ? <button onClick={start} style={{ fontFamily: M.fontUI, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '13px 26px', background: M.orange, color: M.onColor, boxShadow: '0 4px 0 ' + M.orangeDeep }}>▶ {over ? '再玩一次' : '開始遊戲'}</button>
        : <div style={{ color: '#9db380', fontSize: 13, fontFamily: M.fontUI }}>用方向鍵 ↑ ↓ ← → 控制蛇的移動</div>}
    </div>
  );
}

/* ============================================================
   FillQuestion — fill-in-the-blank
   ============================================================ */
function FillQuestion({ no, question, answer, explain }) {
  const saved = window.__quizAnswers__ && window.__quizAnswers__[no];
  const [val, setVal] = React.useState(saved ? saved.answer : '');
  const [checked, setChecked] = React.useState(saved ? true : false);

  // 當 Supabase 非同步載完後，還原填充題狀態
  React.useEffect(() => {
    const handler = () => {
      const s = window.__quizAnswers__ && window.__quizAnswers__[no];
      if (s && !checked) { setVal(s.answer); setChecked(true); }
    };
    window.addEventListener('sb:quiz-loaded', handler);
    return () => window.removeEventListener('sb:quiz-loaded', handler);
  }, [no]);
  const accepts = String(answer).split('|').map((a) => a.trim().toLowerCase());
  const correct = accepts.includes(val.trim().toLowerCase());
  const state = checked ? (correct ? 'right' : 'miss') : 'idle';
  const border = state === 'right' ? M.green : state === 'miss' ? M.orangeDeep : M.line;
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${M.line}`, borderRadius: 28, padding: '22px 24px', marginBottom: 16, boxShadow: '0 6px 16px rgba(74,90,20,0.14)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 15, background: M.blue, color: M.ink, minWidth: 38, height: 38, padding: '0 8px', borderRadius: 14, display: 'grid', placeItems: 'center', boxShadow: '0 3px 0 #5a9fe6', whiteSpace: 'nowrap' }}>Q{no}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: M.ink, lineHeight: 1.4, fontFamily: M.fontUI }}>{question}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={val} onChange={(e) => { setVal(e.target.value); setChecked(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') setChecked(true); }}
          placeholder="在這裡作答…"
          style={{ flex: '1 1 200px', fontFamily: M.mono, fontSize: 15, color: M.ink, background: M.paper, border: `1.5px solid ${border}`, borderRadius: 14, padding: '11px 14px', outline: 'none' }} />
        <button onClick={() => { setChecked(true); const c = accepts.includes(val.trim().toLowerCase()); if (typeof sbSaveQuizAnswer === 'function') sbSaveQuizAnswer(window.__lessonNo__ || 0, no, 'fill', val.trim(), c); }} style={{ fontFamily: M.fontUI, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '11px 22px', background: M.green, color: M.onColor, boxShadow: '0 4px 0 ' + M.greenDeep }}>檢查</button>
      </div>
      {checked && (
        <div style={{ marginTop: 14, fontSize: 14.5, fontWeight: 600, padding: '11px 15px', borderRadius: 14, background: correct ? '#eef7e1' : '#fdeee2', color: correct ? M.greenDeep : M.orangeDeep }}>
          {correct ? '答對了！ ' + explain : '再想想～ 正確答案是 ' + accepts[0] + '。' + explain}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SnakeGameCustom — playable + customizable (Lesson 6)
   ============================================================ */
function SnakeGameCustom() {
  const canvasRef = React.useRef(null);

  // applied (live) settings
  const [grid, setGrid] = React.useState(17);
  const [initLen, setInitLen] = React.useState(3);
  const [speedLevel, setSpeedLevel] = React.useState(6);
  const [colHead, setColHead] = React.useState('#f7da5a');
  const [colBody, setColBody] = React.useState('#8fd14b');
  const [colFood, setColFood] = React.useState('#fe9cdc');

  // pending inputs (apply on restart)
  const [pendGrid, setPendGrid] = React.useState(17);
  const [pendLen, setPendLen] = React.useState(3);

  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [over, setOver] = React.useState(false);

  const stateRef = React.useRef(null);
  const scoreRef = React.useRef(0);
  const timerRef = React.useRef(null);
  const stoppedRef = React.useRef(true);
  const speedRef = React.useRef(speedLevel);
  const colorsRef = React.useRef({ head: colHead, body: colBody, food: colFood });
  const gridRef = React.useRef(grid);

  const BOARD = 374;
  const cell = Math.max(8, Math.floor(BOARD / grid));
  const px = cell * grid;

  React.useEffect(() => { speedRef.current = speedLevel; }, [speedLevel]);
  React.useEffect(() => { colorsRef.current = { head: colHead, body: colBody, food: colFood }; if (!running && stateRef.current) draw(); }, [colHead, colBody, colFood]);
  React.useEffect(() => { gridRef.current = grid; }, [grid]);
  React.useEffect(() => { scoreRef.current = score; }, [score]);

  function levelToMs(lv) { return Math.round(270 - lv * 23); }

  function initSnake(g, len) {
    const cy = Math.floor(g / 2);
    const headX = Math.min(g - 1, Math.max(Math.floor(g / 2), len - 1));
    const snake = [];
    for (let i = 0; i < len; i++) snake.push({ x: headX - i, y: cy });
    return snake;
  }
  function resetState(g, len) {
    const snake = initSnake(g, len);
    stateRef.current = { snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: { x: 0, y: 0 } };
    placeFood(g);
    scoreRef.current = 0; setScore(0); setOver(false);
  }
  function placeFood(g) {
    const s = stateRef.current; let f;
    do { f = { x: Math.floor(Math.random() * g), y: Math.floor(Math.random() * g) }; }
    while (s.snake.some((p) => p.x === f.x && p.y === f.y));
    s.food = f;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); const s = stateRef.current; if (!s) return;
    const g = gridRef.current; const c = colorsRef.current;
    const cl = Math.max(8, Math.floor(BOARD / g));
    ctx.fillStyle = '#1c2613'; ctx.fillRect(0, 0, cl * g, cl * g);
    ctx.fillStyle = c.food; roundRect(ctx, s.food.x * cl + 3, s.food.y * cl + 3, cl - 6, cl - 6, Math.max(3, cl / 5)); ctx.fill();
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? c.head : c.body;
      roundRect(ctx, p.x * cl + 2, p.y * cl + 2, cl - 4, cl - 4, Math.max(3, cl / 4)); ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#25301a'; const ex = p.x * cl, ey = p.y * cl, e = cl / 22;
        ctx.beginPath(); ctx.arc(ex + 8 * e, ey + 9 * e, 2 * e, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + 14 * e, ey + 9 * e, 2 * e, 0, 7); ctx.fill();
      }
    });
  }
  function step() {
    const s = stateRef.current; const g = gridRef.current; if (!s) return;
    s.dir = s.nextDir;
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
    if (head.x < 0 || head.x >= g || head.y < 0 || head.y >= g || s.snake.some((p) => p.x === head.x && p.y === head.y)) {
      stoppedRef.current = true; clearTimeout(timerRef.current);
      setOver(true); setRunning(false); setBest((b) => Math.max(b, scoreRef.current)); return;
    }
    s.snake.unshift(head);
    if (head.x === s.food.x && head.y === s.food.y) { scoreRef.current += 1; setScore(scoreRef.current); placeFood(g); }
    else s.snake.pop();
    draw();
  }
  function loop() {
    timerRef.current = setTimeout(() => {
      if (stoppedRef.current) return;
      step();
      if (!stoppedRef.current) loop();
    }, levelToMs(speedRef.current));
  }

  React.useEffect(() => {
    const handleKey = (e) => {
      const s = stateRef.current; if (!s || stoppedRef.current) return; const k = e.key;
      if ((k === 'ArrowUp' || k === 'w') && s.dir.y === 0) s.nextDir = { x: 0, y: -1 };
      else if ((k === 'ArrowDown' || k === 's') && s.dir.y === 0) s.nextDir = { x: 0, y: 1 };
      else if ((k === 'ArrowLeft' || k === 'a') && s.dir.x === 0) s.nextDir = { x: -1, y: 0 };
      else if ((k === 'ArrowRight' || k === 'd') && s.dir.x === 0) s.nextDir = { x: 1, y: 0 };
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); stoppedRef.current = true; clearTimeout(timerRef.current); };
  }, []);

  // draw an idle board on mount + whenever grid/length changes while stopped
  React.useEffect(() => {
    if (running) return;
    resetState(grid, Math.min(initLen, grid - 1));
    draw();
  }, [grid, initLen]);

  function start() {
    clearTimeout(timerRef.current);
    resetState(grid, Math.min(initLen, grid - 1));
    draw();
    stoppedRef.current = false;
    setRunning(true);
    loop();
  }
  function applyAndRestart() {
    const g = Math.max(8, Math.min(28, Math.round(pendGrid) || 17));
    const l = Math.max(1, Math.min(g - 1, Math.round(pendLen) || 3));
    setGrid(g); setInitLen(l); setPendGrid(g); setPendLen(l);
    // restart fresh with new settings
    clearTimeout(timerRef.current); stoppedRef.current = true; setRunning(false); setOver(false);
    gridRef.current = g;
    resetState(g, l);
    setTimeout(draw, 0);
  }

  const swatch = (val, cur, set) => (
    React.createElement('button', {
      key: val, onClick: () => set(val),
      style: { width: 28, height: 28, borderRadius: 9, background: val, cursor: 'pointer',
        border: cur === val ? '3px solid #fffbef' : '2px solid #2f3d20',
        boxShadow: cur === val ? '0 0 0 2px ' + val : 'none', transition: 'all .15s' }
    })
  );
  const headOpts = ['#f7da5a', '#ff8a1e', '#5ab0f7', '#fe9cdc'];
  const bodyOpts = ['#8fd14b', '#4d8e02', '#5ab0f7', '#ff8a1e'];
  const foodOpts = ['#fe9cdc', '#ff8a1e', '#f7da5a', '#ffffff'];

  const ctrlLabel = { fontSize: 13, fontWeight: 700, color: '#cfe0ad', fontFamily: M.fontUI, marginBottom: 7 };
  const numInput = { width: 64, fontFamily: M.mono, fontSize: 15, color: M.ink, background: '#fff', border: '1.5px solid #2f3d20', borderRadius: 12, padding: '7px 10px', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
      {/* GAME */}
      <div style={{ background: '#25301a', borderRadius: 28, padding: 22, boxShadow: '0 14px 30px rgba(74,90,20,0.18)', border: '1.5px solid #1c2613', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ color: '#e9e4d0', fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 18 }}>分數 <b style={{ color: M.yellow }}>{score}</b></div>
          <div style={{ fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 14, color: '#9db380' }}>最高 {best}</div>
        </div>
        <canvas ref={canvasRef} width={px} height={px} style={{ background: '#1c2613', borderRadius: 18, display: 'block', width: px, height: px }}></canvas>
        {over && <div style={{ color: M.orange, fontWeight: 700, fontSize: 15, fontFamily: M.fontUI }}>遊戲結束！得分 {score}</div>}
        {!running
          ? <button onClick={start} style={{ fontFamily: M.fontUI, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '13px 30px', background: M.orange, color: M.onColor, boxShadow: '0 4px 0 ' + M.orangeDeep }}>▶ {over ? '再玩一次' : '開始遊戲'}</button>
          : <div style={{ color: '#9db380', fontSize: 13, fontFamily: M.fontUI }}>用方向鍵 ↑ ↓ ← → 控制蛇</div>}
      </div>

      {/* CONTROL PANEL */}
      <div style={{ flex: '1 1 280px', minWidth: 280, background: '#fff', border: `1.5px solid ${M.line}`, borderRadius: 24, padding: '20px 22px', boxShadow: '0 6px 16px rgba(74,90,20,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 20, color: M.ink, display: 'flex', alignItems: 'center', gap: 8 }}>🎨 客製化面板</div>

        {/* speed */}
        <div>
          <div style={{ ...ctrlLabel, color: M.ink }}>① 速度 <span style={{ fontWeight: 600, color: M.ink3 }}>（即時生效）</span></div>
          <input type="range" min="1" max="10" step="1" value={speedLevel} onChange={(e) => setSpeedLevel(Number(e.target.value))}
            style={{ width: '100%', accentColor: M.green, cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: M.ink3, fontFamily: M.fontUI, marginTop: 2 }}><span>← 慢（初學者）</span><span>快（挑戰）→</span></div>
        </div>

        {/* colors */}
        <div>
          <div style={{ ...ctrlLabel, color: M.ink }}>② 顏色 <span style={{ fontWeight: 600, color: M.ink3 }}>（即時生效）</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: M.ink2, width: 64, fontFamily: M.fontUI }}>蛇頭</span>
            <div style={{ display: 'flex', gap: 8 }}>{headOpts.map((v) => swatch(v, colHead, setColHead))}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: M.ink2, width: 64, fontFamily: M.fontUI }}>蛇身</span>
            <div style={{ display: 'flex', gap: 8 }}>{bodyOpts.map((v) => swatch(v, colBody, setColBody))}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: M.ink2, width: 64, fontFamily: M.fontUI }}>食物</span>
            <div style={{ display: 'flex', gap: 8 }}>{foodOpts.map((v) => swatch(v, colFood, setColFood))}</div>
          </div>
        </div>

        {/* grid + length */}
        <div>
          <div style={{ ...ctrlLabel, color: M.ink }}>③ 地圖 &amp; 蛇長 <span style={{ fontWeight: 600, color: M.ink3 }}>（按套用後重新開始）</span></div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: M.ink2, fontFamily: M.fontUI }}>
              格數 GRID（8–28）
              <input type="number" min="8" max="28" value={pendGrid} onChange={(e) => setPendGrid(e.target.value)} style={numInput} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: M.ink2, fontFamily: M.fontUI }}>
              初始長度
              <input type="number" min="1" max="27" value={pendLen} onChange={(e) => setPendLen(e.target.value)} style={numInput} />
            </label>
          </div>
          <button onClick={applyAndRestart} style={{ marginTop: 14, fontFamily: M.fontUI, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '10px 22px', background: M.green, color: M.onColor, boxShadow: '0 4px 0 ' + M.greenDeep }}>套用並重新開始</button>
        </div>

        <div style={{ fontSize: 12.5, color: M.ink3, fontFamily: M.fontUI, lineHeight: 1.6, background: M.paper, border: `1px dashed ${M.line}`, borderRadius: 14, padding: '10px 14px' }}>
          💡 對照程式碼：速度是 <code style={{ fontFamily: M.mono, color: M.greenDeep }}>SPEED</code>、顏色是 <code style={{ fontFamily: M.mono, color: M.greenDeep }}>#f7da5a / #8fd14b / #fe9cdc</code>、地圖是 <code style={{ fontFamily: M.mono, color: M.greenDeep }}>GRID</code>、蛇長是 <code style={{ fontFamily: M.mono, color: M.greenDeep }}>game['snake']</code> 的初始節數。
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PlayableSnake — compact playable game (fixed look) for the code lab
   ============================================================ */
function PlayableSnake() {
  const canvasRef = React.useRef(null);
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const stateRef = React.useRef(null);
  const scoreRef = React.useRef(0);
  const timerRef = React.useRef(null);
  const stoppedRef = React.useRef(true);
  const G = 17, SPEED = 130, BOARD = 340;
  const cell = Math.floor(BOARD / G), px = cell * G;
  const COL = { head: '#f7da5a', body: '#8fd14b', food: '#fe9cdc' };

  React.useEffect(() => { scoreRef.current = score; }, [score]);

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function placeFood() {
    const s = stateRef.current; let f;
    do { f = { x: Math.floor(Math.random() * G), y: Math.floor(Math.random() * G) }; }
    while (s.snake.some((p) => p.x === f.x && p.y === f.y));
    s.food = f;
  }
  function resetState() {
    const cy = Math.floor(G / 2);
    stateRef.current = { snake: [{ x: cy, y: cy }, { x: cy - 1, y: cy }, { x: cy - 2, y: cy }], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: { x: 0, y: 0 } };
    placeFood(); scoreRef.current = 0; setScore(0); setOver(false);
  }
  function draw() {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); const s = stateRef.current; if (!s) return;
    ctx.fillStyle = '#1c2613'; ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = COL.food; roundRect(ctx, s.food.x * cell + 3, s.food.y * cell + 3, cell - 6, cell - 6, 4); ctx.fill();
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? COL.head : COL.body;
      roundRect(ctx, p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4, 5); ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#25301a';
        ctx.beginPath(); ctx.arc(p.x * cell + cell * 0.36, p.y * cell + cell * 0.42, 2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x * cell + cell * 0.64, p.y * cell + cell * 0.42, 2, 0, 7); ctx.fill();
      }
    });
  }
  function step() {
    const s = stateRef.current; if (!s) return;
    s.dir = s.nextDir;
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
    if (head.x < 0 || head.x >= G || head.y < 0 || head.y >= G || s.snake.some((p) => p.x === head.x && p.y === head.y)) {
      stoppedRef.current = true; clearTimeout(timerRef.current);
      setOver(true); setRunning(false); setBest((b) => Math.max(b, scoreRef.current)); return;
    }
    s.snake.unshift(head);
    if (head.x === s.food.x && head.y === s.food.y) { scoreRef.current += 1; setScore(scoreRef.current); placeFood(); }
    else s.snake.pop();
    draw();
  }
  function loop() { timerRef.current = setTimeout(() => { if (stoppedRef.current) return; step(); if (!stoppedRef.current) loop(); }, SPEED); }

  React.useEffect(() => {
    const handleKey = (e) => {
      const s = stateRef.current; if (!s || stoppedRef.current) return; const k = e.key;
      if ((k === 'ArrowUp' || k === 'w') && s.dir.y === 0) s.nextDir = { x: 0, y: -1 };
      else if ((k === 'ArrowDown' || k === 's') && s.dir.y === 0) s.nextDir = { x: 0, y: 1 };
      else if ((k === 'ArrowLeft' || k === 'a') && s.dir.x === 0) s.nextDir = { x: -1, y: 0 };
      else if ((k === 'ArrowRight' || k === 'd') && s.dir.x === 0) s.nextDir = { x: 1, y: 0 };
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    resetState(); draw();
    return () => { window.removeEventListener('keydown', handleKey); stoppedRef.current = true; clearTimeout(timerRef.current); };
  }, []);

  function start() { clearTimeout(timerRef.current); resetState(); draw(); stoppedRef.current = false; setRunning(true); loop(); }

  return (
    <div style={{ background: '#25301a', borderRadius: 22, padding: 18, border: '1.5px solid #1c2613', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ color: '#e9e4d0', fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 16 }}>分數 <b style={{ color: M.yellow }}>{score}</b></div>
        <div style={{ fontFamily: M.fontDisplay, fontWeight: 700, fontSize: 13, color: '#9db380' }}>最高 {best}</div>
      </div>
      <canvas ref={canvasRef} width={px} height={px} style={{ background: '#1c2613', borderRadius: 16, display: 'block', width: px, height: px, maxWidth: '100%' }}></canvas>
      {over && <div style={{ color: M.orange, fontWeight: 700, fontSize: 14, fontFamily: M.fontUI }}>遊戲結束！得分 {score}</div>}
      {!running
        ? <button onClick={start} style={{ fontFamily: M.fontUI, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '11px 26px', background: M.orange, color: M.onColor, boxShadow: '0 4px 0 ' + M.orangeDeep }}>▶ {over ? '再玩一次' : '開始遊戲'}</button>
        : <div style={{ color: '#9db380', fontSize: 12.5, fontFamily: M.fontUI }}>用方向鍵 ↑ ↓ ← → 控制蛇</div>}
    </div>
  );
}

/* ============================================================
   SnakeCodeRunner — editable code (left) + validated playable game (right)
   Press ▶ 執行: only runs the game if the student's code matches the
   answer (whitespace/quote/comment-insensitive); otherwise shows an error.
   ============================================================ */
function stripPyComment(line) {
  let inStr = null, out = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) { out += c; if (c === inStr && line[i - 1] !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; out += c; continue; }
    if (c === '#') break;
    out += c;
  }
  return out;
}
function normPyLine(l) { return stripPyComment(l).replace(/"/g, "'").replace(/\s+/g, ''); }
function pyCodeLines(src) { return src.split('\n').map(normPyLine).filter((l) => l.length); }

function SnakeCodeRunner({ blankCode, fullCode }) {
  const [code, setCode] = React.useState(blankCode);
  const [status, setStatus] = React.useState('idle'); // idle | ok | err
  const [errMsg, setErrMsg] = React.useState('');
  const [peeking, setPeeking] = React.useState(false); // hold-to-peek the answer
  const taRef = React.useRef(null);
  const peek = () => setPeeking(true);
  const unpeek = () => setPeeking(false);

  function handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target, s = el.selectionStart, en = el.selectionEnd;
      const nv = code.slice(0, s) + '    ' + code.slice(en);
      setCode(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  }
  function run() {
    if (/_{2,}/.test(code)) { setStatus('err'); setErrMsg('還有空格（___）沒填完喔！把每個 ___ 換成正確的程式碼再執行。'); return; }
    const ansN = pyCodeLines(fullCode);
    const stuN = pyCodeLines(code);
    // token-level compare (ignores line-break / indentation choices) so a correct
    // answer still passes even if the student merges or splits lines
    if (ansN.join('') === stuN.join('')) { setStatus('ok'); setErrMsg(''); return; }
    // best-effort: find first differing line to point the student at it
    const ansRaw = fullCode.split('\n').filter((l) => normPyLine(l).length);
    const stuRaw = code.split('\n').filter((l) => normPyLine(l).length);
    let hint = '';
    for (let i = 0; i < Math.min(ansRaw.length, stuRaw.length); i++) {
      if (normPyLine(ansRaw[i]) !== normPyLine(stuRaw[i])) { hint = stuRaw[i].trim(); break; }
    }
    if (!hint) hint = stuRaw.length < ansRaw.length ? '（好像少打了幾行程式碼）' : '（好像多打了幾行程式碼）';
    setStatus('err'); setErrMsg(hint);
  }
  function reset() { setCode(blankCode); setStatus('idle'); setErrMsg(''); }

  const paneBar = { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', minHeight: 50, background: '#1f2915', borderBottom: '1px solid #2f3d20' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 30px rgba(74,90,20,0.18)', border: '1.5px solid #1c2613' }}>
      {/* LEFT: editable code */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#25301a' }}>
        <div style={paneBar}>
          <span style={{ display: 'inline-flex', gap: 6, marginRight: 2 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56' }}></span>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }}></span>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f' }}></span>
          </span>
          <span style={{ fontFamily: M.mono, fontSize: 13, color: '#9db380' }}>🐍 snake.py</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto' }}>
            <button onClick={reset} style={{ fontFamily: M.fontUI, fontWeight: 600, fontSize: 13, background: 'transparent', color: '#82915f', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 14 }}>↺ 重設</button>
            <button onMouseDown={peek} onMouseUp={unpeek} onMouseLeave={unpeek} onTouchStart={(e) => { e.preventDefault(); peek(); }} onTouchEnd={unpeek} onContextMenu={(e) => e.preventDefault()} style={{ fontFamily: M.fontUI, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', background: peeking ? '#3c5226' : 'transparent', color: '#cfe0ad', border: '1.5px solid #3c5226', cursor: 'pointer', padding: '6px 12px', borderRadius: 999, userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}>{peeking ? '👀 鬆開繼續寫' : '👀 按住看答案'}</button>
            <button onClick={run} style={{ fontFamily: M.fontUI, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', background: M.green, color: M.onColor, border: 'none', borderRadius: 999, padding: '7px 16px', cursor: 'pointer', boxShadow: '0 3px 0 ' + M.greenDeep }}>▶ 執行</button>
          </span>
        </div>
        <textarea ref={taRef} value={peeking ? fullCode : code} readOnly={peeking} spellCheck={false} onChange={(e) => { if (!peeking) setCode(e.target.value); }} onKeyDown={handleTab}
          style={{ display: 'block', width: '100%', height: 560, border: 'none', outline: 'none', resize: 'vertical', background: 'transparent', color: peeking ? '#f7da5a' : '#e9e4d0', fontFamily: M.mono, fontSize: 13.5, lineHeight: 1.8, padding: '16px 18px', tabSize: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'auto' }}></textarea>
      </div>
      {/* RIGHT: output pane — same chrome as the 例題示範 (PyRunner) */}
      <div style={{ background: '#1c2613', display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1.5px solid #11160b' }}>
        <div style={paneBar}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#8fd14b' }}></span>
          <span style={{ fontFamily: M.fontUI, fontSize: 13, fontWeight: 600, color: '#9db380' }}>輸出結果</span>
        </div>
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, minWidth: 0 }}>
          {status === 'ok' && <PlayableSnake />}
          {status === 'idle' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 16px' }}>
              <div style={{ fontSize: 44 }}>🐍</div>
              <div style={{ color: '#6f7d55', fontStyle: 'italic', fontFamily: M.fontUI, fontSize: 14.5, lineHeight: 1.6, maxWidth: 240 }}>← 把每個 <code style={{ fontFamily: M.mono, color: '#cfe0ad', fontStyle: 'normal' }}>___</code> 空格填對，點擊「執行」看你的貪吃蛇跑起來</div>
            </div>
          )}
          {status === 'err' && (
            <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff8a8a', fontFamily: M.fontUI, fontWeight: 700, fontSize: 15 }}><span style={{ fontSize: 20 }}>❌</span> 程式還跑不起來</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#cdbf9e', fontFamily: M.fontUI }}>有地方跟正確答案不一樣，再檢查一下：</div>
              <pre style={{ margin: 0, background: '#0f1409', border: '1px solid #3c2626', borderRadius: 12, padding: '10px 12px', color: '#ffb3b3', fontFamily: M.mono, fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{errMsg}</pre>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#82915f', fontFamily: M.fontUI }}>卡住了？<b style={{ color: '#cfe0ad' }}>按住 👀 按住看答案</b> 偷瞄正確寫法，放開就回到你自己寫的程式碼。</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.PyRunner = PyRunner;
window.FillQuestion = FillQuestion;
window.QuizQuestion = QuizQuestion;
window.SnakeGame = SnakeGame;
window.SnakeGameCustom = SnakeGameCustom;
window.SnakeCodeRunner = SnakeCodeRunner;
window.PlayableSnake = PlayableSnake;
window.CodeBlock = CodeBlock;
window.CodeOut = CodeOut;
window.runPython = runPython;
