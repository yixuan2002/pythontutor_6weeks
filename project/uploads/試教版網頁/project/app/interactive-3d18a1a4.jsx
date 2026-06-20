/* Interactive widgets: Quiz + Snake game */

function QuizQuestion({ no, question, options, answer, explain }) {
  const [picked, setPicked] = React.useState(null);
  const letters = ['A', 'B', 'C', 'D'];
  return (
    <div className="quiz-card">
      <div className="quiz-head">
        <div className="quiz-no" style={{ fontSize: "15px" }}>Q{no}</div>
        <div className="quiz-q">{question}</div>
      </div>
      <div className="quiz-opts">
        {options.map((opt, i) => {
          let cls = 'quiz-opt';
          if (picked !== null) {
            if (i === answer) cls += ' correct';else
            if (i === picked) cls += ' wrong';
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={picked !== null}
              onClick={() => setPicked(i)}>
              
              <span className="ok">{picked !== null && i === answer ? '✓' : picked === i ? '✕' : letters[i]}</span>
              <span>{opt}</span>
            </button>);

        })}
      </div>
      <div className={'quiz-feedback ' + (picked === null ? '' : picked === answer ? 'show right' : 'show miss')}>
        {picked !== null && (picked === answer ?
        '答對了！ ' + explain :
        '再想想～ 正確答案是 ' + letters[answer] + '。' + explain)}
      </div>
    </div>);

}

function SnakeGame() {
  const canvasRef = React.useRef(null);
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const stateRef = React.useRef(null);

  const GRID = 17;
  const CELL = 22;

  function reset() {
    stateRef.current = {
      snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 12, y: 8 }
    };
    setScore(0);
    setOver(false);
  }

  function placeFood() {
    const s = stateRef.current;
    let f;
    do {
      f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (s.snake.some((p) => p.x === f.x && p.y === f.y));
    s.food = f;
  }

  function draw() {
    const ctx = canvasRef.current.getContext('2d');
    const s = stateRef.current;
    ctx.fillStyle = '#1c2613';
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
    // food
    ctx.fillStyle = '#fe9cdc';
    roundRect(ctx, s.food.x * CELL + 3, s.food.y * CELL + 3, CELL - 6, CELL - 6, 6);
    ctx.fill();
    // snake
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#f7da5a' : '#8fd14b';
      roundRect(ctx, p.x * CELL + 2, p.y * CELL + 2, CELL - 4, CELL - 4, 6);
      ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#25301a';
        const ex = p.x * CELL,ey = p.y * CELL;
        ctx.beginPath();ctx.arc(ex + 8, ey + 9, 2, 0, 7);ctx.fill();
        ctx.beginPath();ctx.arc(ex + 14, ey + 9, 2, 0, 7);ctx.fill();
      }
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  React.useEffect(() => {
    if (!running) return;
    reset();
    placeFood();
    draw();
    const handleKey = (e) => {
      const s = stateRef.current;
      if (!s) return;
      const k = e.key;
      if ((k === 'ArrowUp' || k === 'w') && s.dir.y === 0) s.nextDir = { x: 0, y: -1 };else
      if ((k === 'ArrowDown' || k === 's') && s.dir.y === 0) s.nextDir = { x: 0, y: 1 };else
      if ((k === 'ArrowLeft' || k === 'a') && s.dir.x === 0) s.nextDir = { x: -1, y: 0 };else
      if ((k === 'ArrowRight' || k === 'd') && s.dir.x === 0) s.nextDir = { x: 1, y: 0 };
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    const tick = setInterval(() => {
      const s = stateRef.current;
      s.dir = s.nextDir;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
      s.snake.some((p) => p.x === head.x && p.y === head.y)) {
        clearInterval(tick);
        window.removeEventListener('keydown', handleKey);
        setOver(true);
        setRunning(false);
        setBest((b) => Math.max(b, scoreRef.current));
        return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        placeFood();
      } else {
        s.snake.pop();
      }
      draw();
    }, 130);
    return () => {clearInterval(tick);window.removeEventListener('keydown', handleKey);};
  }, [running]);

  const scoreRef = React.useRef(0);
  React.useEffect(() => {scoreRef.current = score;}, [score]);

  function start() {
    scoreRef.current = 0;
    setRunning(true);
  }

  return (
    <div className="snake-wrap">
      <div className="snake-top">
        <div className="snake-score">分數 <b>{score}</b></div>
        <div className="snake-score" style={{ fontSize: '14px', color: '#9db380' }}>最高 {best}</div>
      </div>
      <canvas
        ref={canvasRef}
        className="snake-canvas"
        width={GRID * CELL}
        height={GRID * CELL}>
      </canvas>
      {over && <div className="snake-over">遊戲結束！得分 {score} — 再玩一次？</div>}
      {!running ?
      <button className="btn btn-orange" onClick={start}>▶ {over ? '再玩一次' : '開始遊戲'}</button> :
      <div className="snake-hint">用方向鍵 ↑ ↓ ← → 控制蛇的移動</div>}
    </div>);

}

window.QuizQuestion = QuizQuestion;
window.SnakeGame = SnakeGame;