/* ---------- Elements ---------- */
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDEl = document.getElementById('scoreD');
const btnNew = document.getElementById('btnNew');
const btnResetScores = document.getElementById('btnResetScores');
const btnPVP = document.getElementById('btnPVP');
const btnAI = document.getElementById('btnAI');

/* ---------- State ---------- */
let board = Array(9).fill(null); // 'X' | 'O' | null
let current = 'X';
let over = false;
let vsAI = false;

const WINS = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diags
];

/* ---------- Init ---------- */
makeBoard();
hydrateScores();
reset(false);

/* Build board cells */
function makeBoard(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const c = document.createElement('button');
    c.className = 'cell';
    c.dataset.idx = i;
    c.setAttribute('aria-label', `Cell ${i+1}`);
    c.addEventListener('click', onCell);
    boardEl.appendChild(c);
  }
}

/* ---------- UI helpers ---------- */
function setStatus(html){ statusEl.innerHTML = html; }

function updateCells(){
  [...boardEl.children].forEach((el, i)=>{
    const v = board[i];
    el.textContent = v ? v : '';
    el.classList.remove('x','o');
    if(v) el.classList.add(v.toLowerCase());
    el.disabled = !!v || over;
  });
}

/* Splash flash */
function flashBoard(){
  [...boardEl.children].forEach((el)=>{
    el.classList.add('win');
    setTimeout(()=>el.classList.remove('win'), 360);
  });
}

/* ---------- Game flow ---------- */
function reset(highlight=true){
  board = Array(9).fill(null);
  current = 'X';
  over = false;
  setStatus(`Player <span class="x">X</span> to move`);
  updateCells();
  if(highlight) flashBoard();
}

function onCell(e){
  const i = Number(e.currentTarget.dataset.idx);
  if(board[i] || over) return;

  board[i] = current;
  updateCells();

  const res = checkResult(board);
  if(res) return handleResult(res);

  current = current === 'X' ? 'O' : 'X';
  setStatus(`Player <span class="${current==='X'?'x':'o'}">${current}</span> to move`);

  if(vsAI && current === 'O'){
    // small delay for natural feel
    setTimeout(aiMove, 260);
  }
}

function handleResult(res){
  over = true;

  if(res.winner){
    res.line.forEach(i => boardEl.children[i].classList.add('win'));
    setStatus(`Player <span class="${res.winner==='X'?'x':'o'}">${res.winner}</span> wins!`);
    bumpScore(res.winner);
    confetti();
  } else {
    setStatus(`It’s a draw!`);
    bumpScore('D');
  }

  // lock remaining cells
  [...boardEl.children].forEach(el => el.disabled = true);
}

function checkResult(b){
  for(const line of WINS){
    const [a,bb,c] = line;
    if(b[a] && b[a] === b[bb] && b[a] === b[c]) return { winner: b[a], line };
  }
  if(b.every(Boolean)) return { winner: null, line: [] };
  return null;
}

/* ---------- AI (Minimax - Unbeatable) ---------- */
function aiMove(){
  const best = bestMove(board, 'O');
  if(best.index != null){
    board[best.index] = 'O';
    updateCells();
    const res = checkResult(board);
    if(res) return handleResult(res);
    current = 'X';
    setStatus(`Player <span class="x">X</span> to move`);
  }
}

function bestMove(b, me){
  const res = checkResult(b);
  if(res && res.winner === me) return { score: 10 };
  if(res && res.winner && res.winner !== me) return { score: -10 };
  if(res && res.winner === null) return { score: 0 };

  let best = { score: -Infinity, index: null };
  for(let i=0;i<9;i++){
    if(!b[i]){
      b[i] = me;
      const move = minimax(b, false, me);
      b[i] = null;
      if(move.score > best.score) best = { score: move.score, index: i };
    }
  }
  return best;
}

function minimax(b, isMax, maximizer){
  const res = checkResult(b);
  if(res){
    if(res.winner === maximizer) return { score: 10 };
    if(res.winner === null) return { score: 0 };
    return { score: -10 };
  }

  const player = isMax ? maximizer : (maximizer === 'X' ? 'O' : 'X');
  let best = isMax ? { score: -Infinity } : { score: Infinity };

  for(let i=0;i<9;i++){
    if(!b[i]){
      b[i] = player;
      const next = minimax(b, !isMax, maximizer);
      b[i] = null;
      if(isMax){
        if(next.score > best.score) best = { score: next.score, index: i };
      } else {
        if(next.score < best.score) best = { score: next.score, index: i };
      }
    }
  }
  return best;
}

/* ---------- Scores (with localStorage) ---------- */
function hydrateScores(){
  const s = JSON.parse(localStorage.getItem('t3-scores') || '{"X":0,"O":0,"D":0}');
  scoreXEl.textContent = s.X; scoreOEl.textContent = s.O; scoreDEl.textContent = s.D;
}
function writeScores(){
  const s = { X: +scoreXEl.textContent, O: +scoreOEl.textContent, D: +scoreDEl.textContent };
  localStorage.setItem('t3-scores', JSON.stringify(s));
}
function bumpScore(which){
  if(which === 'X') scoreXEl.textContent = +scoreXEl.textContent + 1;
  else if(which === 'O') scoreOEl.textContent = +scoreOEl.textContent + 1;
  else scoreDEl.textContent = +scoreDEl.textContent + 1;
  writeScores();
}

/* ---------- Confetti ---------- */
const confettiCanvas = document.getElementById('confetti');
const ctx = confettiCanvas.getContext('2d');
function sizeCanvas(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
addEventListener('resize', sizeCanvas, { passive:true }); sizeCanvas();

let confettiRunning = false;
function confetti(){
  if(confettiRunning) return; confettiRunning = true;
  const n = 140;
  const pieces = Array.from({length:n}, ()=>({
    x: Math.random()*confettiCanvas.width,
    y: -20 - Math.random()*confettiCanvas.height*0.4,
    w: 8 + Math.random()*10,
    h: 10 + Math.random()*16,
    s: 2 + Math.random()*3,
    rot: Math.random()*Math.PI,
    vr: (Math.random()-.5)*0.25,
    col: Math.floor(Math.random()*5)
  }));
  const cols = ['#ff6a4a','#ffd54a','#69b0ff','#b489ff','#4cffc3'];
  let t = 0, max = 1600;

  function step(){
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    for(const p of pieces){
      p.y += p.s; p.x += Math.sin((p.y+p.w)/40)*1.2; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle = cols[p.col];
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    }
    t += 16; if(t < max) requestAnimationFrame(step); else confettiRunning = false;
  }
  requestAnimationFrame(step);
}

/* ---------- Controls ---------- */
btnNew.addEventListener('click', ()=>{ reset(); });
btnResetScores.addEventListener('click', ()=>{
  scoreXEl.textContent = 0; scoreOEl.textContent = 0; scoreDEl.textContent = 0; writeScores();
});

btnPVP.addEventListener('click', ()=>{
  vsAI = false;
  btnPVP.classList.add('active');
  btnAI.classList.remove('active');
  reset(false);
});

btnAI.addEventListener('click', ()=>{
  vsAI = true;
  btnAI.classList.add('active');
  btnPVP.classList.remove('active');
  reset(false);
  if(current === 'O') aiMove();
});
