// ---------- 字形の近さ ----------
function jamo(s){
  const out=[];
  for(const ch of s){
    const c=ch.charCodeAt(0)-0xAC00;
    if(c<0||c>11171){out.push(ch);continue}
    out.push("i"+Math.floor(c/588),"m"+Math.floor(c/28)%21);
    if(c%28) out.push("f"+c%28);
  }
  return out;
}
function lev(a,b){
  const d=Array.from({length:a.length+1},(_,i)=>[i]);
  for(let j=1;j<=b.length;j++) d[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++)
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[a.length][b.length];
}
const notesFor = k => NOTES.filter(n=>n.w.includes(k));
const paired = (x,y) => NOTES.some(n=>n.w.includes(x)&&n.w.includes(y));
function sim(x,y){
  const ja=jamo(x),jb=jamo(y);
  let s = 1 - lev(ja,jb)/Math.max(ja.length,jb.length);
  const sx=[...x], sy=[...y];
  if(sx[0]===sy[0]) s+=.35;
  s += sx.filter(c=>sy.includes(c)).length*.15;
  if(sx.length===sy.length) s+=.1;
  if(paired(x,y)) s+=.8;
  if(udCls(x) && udCls(y)) s+=.6;
  return s;
}
function lookalikes(w,n,jitter=.12,keep=()=>true){
  return ALL.filter(x=>x.k!==w.k && x.j!==w.j && keep(x))
    .map(x=>({x,s:sim(w.k,x.k)+Math.random()*jitter}))
    .sort((a,b)=>b.s-a.s).slice(0,n).map(o=>o.x);
}

// ---------- 共通 ----------
const $app = document.getElementById("app");
const esc = s => String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a };
const weakList = () => ALL.filter(w=>weak[w.k]);
const repeatList = () => ALL.filter(w=>isRepeat(w.k) && !isDone(w.k)).sort((a,b)=>missTot(b.k)-missTot(a.k));   // くり返し苦手（多い順）
const customList = () => ALL.filter(w=>w.set==="C");
const advList = () => ALL.filter(w=>advOf(w));
const bySetA = () => ALL.filter(w=>w.set==="A");
const bySetB = () => B_LIST.map(b=>ALL.find(w=>w.k===b.k)||b).concat(ALL.filter(isFB));
const bySetD = () => ALL.filter(w=>w.set==="D");
const bySetM = () => ALL.filter(isMid);
const bySetL = () => ALL.filter(w=>w.set==="L");
function pool(){
  if(opt.set==="DONE") return ALL.filter(w=>isDone(w.k));
  const base=poolBase();
  return opt.incDone==="yes" ? base : base.filter(w=>!isDone(w.k) || isDue(w.k));
}
function poolBase(){
  if(opt.set==="A") return bySetA();
  if(opt.set==="B") return bySetB();
  if(opt.set==="D") return bySetD();
  if(opt.set==="M") return bySetM();
  if(opt.set==="L") return bySetL();
  if(opt.set==="C") return customList();
  if(opt.set.startsWith("g:")) return groupList(opt.set.slice(2));
  if(opt.set==="ADV") return advList();
  if(opt.set==="W") return weakList();
  if(opt.set==="RW") return repeatList();
  if(opt.set.startsWith("WT:")) return trendList(opt.set.slice(3));
  if(opt.set==="UD") return udPool();
  return ALL;
}
const canSpeak = "speechSynthesis" in window;
function speak(t){ if(!canSpeak) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang="ko-KR"; u.rate=.9; speechSynthesis.speak(u) }catch(e){} }
const speakBtn = (k,cls="speak") => canSpeak?`<button type="button" class="${cls}" data-say="${esc(k)}" aria-label="${esc(k)}の発音を聞く">🔊</button>`:"";
$app.addEventListener("click",e=>{ const b=e.target.closest("[data-say]"); if(b){ e.preventDefault(); e.stopPropagation(); speak(b.dataset.say) } });
function tabs(){
  return `<div class="tabs" role="tablist">
    <button role="tab" id="tab-home" aria-selected="${!["book","write","gram","log"].includes(view)}">テスト</button>
    <button role="tab" id="tab-book" aria-selected="${view==="book"}">単語帳</button>
    <button role="tab" id="tab-gram" aria-selected="${view==="gram"}">文法</button>
    <button role="tab" id="tab-write" aria-selected="${view==="write"}">書き</button>
    <button role="tab" id="tab-log" aria-selected="${view==="log"}">記録</button></div>`;
}
function bindTabs(){
  document.getElementById("tab-home").onclick=()=>{view="home";home()};
  document.getElementById("tab-book").onclick=()=>{view="book";bookView()};
  document.getElementById("tab-write").onclick=()=>{view="write";writeView()};
  document.getElementById("tab-gram").onclick=()=>{view="gram";gramView()};
  document.getElementById("tab-log").onclick=()=>{view="log";logView()};
}

// ---------- 活用 ----------
const H0=0xAC00;
const dec = ch => { const n=ch.charCodeAt(0)-H0; return (n<0||n>11171)?null:{c:Math.floor(n/588),v:Math.floor(n/28)%21,f:n%28} };
const com = (c,v,f) => String.fromCharCode(H0+(c*21+v)*28+f);
const setF = (ch,f) => { const d=dec(ch); return com(d.c,d.v,f) };
const V={a:0,ae:1,ya:2,eo:4,e:5,yeo:6,o:8,wa:9,wae:10,oe:11,yo:12,u:13,wo:14,wi:16,yu:17,eu:18,ui:19,i:20};
const F={none:0,n:4,d:7,l:8,m:16,b:17,s:19,ss:20};
const CHO_IEUNG=11, CHO_RIEUL=5;
const CONJ_IRR = {"걷다":"ㄷ","묻다":"ㄷ","돕다":"ㅂ","즐겁다":"ㅂ","쉽다":"ㅂ","짓다":"ㅅ","고르다":"르","다르다":"르","오르다":"르","자르다":"르","누르다":"르","부르다":"르","뜨겁다":"ㅂ","무섭다":"ㅂ","눕다":"ㅂ","차갑다":"ㅂ","가렵다":"ㅂ","두껍다":"ㅂ","기르다":"르","깨닫다":"ㄷ","떠오르다":"르","아쉽다":"ㅂ","부럽다":"ㅂ","그립다":"ㅂ",
  "괴롭다":"ㅂ","날카롭다":"ㅂ","번거롭다":"ㅂ","부드럽다":"ㅂ","여유롭다":"ㅂ","외롭다":"ㅂ","자연스럽다":"ㅂ","해롭다":"ㅂ","잇다":"ㅅ","서두르다":"르","머무르다":"르"};
const CONJ_ADJ = new Set(["즐겁다","쉽다","젊다","좁다","친절하다","부지런하다","다르다","싸다","똑같다","뜨겁다","무섭다","세다","차다","위험하다","착하다","차갑다","약하다","똑똑하다","가렵다","두껍다","얇다","심심하다",
  "뛰어나다","어색하다","소중하다","솔직하다","성실하다","꼼꼼하다","활발하다","복잡하다","단순하다","정확하다","확실하다","분명하다","독특하다","흔하다","드물다",
  "엄격하다","편안하다","불안하다","억울하다","아쉽다","부럽다","그립다","귀찮다","지루하다","상쾌하다","뚜렷하다","바람직하다","가능하다","일정하다",
  "가난하다","강하다","겸손하다","곤란하다","괴롭다","급하다","깔끔하다","날카롭다","냉정하다","넉넉하다","느긋하다","당연하다","대단하다","든든하다","막막하다","민감하다",
  "번거롭다","부드럽다","불가능하다","불규칙하다","유리하다","불리하다","뻔하다","사소하다","서운하다","성급하다","세련되다","소박하다","신기하다","신선하다","알맞다","여유롭다",
  "예민하다","완벽하다","외롭다","우수하다","원활하다","자연스럽다","적당하다","정직하다","진지하다","창피하다","튼튼하다","평범하다","풍부하다","한가하다","해롭다","화려하다","흐리다","낯설다","엄청나다"]);
const CONJ_SKIP = new Set(["갖다","데리다","대하다","안되다","이르다"]);
const CONJ_FORMS = [
  {id:"yo",   l:"해요体",            s:"〜아/어요"},
  {id:"past", l:"過去（해요体）",     s:"〜았/었어요"},
  {id:"hap",  l:"합니다体",          s:"〜ㅂ/습니다"},
  {id:"han",  l:"한다体（書き言葉）", s:"〜ㄴ/는다"},
  {id:"myeon",l:"仮定",              s:"〜(으)면"},
  {id:"seo",  l:"理由・順序",         s:"〜아/어서"}
];
const IRR_NOTE = {
  "ㄷ":"ㄷ不規則：母音で始まる語尾の前でㄷ→ㄹ（걷다→걸어요・걸으면）。습니다・는다の前はそのまま。",
  "ㅂ":"ㅂ不規則：母音で始まる語尾の前でㅂ→우（즐겁다→즐거워요・즐거우면）。돕다・곱다だけは도와요のように와になる。",
  "ㅅ":"ㅅ不規則：母音で始まる語尾の前でㅅが落ちる。落ちたあと縮約はしない（짓다→지어요・지으면）。",
  "르":"르不規則：아/어の前で르→ㄹ라/ㄹ러（고르다→골라요、다르다→달라요）。",
  "ㄹ":"ㄹ語幹：ㄴ・ㅂ・ㅅで始まる語尾の前でㄹが落ちる（걸다→겁니다・건다）。으면の으も付かない（걸면）。",
  "하":"하다用言：해요・했어요・해서になる。"
};
function bright(v){ return v===V.a||v===V.o||v===V.ya }
function conjInfo(w){
  if(!/다$/.test(w.k) || w.k.length<2 || CONJ_SKIP.has(w.k) || w.pos==="n" || w.pos==="adv" || /\s/.test(w.k)) return null;
  if(typeof advOf==="function" && advOf(w)) return null;
  const stem=w.k.slice(0,-1);
  const last=dec(stem.slice(-1)); if(!last) return null;
  let irr = CONJ_IRR[w.k] || null;
  if(!irr && /하$/.test(stem)) irr="하";
  if(!irr && last.f===F.l) irr="ㄹ";
  const builtin = (typeof BUILTIN==="undefined") || BUILTIN.some(x=>x.k===w.k);
  if(!builtin && !irr && (last.f===F.b||last.f===F.d||last.f===F.s||/르$/.test(stem))) return null; // 不規則かもしれない追加単語は除外
  const adj = CONJ_ADJ.has(w.k) || w.pos==="a" || (!builtin && !w.pos && /(い|だ)$/.test(String(w.j).split(/[・、（(]/)[0].trim()));
  return {stem,irr,adj};
}
// 아/어 形（요の前）。alt=許容する別形
function aForm(stem,irr,flip){
  const pre=stem.slice(0,-1), L=stem.slice(-1), d=dec(L);
  const br = flip ? !bright(d.v) : bright(d.v);
  if(irr==="하") return {m:pre+"해"};
  if(stem==="피") return {m:"피어", alt:["펴"]};
  if(irr==="ㄷ") return {m:pre+setF(L,F.l)+(br?"아":"어")};
  if(irr==="ㅂ"){ const b=setF(L,0); return {m:pre+b+((stem==="돕"||stem==="곱")?"와":"워")} }
  if(irr==="ㅅ") return {m:pre+setF(L,0)+(br?"아":"어")};
  if(irr==="르"){ const p=dec(pre.slice(-1)); const pb=bright(p.v); return {m:pre.slice(0,-1)+setF(pre.slice(-1),F.l)+(pb?"라":"러")} }
  if(d.f!==0) {
    const m=pre+L+(br?"아":"어");
    if(d.v===V.o && d.f===27 && !flip) return {m, alt:[pre+com(d.c,V.wa,0)]}; // 놓아→놔
    return {m};
  }
  switch(d.v){
    case V.a: case V.eo: case V.yeo: case V.ae: case V.e: return {m:stem};
    case V.o: { const m=pre+com(d.c,V.wa,0); return d.c===CHO_IEUNG?{m}:{m,alt:[stem+"아"]} }
    case V.u: { const m=pre+com(d.c,V.wo,0); return d.c===CHO_IEUNG?{m}:{m,alt:[stem+"어"]} }
    case V.i: return {m:pre+com(d.c,V.yeo,0)};
    case V.oe: return {m:pre+com(d.c,V.wae,0), alt:[stem+"어"]};
    case V.eu: { const p=pre?dec(pre.slice(-1)):null; const b=p?bright(p.v):false; return {m:pre+com(d.c,b?V.a:V.eo,0)} }
    default: return {m:stem+"어"};
  }
}
const addSS = s => s.slice(0,-1)+setF(s.slice(-1),F.ss);
function conjugate(w,form,variant){
  const info=conjInfo(w); if(!info) return null;
  let {stem,irr,adj}=info;
  if(variant==="regular" && irr && irr!=="하" && irr!=="ㄹ") irr=null;
  const flip = variant==="flip";
  const pre=stem.slice(0,-1), L=stem.slice(-1), d=dec(L);
  const vowelEnd = d.f===0;
  const A = aForm(stem,irr,flip);
  const withAlt = (fn) => ({m:fn(A.m), alt:(A.alt||[]).map(fn)});
  switch(form){
    case "yo":   return withAlt(a=>a+"요");
    case "past": return withAlt(a=>addSS(a)+"어요");
    case "seo":  return withAlt(a=>a+"서");
    case "hap":
      if(variant==="swap") return {m: vowelEnd||irr==="ㄹ" ? stem+"습니다" : pre+setF(L, F.b)+"니다"};
      if(irr==="ㄹ") return {m:pre+setF(L,F.b)+"니다"};
      return {m: vowelEnd ? pre+setF(L,F.b)+"니다" : stem+"습니다"};
    case "han":
      if(variant==="swap") return {m: adj ? (vowelEnd||irr==="ㄹ" ? pre+setF(L,F.n)+"다" : stem+"는다") : w.k};
      if(adj) return {m:w.k};
      if(irr==="ㄹ") return {m:pre+setF(L,F.n)+"다"};
      return {m: vowelEnd ? pre+setF(L,F.n)+"다" : stem+"는다"};
    case "myeon":
      if(variant==="swap") return {m: vowelEnd||irr==="ㄹ" ? stem+"으면" : stem+"면"};
      if(irr==="ㄷ") return {m:pre+setF(L,F.l)+"으면"};
      if(irr==="ㅂ") return {m:pre+setF(L,0)+"우면"};
      if(irr==="ㅅ") return {m:pre+setF(L,0)+"으면"};
      return {m: vowelEnd||irr==="ㄹ" ? stem+"면" : stem+"으면"};
  }
  return null;
}
function conjAnswer(w,form){ const r=conjugate(w,form); return r?{m:r.m, all:[r.m,...(r.alt||[])]}:null }
function conjDistractors(w,form,n){
  const ans=conjAnswer(w,form), bad=new Set(ans.all), out=[];
  const push = s => { if(s && !bad.has(s) && !out.includes(s)) out.push(s) };
  ["regular","flip","swap"].forEach(v=>{ const r=conjugate(w,form,v); if(r) push(r.m) });
  // 縮約しない誤り（나오아요 など）
  const info=conjInfo(w);
  if(info && ["yo","past","seo"].includes(form) && dec(info.stem.slice(-1)).f===0 && (!info.irr || info.irr==="하")){
    const ends = form==="yo"?["아요","어요"]:form==="past"?["았어요","었어요"]:["아서","어서"];
    ends.forEach(e=>push(info.stem+e));
  }
  // 規則化＋母音反転の組み合わせ
  if(info && info.irr && info.irr!=="하"){ const st=info.stem; const r=aForm(st,null,true); if(["yo","past","seo"].includes(form)) push(form==="yo"?r.m+"요":form==="past"?addSS(r.m)+"어요":r.m+"서") }
  // 足りなければ同じ単語の別の形
  CONJ_FORMS.forEach(f=>{ if(f.id!==form){ const r=conjugate(w,f.id); if(r) push(r.m) } });
  return out.slice(0,n);
}
const conjNote = w => { const i=conjInfo(w); return i&&i.irr?IRR_NOTE[i.irr]:"" };

// ---------- 穴埋め用：例文の中の空欄 ----------
const BLANK_OV = {"떠오르다":"떠올랐어요","걷다":"걸어요","묻다":"물어봤어요","돕다":"도왔어요","쉽다":"쉬워요","짓다":"지었어요","두다":"뒀어요","다르다":"달라요","추다":"췄어요","기르다":"길러요","-지 말다":"지 마세요","눕다":"누웠어요","쏘다":"쏠게요"};
const isPred = w => /다$/.test(w.k) && !advOf(w) && w.pos!=="n";
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const blankCache = new Map();
function blankOf(w){
  if(!w.ex) return null;
  const key=w.k+"\u0000"+w.ex;
  if(blankCache.has(key)) return blankCache.get(key);
  let r=null;
  const find = t => { const m=w.ex.match(new RegExp("(^|\\s)("+reEsc(t)+")")); return m?m.index+m[1].length:-1 };
  if(w.blank && w.ex.includes(w.blank)) r=w.blank;
  else if(BLANK_OV[w.k] && w.ex.includes(BLANK_OV[w.k])) r=BLANK_OV[w.k];
  else if(!isPred(w)){
    const i=find(w.k); if(i>=0) r=w.k; else if(w.ex.includes(w.k)) r=w.k;
  } else {
    const stem=w.k.slice(0,-1), tries=[stem];
    if(stem.length>=2) tries.push(stem.slice(0,-1));
    for(const t of tries){ const i=find(t); if(i>=0){ r=w.ex.slice(i).match(/^[^\s.,!?]+/)[0]; break } }
  }
  blankCache.set(key,r);
  return r;
}
function clozeHtml(w,filled){
  const b=blankOf(w), i=w.ex.indexOf(b);
  const mid = filled ? `<b class="fill">${esc(b)}</b>` : `<span class="blank">${isPred(w)?"活用形":"&nbsp;"}</span>`;
  return esc(w.ex.slice(0,i))+mid+esc(w.ex.slice(i+b.length));
}
const posOf = w => advOf(w)?"adv":isPred(w)?"pred":"noun";
