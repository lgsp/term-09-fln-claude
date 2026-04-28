const R4 = v => isFinite(v) ? Math.round(v*10000)/10000 : (v>0?'+∞':'-∞');

// ── GRAPH HELPERS ────────────────────────────────────
function setupCanvas(id, H=280) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 880;
  canvas.width = W; canvas.height = H;
  return { ctx, W, H };
}

function makeGrid(ctx, W, H, xmin, xmax, ymin, ymax, pad) {
  const gW = W-pad.l-pad.r, gH = H-pad.t-pad.b;
  const toX = x => pad.l + (x-xmin)/(xmax-xmin)*gW;
  const toY = y => pad.t + gH - (y-ymin)/(ymax-ymin)*gH;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#192218'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = 'rgba(36,48,32,0.9)'; ctx.lineWidth = 0.8;
  for (let gx = Math.ceil(xmin); gx <= Math.floor(xmax); gx++) {
    const x = toX(gx); ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,pad.t+gH); ctx.stroke();
    if (gx!==0) { ctx.fillStyle='#4a5a42'; ctx.font='9px Space Mono,monospace'; ctx.fillText(gx,x-4,pad.t+gH+12); }
  }
  for (let gy = Math.ceil(ymin); gy <= Math.floor(ymax); gy++) {
    const y = toY(gy); ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+gW,y); ctx.stroke();
    if (gy!==0) { ctx.fillStyle='#4a5a42'; ctx.font='9px Space Mono,monospace'; ctx.fillText(gy,2,y+3); }
  }
  if (ymin<0&&ymax>0) { const y0=toY(0); ctx.strokeStyle='rgba(140,204,32,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pad.l,y0); ctx.lineTo(pad.l+gW,y0); ctx.stroke(); }
  if (xmin<0&&xmax>0) { const x0=toX(0); ctx.strokeStyle='rgba(140,204,32,0.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,pad.t); ctx.lineTo(x0,pad.t+gH); ctx.stroke(); }
  return { toX, toY, gW, gH };
}

function drawCurve(ctx, pts, toX, toY, color, lw=2) {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); let pen = true;
  pts.forEach(p => {
    if (!p) { pen = true; return; }
    const px = toX(p.x), py = toY(p.y);
    pen ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    pen = false;
  });
  ctx.stroke();
}

function sampleF(f, xmin, xmax, N, yClamp=25) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = xmin + i/N*(xmax-xmin);
    try { const y = f(x); pts.push(isFinite(y) && Math.abs(y)<yClamp ? {x,y} : null); }
    catch { pts.push(null); }
  }
  return pts;
}

// ── GRAPH 1 : ln(x) ──────────────────────────────────
function drawLnGraph() {
  const g = setupCanvas('canvas-ln', 300); if (!g) return;
  const { ctx, W, H } = g;
  const fname = document.getElementById('gf-func').value;
  const xmax  = +document.getElementById('gf-xmax').value || 6;
  const xmin = -0.5, pad = {l:40,r:20,t:18,b:32};

  const fns = {
    ln:          [{ f:x=>x>0?Math.log(x):NaN,          c:'#8acc20', lbl:'ln(x)' }],
    ln_exp:      [{ f:x=>x>0?Math.log(x):NaN,          c:'#8acc20', lbl:'ln(x)' },
                  { f:x=>Math.exp(x),                   c:'#d0aa20', lbl:'e^x' }],
    ln_variants: [{ f:x=>x>0?Math.log(x):NaN,          c:'#8acc20', lbl:'ln(x)' },
                  { f:x=>x>0?Math.log(2*x):NaN,         c:'#40b0d8', lbl:'ln(2x)' },
                  { f:x=>x>0?2*Math.log(x):NaN,         c:'#b060e0', lbl:'ln(x²)=2ln(x)' }],
    xlnx:        [{ f:x=>x>0?x*Math.log(x):NaN,        c:'#8acc20', lbl:'x·ln(x)' }],
    lnx_x:       [{ f:x=>x>0?Math.log(x)/x:NaN,        c:'#8acc20', lbl:'ln(x)/x' }],
  };
  const curves = fns[fname] || fns.ln;

  const allPts = curves.flatMap(c => sampleF(c.f, 0.01, xmax, W*2));
  const validY = allPts.filter(Boolean).map(p=>p.y);
  const ymin = Math.max(-6, Math.min(...validY,-0.5)-0.3);
  const ymax = Math.min(8, Math.max(...validY,0.5)+0.3);

  const { toX, toY } = makeGrid(ctx, W, H, xmin, xmax, ymin, ymax, pad);

  // y=x diagonal (for ln_exp)
  if (fname === 'ln_exp') {
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(toX(xmin),toY(xmin)); ctx.lineTo(toX(xmax),toY(xmax)); ctx.stroke();
    ctx.setLineDash([]);
  }

  curves.forEach(c => {
    const pts = sampleF(c.f, 0.001, xmax, W*3);
    drawCurve(ctx, pts, toX, toY, c.c, 2.2);
  });

  // AV x=0
  ctx.strokeStyle='rgba(176,96,224,0.4)'; ctx.lineWidth=1.2; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(toX(0),pad.t); ctx.lineTo(toX(0),pad.t+(H-pad.t-pad.b)); ctx.stroke();
  ctx.setLineDash([]);

  // Points remarquables
  [[1,0,'#8acc20','(1,0)'],[Math.E,1,'#d0aa20','(e,1)']].forEach(([x,y,col,lbl]) => {
    try {
      const px=toX(x), py=toY(y);
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(px,py,4,0,2*Math.PI); ctx.fill();
      ctx.fillStyle=col; ctx.font='10px Space Mono,monospace'; ctx.fillText(lbl,px+5,py-4);
    } catch {}
  });

  // Legend
  ctx.font='bold 10px Space Mono,monospace';
  curves.forEach((c,i)=>{ ctx.fillStyle=c.c; ctx.fillText(c.lbl, pad.l+4, pad.t+14+i*14); });
}
window.addEventListener('resize', drawLnGraph);
setTimeout(drawLnGraph, 100);

// ── GRAPH 2 : croissance comparée ────────────────────
function drawCompGraph() {
  const g = setupCanvas('canvas-comp', 300); if (!g) return;
  const { ctx, W, H } = g;
  const n = +document.getElementById('gc-n').value || 2;
  const xmax = +document.getElementById('gc-xmax').value || 4;
  const xmin = 0.1, pad = {l:40,r:20,t:18,b:32};

  const curves = [
    { f:x=>Math.log(x),   c:'#8acc20', lbl:`ln(x)` },
    { f:x=>Math.pow(x,n), c:'#40b0d8', lbl:`x^${n}` },
    { f:x=>Math.exp(x),   c:'#d0aa20', lbl:'e^x' },
  ];
  const allPts = curves.flatMap(c => sampleF(c.f, xmin, xmax, W*2, 30));
  const validY = allPts.filter(Boolean).map(p=>p.y);
  const ymin = Math.max(-3, Math.min(...validY,-0.3)), ymax = Math.min(25, Math.max(...validY,0.3));

  const { toX, toY } = makeGrid(ctx, W, H, xmin, xmax, ymin, ymax, pad);
  curves.forEach(c => drawCurve(ctx, sampleF(c.f,xmin,xmax,W*3,ymax+1), toX, toY, c.c, 2));
  ctx.font='bold 10px Space Mono,monospace';
  curves.forEach((c,i) => { ctx.fillStyle=c.c; ctx.fillText(c.lbl, pad.l+4, pad.t+14+i*14); });
}
window.addEventListener('resize', drawCompGraph);
setTimeout(drawCompGraph, 120);

// ── GRAPH 3 : étude complète ──────────────────────────
const ETUDE_FNS = {
  xlnx:     { f:x=>x>0?x*Math.log(x):NaN,      fp:x=>Math.log(x)+1,            fpp:x=>1/x,             xmin:0.01,xmax:3   },
  lnx_x:    { f:x=>x>0?Math.log(x)/x:NaN,       fp:x=>(1-Math.log(x))/x**2,    fpp:x=>(2*Math.log(x)-3)/x**3, xmin:0.1,xmax:8 },
  x2lnx:    { f:x=>x>0?x**2*Math.log(x):NaN,    fp:x=>x*(2*Math.log(x)+1),     fpp:x=>2*Math.log(x)+3,  xmin:0.01,xmax:3  },
  lnx_sq:   { f:x=>x>0?Math.log(x)**2:NaN,      fp:x=>2*Math.log(x)/x,         fpp:x=>2*(1-Math.log(x))/x**2, xmin:0.1,xmax:8 },
  xm1_lnx:  { f:x=>x>0?((x-1)*Math.log(x)):NaN, fp:x=>Math.log(x)+(x-1)/x,    fpp:x=>2/x-1/x**2,       xmin:0.1,xmax:4   },
};
function drawEtudeGraph() {
  const g = setupCanvas('canvas-etude', 320); if (!g) return;
  const { ctx, W, H } = g;
  const key = document.getElementById('ge-func').value;
  const d = ETUDE_FNS[key] || ETUDE_FNS.xlnx;
  const { f, fp, fpp, xmin, xmax } = d;
  const showF   = document.getElementById('ge-f').checked;
  const showFp  = document.getElementById('ge-fp').checked;
  const showFpp = document.getElementById('ge-f2').checked;
  const pad = {l:40,r:20,t:18,b:32};

  const ptsF   = sampleF(f,   xmin, xmax, W*3);
  const ptsFp  = sampleF(fp,  xmin, xmax, W*3);
  const ptsFpp = sampleF(fpp, xmin, xmax, W*3);
  const all = [...(showF?ptsF:[]),...(showFp?ptsFp:[]),...(showFpp?ptsFpp:[])].filter(Boolean);
  if (!all.length) return;
  const ys = all.map(p=>p.y);
  const ymin = Math.max(-8, Math.min(...ys)-0.3), ymax = Math.min(8, Math.max(...ys)+0.3);

  const { toX, toY } = makeGrid(ctx, W, H, xmin, xmax, ymin, ymax, pad);
  if (showFpp) drawCurve(ctx, ptsFpp, toX, toY, 'rgba(176,96,224,0.7)', 1.5);
  if (showFp)  drawCurve(ctx, ptsFp,  toX, toY, 'rgba(64,176,216,0.85)', 1.8);
  if (showF)   drawCurve(ctx, ptsF,   toX, toY, '#8acc20', 2.2);

  ctx.font='bold 10px Space Mono,monospace';
  if (showF)   { ctx.fillStyle='#8acc20';           ctx.fillText('f',  pad.l+4, pad.t+14); }
  if (showFp)  { ctx.fillStyle='rgba(64,176,216,0.85)'; ctx.fillText("f'", pad.l+4, pad.t+28); }
  if (showFpp) { ctx.fillStyle='rgba(176,96,224,0.7)'; ctx.fillText("f''",pad.l+4, pad.t+42); }
}
window.addEventListener('resize', drawEtudeGraph);
setTimeout(drawEtudeGraph, 140);

// ── CALCULATEURS ─────────────────────────────────────
// Algébrique
const algParam = {
  ln_ab:   [{id:'ab-a',lbl:'a=',v:2},{id:'ab-b',lbl:'b=',v:3}],
  ln_an:   [{id:'an-a',lbl:'a=',v:2},{id:'an-n',lbl:'n=',v:3}],
  eq1:     [{id:'eq1-k',lbl:'k=',v:1}],
  eq2:     [],
  ineq:    [],
};
function buildAlgParams() {
  const key = document.getElementById('alg-func').value;
  const div = document.getElementById('alg-params');
  const ps  = algParam[key] || [];
  div.innerHTML = ps.map(p=>`<label>${p.lbl}<input type="number" id="${p.id}" value="${p.v}" step="0.1" style="width:70px;background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:0.27rem 0.44rem;font-family:var(--font-m);font-size:0.82rem;" oninput="calcAlgebra()"></label>`).join('');
  calcAlgebra();
}
function calcAlgebra() {
  const key = document.getElementById('alg-func').value;
  const g   = id => +(document.getElementById(id)||{value:0}).value;
  const el  = document.getElementById('alg-res');
  let res = '';
  switch(key) {
    case 'ln_ab': {
      const a=g('ab-a'), b=g('ab-b');
      if (a<=0||b<=0){res='a et b doivent être > 0';break;}
      res = `ln(${a}×${b}) = ln(${a})+ln(${b}) = ${R4(Math.log(a))}+${R4(Math.log(b))} = ${R4(Math.log(a*b))}`;
      break;
    }
    case 'ln_an': {
      const a=g('an-a'), n=g('an-n');
      if (a<=0){res='a doit être > 0';break;}
      res = `ln(${a}^${n}) = ${n}×ln(${a}) = ${n}×${R4(Math.log(a))} = ${R4(n*Math.log(a))}`;
      break;
    }
    case 'eq1': {
      const k=g('eq1-k');
      const x=Math.exp(k);
      res = `ln(x) = ${k}  →  x = e^${k} = ${R4(x)}`;
      break;
    }
    case 'eq2':
      res = `2ln(x) - ln(x+1) = 0  →  ln(x²) = ln(x+1)  →  x²=x+1  →  x=(1+√5)/2 ≈ ${R4((1+Math.sqrt(5))/2)} (x>0)`;
      break;
    case 'ineq':
      res = `ln(x) > 1  →  x > e  →  solution : x ∈ ]e ; +∞[ ≈ ]${R4(Math.E)} ; +∞[`;
      break;
  }
  el.textContent = res;
  if (window.MathJax) MathJax.typeset([el]);
}
document.getElementById('alg-func').addEventListener('change', buildAlgParams);
buildAlgParams();

// Dérivée
function calcDeriv() {
  const key = document.getElementById('der-func').value;
  const x0  = +document.getElementById('der-x').value;
  const el  = document.getElementById('der-res');
  const fns = {
    ln3x1:     { f:x=>Math.log(3*x+1),      fp:x=>3/(3*x+1),              s:'ln(3x+1)', sp:"3/(3x+1)" },
    lnx2p1:    { f:x=>Math.log(x*x+1),      fp:x=>2*x/(x*x+1),            s:'ln(x²+1)', sp:"2x/(x²+1)" },
    xlnx:      { f:x=>x*Math.log(x),         fp:x=>Math.log(x)+1,          s:'x·ln(x)',  sp:"ln(x)+1" },
    lnx_x:     { f:x=>Math.log(x)/x,         fp:x=>(1-Math.log(x))/x**2,   s:'ln(x)/x',  sp:"(1−ln x)/x²" },
    lnlnx:     { f:x=>Math.log(Math.log(x)), fp:x=>1/(x*Math.log(x)),      s:'ln(ln x)', sp:"1/(x·ln x)" },
    sqrt_lnx:  { f:x=>Math.sqrt(Math.log(x)),fp:x=>1/(2*x*Math.sqrt(Math.log(x))), s:'√(ln x)', sp:"1/(2x√(ln x))" },
    ln_abs_cos:{ f:x=>Math.log(Math.abs(Math.cos(x))), fp:x=>-Math.tan(x), s:'ln|cos x|', sp:"−tan(x)" },
    xp2_lnx:   { f:x=>x>1?(x+2)*Math.log(x-1):NaN, fp:x=>Math.log(x-1)+(x+2)/(x-1), s:'(x+2)·ln(x−1)', sp:"ln(x−1)+(x+2)/(x−1)" },
  };
  const d = fns[key]; if (!d) return;
  try {
    const fx=d.f(x0), fpx=d.fp(x0);
    el.innerHTML=`\\(f(x)=${d.s}\\)  en \\(x=${x0}\\) :<br>\\(f'(x)=${d.sp}\\)<br>\\(f(${x0})=${R4(fx)}\\), \\(f'(${x0})=${R4(fpx)}\\)`;
    if (window.MathJax) MathJax.typeset([el]);
  } catch { el.textContent = 'Valeur hors domaine'; }
}
calcDeriv();

// ── PYODIDE ──────────────────────────────────────────
let pyodide=null,pyoLoad=false;
const origC={};
document.querySelectorAll('.py-code').forEach(ta=>{origC[ta.id]=ta.value;});
async function loadPyo(){
  if(pyodide)return true;if(pyoLoad)return false;pyoLoad=true;
  const st=document.getElementById('py-status');st.textContent='⏳ Chargement Python…';
  try{
    const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
    document.head.appendChild(s);await new Promise((res,rej)=>{s.onload=res;s.onerror=rej;});
    pyodide=await window.loadPyodide();
    st.textContent='✓ Python prêt';st.classList.add('ready');setTimeout(()=>st.classList.add('hidden'),3000);return true;
  }catch(e){st.textContent='✗ Erreur Python';return false;}
}
async function runPy(id){
  const code=document.getElementById(id+'-code').value;
  const out=document.getElementById(id+'-out');
  out.className='py-out active';out.textContent='⏳ Exécution…';out.style.color='#888';
  const ok=await loadPyo();
  if(!ok){out.className='py-out active error';out.textContent='Python non disponible.';return;}
  try{let stdout='';pyodide.setStdout({batched:s=>stdout+=s+'\n'});await pyodide.runPythonAsync(code);out.className='py-out active';out.style.color='#a6e3a1';out.textContent=stdout||'(aucune sortie)';}
  catch(e){out.className='py-out active error';out.textContent='⚠ '+e.message;}
}
function dlPy(id){const code=document.getElementById(id+'-code').value;const fname=document.getElementById(id+'-code').closest('.py-block').querySelector('.py-title').textContent.trim();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'}));a.download=fname;a.click();}
function rstPy(id){document.getElementById(id+'-code').value=origC[id+'-code'];const out=document.getElementById(id+'-out');out.className='py-out';out.textContent='';}

// ── QCM ──────────────────────────────────────────────
const allQ=[
  {q:"\\(\\ln(e^3)\\) vaut :",
   opts:["\\(e^3\\)","\\(3\\)","\\(3e\\)","\\(\\ln 3\\)"],ans:1,
   exp:"Par définition de la réciproque : \\(\\ln(e^y)=y\\), donc \\(\\ln(e^3)=3\\)."},
  {q:"\\(\\ln\\!\\left(\\frac{1}{e^2}\\right)\\) vaut :",
   opts:["\\(2\\)","\\(-2\\)","\\(1/e^2\\)","\\(e^{-2}\\)"],ans:1,
   exp:"\\(\\ln(1/e^2)=\\ln(e^{-2})=-2\\)."},
  {q:"\\(\\ln(6) =\\)",
   opts:["\\(\\ln 2 + \\ln 3\\)","\\(\\ln 2 \\times \\ln 3\\)","\\(\\ln 5 + 1\\)","\\(6\\)"],ans:0,
   exp:"\\(\\ln(ab)=\\ln a+\\ln b\\), donc \\(\\ln 6=\\ln(2\\times3)=\\ln 2+\\ln 3\\)."},
  {q:"La dérivée de \\(f(x)=\\ln(x^2+1)\\) est :",
   opts:["\\(\\frac{1}{x^2+1}\\)","\\(\\frac{2x}{x^2+1}\\)","\\(\\frac{x}{x^2+1}\\)","\\(2x\\ln(x^2+1)\\)"],ans:1,
   exp:"\\(u=x^2+1\\), \\(u'=2x\\) → \\((\\ln u)'=u'/u=2x/(x^2+1)\\)."},
  {q:"\\(\\displaystyle\\lim_{x\\to+\\infty}\\frac{\\ln x}{x}=\\)",
   opts:["\\(+\\infty\\)","\\(1\\)","\\(0\\)","\\(-\\infty\\)"],ans:2,
   exp:"Croissance comparée : \\(x\\) l'emporte sur \\(\\ln x\\) en \\(+\\infty\\), donc \\(\\ln x/x\\to 0\\)."},
  {q:"\\(\\displaystyle\\lim_{x\\to 0^+}x\\ln x=\\)",
   opts:["\\(-\\infty\\)","\\(0\\)","\\(1\\)","\\(+\\infty\\)"],ans:1,
   exp:"\\(x\\to 0^+\\) plus vite que \\(\\ln x\\to-\\infty\\). Par substitution \\(t=-\\ln x\\) : \\(x\\ln x=-te^{-t}\\to 0\\)."},
  {q:"La fonction \\(f(x)=x\\ln x\\) atteint son minimum en :",
   opts:["\\(x=0\\)","\\(x=1\\)","\\(x=1/e\\)","\\(x=e\\)"],ans:2,
   exp:"\\(f'(x)=\\ln x+1=0\\Leftrightarrow x=e^{-1}=1/e\\). \\(f(1/e)=-1/e\\approx-0{,}368\\)."},
  {q:"L'inégalité fondamentale \\(\\ln x\\leq x-1\\) est vraie :",
   opts:["Seulement pour \\(x\\geq 1\\)","Pour tout \\(x>0\\)","Seulement pour \\(0<x<1\\)","Pour tout \\(x\\in\\mathbb{R}\\)"],ans:1,
   exp:"\\(h(x)=x-1-\\ln x\\) a un minimum en \\(x=1\\) avec \\(h(1)=0\\geq 0\\). Donc \\(\\ln x\\leq x-1\\) pour tout \\(x>0\\)."},
  {q:"\\(e^{2\\ln 3}\\) vaut :",
   opts:["\\(6\\)","\\(3^2=9\\)","\\(2e^3\\)","\\(\\ln 9\\)"],ans:1,
   exp:"\\(e^{2\\ln 3}=e^{\\ln 3^2}=3^2=9\\)."},
  {q:"La dérivée de \\(f(x)=\\ln(\\cos x)\\) est :",
   opts:["\\(-\\tan x\\)","\\(1/\\cos x\\)","\\(-\\sin x/\\cos^2 x\\)","\\(\\cos x\\)"],ans:0,
   exp:"\\(u=\\cos x\\), \\(u'=-\\sin x\\) → \\((\\ln u)'=u'/u=-\\sin x/\\cos x=-\\tan x\\)."},
  {q:"\\(\\log_2(8)\\) vaut :",
   opts:["\\(4\\)","\\(2\\)","\\(3\\)","\\(\\ln 8\\)"],ans:2,
   exp:"\\(\\log_2(8)=\\log_2(2^3)=3\\). En effet \\(2^3=8\\)."},
  {q:"Pour \\(g(x)=\\ln(x)/x\\), le maximum est atteint en \\(x=\\) :",
   opts:["\\(1\\)","\\(e\\)","\\(\\ln e\\)","\\(1/e\\)"],ans:1,
   exp:"\\(g'(x)=(1-\\ln x)/x^2=0\\Leftrightarrow\\ln x=1\\Leftrightarrow x=e\\). Maximum : \\(g(e)=1/e\\)."},
];

let curQ=[],answered={},cSec=0,cPaused=false,cIntv=null;
function shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function pad2(n){return String(n).padStart(2,'0');}
function newQCM(){answered={};curQ=shuf(allQ).slice(0,8);document.getElementById('qcm-r').classList.remove('active');document.getElementById('sc-v').textContent='0 / 0';resetC();startC();renderQ();}
function renderQ(){
  const c=document.getElementById('qcm-c');
  c.innerHTML=curQ.map((q,qi)=>`
    <div class="qcm-q" id="qq-${qi}">
      <div class="qcm-question">${qi+1}. ${q.q}</div>
      <div class="qcm-opts">
        ${q.opts.map((o,oi)=>`
          <div class="qcm-opt" id="opt-${qi}-${oi}" onclick="selO(${qi},${oi})">
            <span class="opt-l">${String.fromCharCode(65+oi)}</span><span>${o}</span>
          </div>`).join('')}
      </div>
      <div class="qcm-fb" id="fb-${qi}"></div>
    </div>`).join('');
  if(window.MathJax)MathJax.typeset([c]);
}
function selO(qi,oi){if(answered[qi]!==undefined)return;document.querySelectorAll(`#qq-${qi} .qcm-opt`).forEach(e=>e.classList.remove('selected'));document.getElementById(`opt-${qi}-${oi}`).classList.add('selected');answered[qi]=oi;}
function submitQCM(){
  let sc=0,tot=curQ.length;
  curQ.forEach((q,qi)=>{
    const ch=answered[qi];
    const qEl=document.getElementById(`qq-${qi}`),fb=document.getElementById(`fb-${qi}`);
    q.opts.forEach((_,oi)=>{const el=document.getElementById(`opt-${qi}-${oi}`);el.classList.add('disabled');if(oi===q.ans)el.classList.add('correct');if(ch===oi&&ch!==q.ans)el.classList.add('wrong');});
    if(ch===q.ans){sc++;qEl.classList.add('correct');fb.innerHTML=`✓ Correct ! ${q.exp}`;}
    else{qEl.classList.add('wrong');fb.innerHTML=`✗ ${ch===undefined?'Non répondu. ':''}Réponse : <strong>${q.opts[q.ans]}</strong>. ${q.exp}`;}
    fb.classList.add('active');
  });
  document.getElementById('sc-v').textContent=`${sc} / ${tot}`;
  const pct=Math.round(sc/tot*100);
  const msg=pct>=87?'🌿 Excellent — maîtrise parfaite du logarithme !':pct>=62?'🌱 Bien ! Quelques formules à consolider.':'📖 À retravailler — relire les propriétés.';
  document.getElementById('r-sc').textContent=`${sc} / ${tot} — ${pct} %`;
  document.getElementById('r-msg').textContent=msg;
  document.getElementById('qcm-r').classList.add('active');
  if(window.MathJax)MathJax.typeset([document.getElementById('qcm-r'),document.getElementById('qcm-c')]);
  stopC();
}
function startC(){stopC();cPaused=false;document.getElementById('btn-c').textContent='Pause';cIntv=setInterval(()=>{if(!cPaused){cSec++;document.getElementById('c-d').textContent=`${pad2(Math.floor(cSec/60))}:${pad2(cSec%60)}`;}},1000);}
function stopC(){clearInterval(cIntv);cIntv=null;}
function resetC(){stopC();cSec=0;cPaused=false;document.getElementById('c-d').textContent='00:00';document.getElementById('btn-c').textContent='Pause';}
function toggleC(){cPaused=!cPaused;document.getElementById('btn-c').textContent=cPaused?'Reprendre':'Pause';}
newQCM();

// ── SCROLL REVEAL & NAV ──────────────────────────────
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.07});
document.querySelectorAll('section').forEach(s=>io.observe(s));
const navLinks=document.querySelectorAll('nav a');
window.addEventListener('scroll',()=>{let cur='';document.querySelectorAll('main section').forEach(s=>{if(window.scrollY>=s.offsetTop-130)cur=s.id;});navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));},{passive:true});