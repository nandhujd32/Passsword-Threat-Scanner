/* ================= animated circuit backdrop ================= */
(function(){
  const svg = document.getElementById('circuitBg');
  const W=1200,H=900;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const ns='http://www.w3.org/2000/svg';
  const paths = [
    "M0,120 H260 V300 H520 V80 H900 V260 H1200",
    "M0,520 H180 V680 H460 V440 H760 V620 H1200",
    "M120,0 V180 H360 V420",
    "M980,0 V220 H1120 V520",
    "M0,820 H320 V700 H640 V860 H1000 V740 H1200",
    "M640,900 V680 H840 V860"
  ];
  paths.forEach((d,i)=>{
    const p = document.createElementNS(ns,'path');
    p.setAttribute('d',d);
    p.setAttribute('fill','none');
    p.setAttribute('stroke','rgba(56,189,248,0.16)');
    p.setAttribute('stroke-width','1.5');
    svg.appendChild(p);

    // traveling pulse
    const dot = document.createElementNS(ns,'circle');
    dot.setAttribute('r','3');
    dot.setAttribute('fill', i%2===0 ? '#38BDF8' : '#FF4B5C');
    dot.setAttribute('opacity','0.9');
    const anim = document.createElementNS(ns,'animateMotion');
    anim.setAttribute('dur', (7+i*1.6)+'s');
    anim.setAttribute('repeatCount','indefinite');
    anim.setAttribute('path', d);
    const fade = document.createElementNS(ns,'animate');
    fade.setAttribute('attributeName','opacity');
    fade.setAttribute('values','0;1;1;0');
    fade.setAttribute('keyTimes','0;0.05;0.9;1');
    fade.setAttribute('dur', (7+i*1.6)+'s');
    fade.setAttribute('repeatCount','indefinite');
    dot.appendChild(anim);
    dot.appendChild(fade);
    svg.appendChild(dot);
  });
  // node glows at a few junctions
  const nodes = [[260,120],[520,300],[900,80],[180,520],[460,680],[760,440],[1120,220],[320,820],[840,860]];
  nodes.forEach((n,i)=>{
    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx',n[0]); c.setAttribute('cy',n[1]); c.setAttribute('r','3');
    c.setAttribute('fill','#38BDF8'); c.setAttribute('opacity','0.5');
    c.style.animation = `pulse-node ${2+ (i%3)}s ease-in-out infinite`;
    c.style.animationDelay = (i*0.3)+'s';
    svg.appendChild(c);
  });
  const style = document.createElement('style');
  style.textContent = `@keyframes pulse-node{0%,100%{opacity:0.2;}50%{opacity:0.9;}}`;
  document.head.appendChild(style);
})();

/* ================= scoring engine ================= */
const COMMON_PASSWORDS = new Set([
  "password","123456","123456789","qwerty","111111","abc123","password1",
  "12345678","letmein","monkey","football","iloveyou","admin","welcome",
  "login","princess","dragon","passw0rd","master","hello","freedom",
  "whatever","qazwsx","trustno1","sunshine","superman","shadow"
]);
const KEYBOARD_RUNS = ["qwertyuiop","asdfghjkl","zxcvbnm","1234567890"];
const DICTIONARY = ["love","dragon","master","summer","winter","spring","autumn",
  "football","baseball","princess","monkey","shadow","freedom","secret","dolphin",
  "sunshine","tiger","eagle","phoenix","panther","hunter","angel","cookie","soccer"];

function hasSequential(pw){
  const lower = pw.toLowerCase();
  for(let i=0;i<lower.length-2;i++){
    const a=lower.charCodeAt(i), b=lower.charCodeAt(i+1), c=lower.charCodeAt(i+2);
    if((b-a===1 && c-b===1) || (a-b===1 && b-c===1)) return true;
  }
  return false;
}
function hasKeyboardRun(pw){
  const lower = pw.toLowerCase();
  return KEYBOARD_RUNS.some(run=>{
    for(let i=0;i<=run.length-3;i++){
      const chunk = run.slice(i,i+3);
      if(lower.includes(chunk) || lower.includes(chunk.split('').reverse().join(''))) return true;
    }
    return false;
  });
}
function hasRepeats(pw){ return /(.)\1\1/.test(pw); }
function hasYear(pw){ return /(19|20)\d{2}/.test(pw); }
function hasDictWord(pw){
  const lower = pw.toLowerCase();
  return DICTIONARY.some(w=>lower.includes(w));
}
function classCounts(pw){
  return {
    lower:(pw.match(/[a-z]/g)||[]).length,
    upper:(pw.match(/[A-Z]/g)||[]).length,
    digit:(pw.match(/[0-9]/g)||[]).length,
    symbol:(pw.match(/[^a-zA-Z0-9]/g)||[]).length,
  };
}
function poolSize(pw){
  let pool=0;
  if(/[a-z]/.test(pw)) pool+=26;
  if(/[A-Z]/.test(pw)) pool+=26;
  if(/[0-9]/.test(pw)) pool+=10;
  if(/[^a-zA-Z0-9]/.test(pw)) pool+=32;
  return pool||1;
}
function entropyBits(pw){ return pw ? pw.length*Math.log2(poolSize(pw)) : 0; }

function analyze(pw){
  let bits = entropyBits(pw);
  const flags = [];
  if(pw.length>0 && COMMON_PASSWORDS.has(pw.toLowerCase())){
    bits = Math.min(bits,8);
    flags.push({bad:true, tag:"LEAKED", text:"This exact password appears on known leaked-password lists."});
  } else if(pw.length>0){
    flags.push({bad:false, tag:"CLEAR", text:"Not found among common leaked passwords."});
  }
  if(hasRepeats(pw)){ bits*=0.6; flags.push({bad:true, tag:"REPEAT", text:"Contains 3+ repeated characters in a row (e.g. aaa, 111)."}); }
  if(hasSequential(pw) || hasKeyboardRun(pw)){ bits*=0.7; flags.push({bad:true, tag:"SEQUENCE", text:"Contains a sequential or keyboard-walk pattern (abc, qwerty, 123)."}); }
  if(hasYear(pw)){ flags.push({bad:true, tag:"YEAR", text:"Contains a 4-digit year — a common and easily guessed pattern."}); }
  if(hasDictWord(pw)){ flags.push({bad:true, tag:"DICTIONARY", text:"Contains a plain dictionary word, which shrinks the real search space."}); }
  if(pw.length>0 && pw.length<8){ flags.push({bad:true, tag:"SHORT", text:"Under 8 characters — brute-forceable in seconds on modern hardware."}); }
  if(pw.length>=12 && flags.every(f=>!f.bad)){ flags.push({bad:false, tag:"SOLID", text:"No pattern-based weaknesses detected."}); }

  let score = Math.round(Math.min(100,(bits/80)*100));
  if(pw.length===0) score=0;

  let word,color,sub;
  if(pw.length===0){ word="STANDBY"; color="var(--muted)"; sub="Enter a password below to begin a live scan."; }
  else if(score<25){ word="CRITICAL"; color="var(--red)"; sub="Crackable almost instantly."; }
  else if(score<45){ word="HIGH RISK"; color="var(--red)"; sub="Guessable within hours to days."; }
  else if(score<65){ word="MODERATE"; color="var(--amber)"; sub="Resists casual guessing, not a targeted attack."; }
  else if(score<85){ word="SECURE"; color="var(--green)"; sub="Solid for most personal accounts."; }
  else{ word="FORTIFIED"; color="var(--green)"; sub="Effectively brute-force proof today."; }

  return {bits, score, word, color, sub, flags, counts:classCounts(pw), length:pw.length};
}

/* ================= gauge + verdict render ================= */
const pwInput = document.getElementById('pw');
const arc = document.getElementById('gaugeArc');
const CIRC = 2*Math.PI*78; // ~490.1
const verdictEl = document.getElementById('verdictText');
let lastWord = "STANDBY";

function setGauge(score, colorVar){
  const offset = CIRC * (1 - score/100);
  arc.style.strokeDashoffset = offset;
  arc.style.stroke = colorVar;
  arc.parentElement.style.color = colorVar; // for drop-shadow currentColor
}

function renderComposition(counts, len){
  const el = document.getElementById('compGrid');
  const rows = [["Lowercase a-z",counts.lower],["Uppercase A-Z",counts.upper],["Digits 0-9",counts.digit],["Symbols",counts.symbol]];
  const max = Math.max(1,len);
  el.innerHTML = rows.map(([label,count])=>`
    <div class="comp-label">${label}</div>
    <div class="comp-track"><div class="comp-fill" style="width:${(count/max*100).toFixed(0)}%"></div></div>
    <div class="comp-count">${count}</div>
  `).join('');
}

function formatDuration(seconds){
  if(!isFinite(seconds)) return "effectively never";
  if(seconds<1) return "instantly";
  const YEAR=365.25*24*3600;
  const units=[["millennia",1000*YEAR],["centuries",100*YEAR],["years",YEAR],["days",86400],["hours",3600],["minutes",60],["seconds",1]];
  for(const [name,secs] of units){
    if(seconds>=secs){
      const val=seconds/secs;
      if(name==="millennia" && val>1e6) return "longer than the universe has existed";
      return `${val>=100?Math.round(val).toLocaleString():val.toFixed(val<10?1:0)} ${name}`;
    }
  }
  return "instantly";
}
const SCENARIOS = [
  ["Online, rate-limited login", 100/3600, "100/hour"],
  ["Offline, slow salted hash (bcrypt)", 1e4, "10K/sec"],
  ["Offline, fast unsalted hash (MD5)", 1e10, "10B/sec"],
  ["Consumer GPU rig", 1e11, "100B/sec"],
  ["Nation-state cluster", 1e12, "1T/sec"],
];
function renderCrackTable(bits){
  const guesses = Math.pow(2, Math.max(bits-1,0));
  document.getElementById('crackTable').innerHTML = SCENARIOS.map(([label,rate,rateLabel])=>{
    const t = guesses/rate;
    return `<tr><td>${label}</td><td>${rateLabel}</td><td class="time">${formatDuration(t)}</td></tr>`;
  }).join('');
}
function renderFlags(flags){
  const el = document.getElementById('flagList');
  if(flags.length===0){ el.innerHTML='<div class="flag good"><span class="tagword">—</span>Type a password to run pattern checks.</div>'; return; }
  el.innerHTML = flags.map(f=>`<div class="flag ${f.bad?'bad':'good'}"><span class="tagword">${f.tag}</span>${f.text}</div>`).join('');
}

let lastResult = null;
async function update(){
  const pw = pwInput.value;
  const r = analyze(pw);
  lastResult = r;

  document.getElementById('scoreNum').textContent = r.score;
  document.getElementById('bitsLabel').textContent = `${r.bits.toFixed(1)} BITS`;
  setGauge(r.score, r.color);

  if(r.word !== lastWord){
    verdictEl.textContent = r.word;
    verdictEl.setAttribute('data-text', r.word);
    verdictEl.classList.remove('glitch'); void verdictEl.offsetWidth; verdictEl.classList.add('glitch');
    lastWord = r.word;
  }
  verdictEl.style.color = r.color;
  document.getElementById('verdictSub').textContent = r.sub;

  pwInput.classList.toggle('danger', pw.length>0 && r.score<45);

  renderComposition(r.counts, r.length);
  renderCrackTable(r.bits);
  renderFlags(r.flags);
  await checkReuse(pw);
}
pwInput.addEventListener('input', update);

document.getElementById('toggleShow').addEventListener('click', (e)=>{
  const isPw = pwInput.type==='password';
  pwInput.type = isPw?'text':'password';
  e.target.textContent = isPw?'HIDE':'SHOW';
});
document.getElementById('clearPw').addEventListener('click', ()=>{ pwInput.value=''; update(); });

/* ================= generator ================= */
const WORDS = ["harbor","ember","quartz","lantern","cobalt","willow","thistle","granite",
  "meridian","opal","copper","fjord","cinder","maple","tundra","vellum","citrine","ridge",
  "amber","basalt","driftwood","kestrel","obsidian","paprika","saffron","tinder","zephyr"];
function randInt(n){ return Math.floor(Math.random()*n); }
function titleCase(w){ return w[0].toUpperCase()+w.slice(1); }

const genState = { mode:'random', length:16, wordCount:4, classes:{lower:true,upper:true,digit:true,symbol:true}, excludeAmbiguous:false };

document.getElementById('genMode').addEventListener('change', e=>{
  genState.mode = e.target.value;
  document.getElementById('lengthCtrl').style.display = genState.mode==='random'?'':'none';
  document.getElementById('classCtrl').style.display = genState.mode==='random'?'':'none';
  document.getElementById('wordCtrl').style.display = genState.mode==='passphrase'?'':'none';
});
document.getElementById('lenSlider').addEventListener('input', e=>{
  genState.length = +e.target.value;
  document.getElementById('lenVal').textContent = genState.length;
});
document.getElementById('wcSlider').addEventListener('input', e=>{
  genState.wordCount = +e.target.value;
  document.getElementById('wcVal').textContent = genState.wordCount;
});
document.querySelectorAll('.chip[data-class]').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    const cls = chip.dataset.class;
    const activeCount = Object.values(genState.classes).filter(Boolean).length;
    if(genState.classes[cls] && activeCount===1) return;
    genState.classes[cls] = !genState.classes[cls];
    chip.classList.toggle('on', genState.classes[cls]);
  });
});
document.getElementById('ambigChip').addEventListener('click', (e)=>{
  genState.excludeAmbiguous = !genState.excludeAmbiguous;
  e.target.classList.toggle('on', genState.excludeAmbiguous);
});

function buildPool(){
  let pool = "";
  if(genState.classes.lower) pool += "abcdefghijkmnopqrstuvwxyz";
  if(genState.classes.upper) pool += "ABCDEFGHJKLMNPQRSTUVWXYZ";
  if(genState.classes.digit) pool += "23456789";
  if(genState.classes.symbol) pool += "!@#$%^&*-_=+?";
  if(!genState.excludeAmbiguous){
    let extra = "";
    if(genState.classes.lower) extra += "lo";
    if(genState.classes.upper) extra += "IO";
    if(genState.classes.digit) extra += "10";
    pool += extra;
  }
  return pool || "abcdefghijkmnopqrstuvwxyz23456789";
}
function randomPassword(){
  const pool = buildPool();
  let out = "";
  for(let i=0;i<genState.length;i++) out += pool[randInt(pool.length)];
  return out;
}
function passphrase(){
  const parts = [];
  for(let i=0;i<genState.wordCount;i++){
    const w = WORDS[randInt(WORDS.length)];
    parts.push(i===0?titleCase(w):w);
  }
  const digits = genState.excludeAmbiguous?"23456789":"0123456789";
  const symbols = "!@#$%^&*-_=+?";
  return parts.join('-') + digits[randInt(digits.length)] + digits[randInt(digits.length)] + symbols[randInt(symbols.length)];
}
function renderSuggestions(){
  const list = document.getElementById('suggestions');
  const items = [1,2,3].map(()=> genState.mode==='passphrase' ? passphrase() : randomPassword());
  list.innerHTML = "";
  items.forEach((s,idx)=>{
    const row = document.createElement('div');
    row.className='suggestion';
    row.style.animationDelay = (idx*0.08)+'s';
    row.innerHTML = `<span class="val">${s}</span><span class="actions">
      <button class="mini-btn copy">COPY</button>
      <button class="mini-btn use">USE</button>
    </span>`;
    row.querySelector('.copy').addEventListener('click', (e)=>{
      navigator.clipboard.writeText(s);
      e.target.classList.add('flash');
      e.target.textContent="COPIED";
      setTimeout(()=>{e.target.textContent="COPY"; e.target.classList.remove('flash');}, 1000);
    });
    row.querySelector('.use').addEventListener('click', ()=>{
      pwInput.value = s;
      pwInput.type = 'text';
      document.getElementById('toggleShow').textContent='HIDE';
      update();
      pwInput.scrollIntoView({behavior:'smooth', block:'center'});
    });
    list.appendChild(row);
  });
}
document.getElementById('regenBtn').addEventListener('click', renderSuggestions);

/* ================= ledger ================= */
let vault = [];
async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function renderVault(){
  const el = document.getElementById('vaultList');
  if(vault.length===0){ el.innerHTML='<div class="ledger-empty">Ledger is empty — no passwords committed this session.</div>'; return; }
  el.innerHTML = vault.map((v,i)=>`<div class="ledger-row"><span>Entry #${i+1} · ${v.time}</span><span>${v.hash.slice(0,24)}…</span></div>`).join('');
}
async function checkReuse(pw){
  const banner = document.getElementById('reuseBanner');
  banner.classList.remove('show','hit','ok');
  if(!pw || vault.length===0) return;
  const h = await sha256(pw);
  const match = vault.find(v=>v.hash===h);
  banner.classList.add('show');
  if(match){
    banner.classList.add('hit');
    banner.textContent = `Match — hash matches ledger entry #${vault.indexOf(match)+1} committed at ${match.time}. Reusing passwords lets one leaked account compromise every other account sharing it.`;
  } else {
    banner.classList.add('ok');
    banner.textContent = "No match — this password hasn't been committed to the ledger this session.";
  }
}
document.getElementById('addVaultBtn').addEventListener('click', async ()=>{
  const pw = pwInput.value;
  if(!pw) return;
  const h = await sha256(pw);
  vault.push({hash:h, time:new Date().toLocaleTimeString()});
  renderVault();
  await checkReuse(pw);
});
document.getElementById('clearVaultBtn').addEventListener('click', ()=>{
  vault=[]; renderVault();
  document.getElementById('reuseBanner').classList.remove('show','hit','ok');
});

/* ================= history ================= */
let history = [];
function renderHistory(){
  const el = document.getElementById('historyBody');
  if(history.length===0){ el.innerHTML='<tr><td colspan="5" style="color:var(--muted)">No scans filed yet.</td></tr>'; return; }
  el.innerHTML = history.map((h,i)=>`<tr><td>#${i+1}</td><td>${h.length}</td><td>${h.score}</td><td>${h.word}</td><td>${h.fp}</td></tr>`).join('');
}
document.getElementById('fileCaseBtn').addEventListener('click', async ()=>{
  const pw = pwInput.value;
  if(!pw || !lastResult) return;
  const h = await sha256(pw);
  history.push({length:lastResult.length, score:lastResult.score, word:lastResult.word, fp:h.slice(0,10)});
  renderHistory();
});

/* ================= export ================= */
document.getElementById('exportBtn').addEventListener('click', ()=>{
  if(!lastResult) return;
  const r = lastResult;
  const report = [
    `PASSWORD THREAT SCANNER — REPORT`,
    `Filed: ${new Date().toLocaleString()}`,
    ``,
    `Verdict: ${r.word} (score ${r.score}/100)`,
    `Length: ${r.length} · Entropy: ${r.bits.toFixed(1)} bits`,
    `Composition — lower:${r.counts.lower} upper:${r.counts.upper} digit:${r.counts.digit} symbol:${r.counts.symbol}`,
    ``,
    `Flags:`,
    ...(r.flags.length ? r.flags.map(f=>`  [${f.tag}] ${f.text}`) : ["  none"]),
  ].join('\n');
  navigator.clipboard.writeText(report);
  const note = document.getElementById('copiedNote');
  note.style.display='inline';
  setTimeout(()=>note.style.display='none', 1800);
});

/* ================= init ================= */
setGauge(0,'var(--muted)');
update();
renderSuggestions();
renderVault();
renderHistory();
