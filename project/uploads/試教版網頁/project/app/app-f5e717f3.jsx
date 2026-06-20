/* App shell: sidebar agenda + content pane */
const { SECTIONS } = window;

const NAV = [
{ time: '課程簡介', icon: '📋', title: '課程總覽' },
{ time: '0–8 min', icon: '🌍', title: '課程開場' },
{ time: '8–20 min', icon: '📖', title: '概念講解' },
{ time: '20–32 min', icon: '💡', title: '例題示範' },
{ time: '32–40 min', icon: '📝', title: '小考' },
{ time: '40–45 min', icon: '🎮', title: '成品展示' }];


function App() {
  const [active, setActive] = React.useState(0);
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const Comp = SECTIONS[active].comp;
  const progress = Math.round(active / (NAV.length - 1) * 100);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">🐍</div>
          <div className="brand-text">
            <div className="title" style={{ fontSize: "30px" }}>Python 入門</div>
            <div className="sub">試教版 · 45 分鐘
            </div>
          </div>
        </div>

        <div className="agenda-label">AGENDA</div>
        <ul className="agenda">
          {NAV.map((n, i) => <li key={i}>
              <button
              className={'agenda-item' + (i === active ? ' active' : '') + (i < active ? ' done' : '')}
              onClick={() => setActive(i)}>
              
                <span className="agenda-num">{i < active ? '✓' : n.icon}</span>
                <span className="agenda-meta">
                  <span className="agenda-title">{n.title}</span>
                </span>
              </button>
            </li>
          )}
        </ul>

        <div className="sidebar-foot">
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width: progress + '%' }}></div>
          </div>
          <div className="progress-text">進度 {progress}% · 第 {active + 1} / {NAV.length} 站</div>
        </div>
      </aside>

      <main className="content" ref={contentRef}>
        <div className="content-inner">
          <Comp key={active} />

          <div className="section-nav">
            <button
              className="btn btn-ghost"
              disabled={active === 0}
              onClick={() => setActive((a) => Math.max(0, a - 1))}>
              ← 上一站</button>
            {active < NAV.length - 1 ?
            <button className="btn btn-green" onClick={() => setActive((a) => a + 1)}>下一站 · {NAV[active + 1].title} →</button> :
            <button className="btn btn-orange" onClick={() => setActive(0)}>↺ 回到開頭</button>}
          </div>
        </div>
      </main>
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);