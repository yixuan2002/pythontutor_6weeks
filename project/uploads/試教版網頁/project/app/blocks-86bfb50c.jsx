/* Presentational blocks: code highlighting tokens, code block, callouts */

// Syntax token helpers
const K = ({ children }) => <span className="tok-kw">{children}</span>;
const S = ({ children }) => <span className="tok-str">{children}</span>;
const N = ({ children }) => <span className="tok-num">{children}</span>;
const F = ({ children }) => <span className="tok-fn">{children}</span>;
const C = ({ children }) => <span className="tok-com">{children}</span>;
const B = ({ children }) => <span className="tok-bool">{children}</span>;
const O = ({ children }) => <span className="tok-op">{children}</span>;

function CodeBlock({ file = 'main.py', children }) {
  return (
    <div className="code">
      <div className="code-bar">
        <span className="dot r"></span>
        <span className="dot y"></span>
        <span className="dot g"></span>
        <span className="file">{file}</span>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function CodeOut({ children, label = '執行結果' }) {
  return (
    <div className="code-out">
      <div className="out-label">{label}</div>
      <pre>{children}</pre>
    </div>
  );
}

function Callout({ kind = 'teacher', icon, title, children }) {
  const icons = { teacher: '🧑‍🏫', warn: '⚠️', tip: '💡' };
  return (
    <div className={'callout ' + kind}>
      <div className="ic">{icon || icons[kind]}</div>
      <div className="body">
        {title && <div className="ct">{title}</div>}
        {children}
      </div>
    </div>
  );
}

function Code({ children }) {
  return <span className="inline-code">{children}</span>;
}

Object.assign(window, { K, S, N, F, C, B, O, CodeBlock, CodeOut, Callout, Code });
