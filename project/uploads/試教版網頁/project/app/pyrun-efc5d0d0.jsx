/* Mini Python interpreter (teaching subset) + editable PyRunner component.
   Supports: comments, variable assignment, print(), input(), int()/float()/str()/len(),
   string + concat, numeric + - * / %, and f-strings with {expr} interpolation. */

function pyStr(v) {
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  return String(v);
}
function toNum(v) {
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error('沒辦法把「' + v + '」當成數字來算');
  return n;
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
    if ('+-*/%(),'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    i++;
  }
  return toks;
}

function parseTokens(toks) {
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  function parseExpr() { return parseAdd(); }
  function parseAdd() {
    let left = parseMul();
    while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = next().v; left = { type: 'bin', op, left, right: parseMul() };
    }
    return left;
  }
  function parseMul() {
    let left = parseUnary();
    while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/' || peek().v === '%')) {
      const op = next().v; left = { type: 'bin', op, left, right: parseUnary() };
    }
    return left;
  }
  function parseUnary() {
    if (peek() && peek().t === 'op' && peek().v === '-') { next(); return { type: 'neg', val: parseUnary() }; }
    return parsePrimary();
  }
  function parsePrimary() {
    const tk = peek();
    if (!tk) return { type: 'lit', val: '' };
    if (tk.t === 'num') { next(); return { type: 'lit', val: tk.v.includes('.') ? parseFloat(tk.v) : parseInt(tk.v, 10) }; }
    if (tk.t === 'str') { next(); return { type: 'lit', val: tk.v }; }
    if (tk.t === 'fstr') { next(); return { type: 'fstr', val: tk.v }; }
    if (tk.t === 'op' && tk.v === '(') { next(); const e = parseExpr(); if (peek() && peek().v === ')') next(); return e; }
    if (tk.t === 'name') {
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

function runPython(code, inputFn) {
  const ctx = {};
  const out = [];

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
        res += pyStr(evalNode(parseExprStr(ex))); i = j + 1;
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
        if (!(node.name in ctx)) throw new Error('變數「' + node.name + '」還沒定義過喔（NameError）');
        return ctx[node.name];
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
        if (node.op === '%') return toNum(l) % toNum(r);
        return 0;
      }
      case 'call': {
        const a = node.args.map(evalNode);
        if (node.name === 'input') {
          const prompt = a[0] !== undefined ? pyStr(a[0]) : '';
          const val = String(inputFn(prompt));
          out.push(prompt + val);            // echo prompt + typed value, like a terminal
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
        if (node.name === 'len') return String(a[0]).length;
        throw new Error('還不認識「' + node.name + '()」這個函式');
      }
    }
    return '';
  }

  const lines = code.split('\n');
  for (const raw of lines) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    const pr = line.match(/^print\s*\((.*)\)\s*$/);
    if (pr) { out.push(pyStr(evalNode(parseExprStr(pr[1])))); continue; }
    const asg = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (asg && !/^=/.test(asg[2])) { ctx[asg[1]] = evalNode(parseExprStr(asg[2])); continue; }
    evalNode(parseExprStr(line));            // bare expression (side effects, e.g. input())
  }
  return out.join('\n');
}

function detectPrompts(code) {
  const prompts = [];
  const re = /input\s*\(\s*(?:f?["']([^"']*)["'])?/g;
  let m;
  while ((m = re.exec(code))) prompts.push(m[1] !== undefined ? m[1] : '輸入：');
  return prompts;
}

/* ---------- Editable, runnable code widget ---------- */
function PyRunner({ initialCode, file = 'main.py', defaultInputs = {} }) {
  const [code, setCode] = React.useState(initialCode);
  const [inputs, setInputs] = React.useState(defaultInputs);
  const [output, setOutput] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const taRef = React.useRef(null);

  const prompts = React.useMemo(() => detectPrompts(code), [code]);

  function autoGrow(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
  React.useEffect(() => { autoGrow(taRef.current); }, [code]);

  function run() {
    const queue = prompts.map((_, i) => (inputs[i] !== undefined ? inputs[i] : ''));
    let qi = 0;
    const stdin = () => (qi < queue.length ? queue[qi++] : '');
    try {
      setOutput(runPython(code, stdin));
      setErr(null);
    } catch (e) {
      setErr(e.message || String(e));
      setOutput(null);
    }
  }

  function reset() {
    setCode(initialCode);
    setInputs(defaultInputs);
    setOutput(null);
    setErr(null);
  }

  function handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target, s = el.selectionStart, en = el.selectionEnd;
      const nv = code.slice(0, s) + '    ' + code.slice(en);
      setCode(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  }

  return (
    <div className="runner runner-split">
      <div className="runner-pane code-pane">
        <div className="pane-bar">
          <span className="pane-file">📝 {file}</span>
          <span className="pane-actions">
            <button className="btn-reset" onClick={reset}>↺ 重設</button>
            <button className="btn-run" onClick={run}>▶ 執行</button>
          </span>
        </div>
        <textarea
          ref={taRef}
          className="code-area"
          value={code}
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleTab}
        ></textarea>
        {prompts.length > 0 && (
          <div className="runner-inputs">
            <div className="ri-label">程式會問你這些（先填好再執行）</div>
            {prompts.map((p, i) => (
              <label className="in-row" key={i}>
                <span className="in-q">{p.trim() || '輸入：'}</span>
                <input
                  className="in-box"
                  value={inputs[i] !== undefined ? inputs[i] : ''}
                  onChange={(e) => setInputs({ ...inputs, [i]: e.target.value })}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="runner-pane out-pane">
        <div className="pane-bar">
          <span className="out-dot"></span>
          <span className="pane-label">輸出結果</span>
        </div>
        <div className={'out-body' + (err ? ' is-err' : '')}>
          {err
            ? <pre>{err}</pre>
            : output !== null
              ? <pre>{output || '（沒有輸出）'}</pre>
              : <div className="out-placeholder">← 點擊「執行」看結果</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { runPython, detectPrompts, PyRunner });
