const store = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)) }catch(e){} }
};

const BUILTIN = [];
{ const seen=new Set();
  A_RAW.forEach(([k,j,ex,exj])=>{BUILTIN.push({k,j,ex,exj,set:"A"});seen.add(k)});
  B_RAW.forEach(([k,j,ex,exj])=>{ if(!seen.has(k)) BUILTIN.push({k,j,ex,exj,set:"B"}); seen.add(k) });
  C_RAW.forEach(([k,j,ex,exj])=>{ if(!seen.has(k)) BUILTIN.push({k,j,ex,exj,set:"D"}); seen.add(k) });   // 頻出C（内部キーD：Cは追加単語用）
  M_RAW.forEach(([k,j,ex,exj])=>{ if(!seen.has(k)) BUILTIN.push({k,j,ex,exj,set:"M"}); seen.add(k) });   // 中級（3〜4級）
  L_RAW.forEach(([k,j,ex,exj,hanja,blank])=>{ if(!seen.has(k)){ const w={k,j,ex,exj,set:"L"}; if(hanja) w.hanja=hanja; if(blank) w.blank=blank; BUILTIN.push(w) } seen.add(k) });   // 4級
}
const BEGIN_KEYS = new Set(BUILTIN.filter(w=>w.set!=="M" && w.set!=="L").map(w=>w.k));   // 頻出ABC＝初級（〜2級）
const B_LIST = B_RAW.map(([k,j,ex,exj])=>({k,j,ex,exj,set:"B"}));
let custom = store.get("kq-custom",[]); // dbが使えない時のみこちら
// data/words.js の EXTRA（昇格した追加単語）。追加単語と同じ扱いで、アプリからは削除できない
const BUILTIN_KS = new Set(BUILTIN.map(w=>w.k));
const EXTRA_W = (typeof EXTRA!=="undefined" && Array.isArray(EXTRA) ? EXTRA : [])
  .filter(w=>w && w.k && !BUILTIN_KS.has(w.k))
  .map((w,i)=>Object.assign({id:"x"+i},w,{set:"C",fixed:true}));
let ALL = [], groupsCache = null;
function rebuild(){
  groupsCache = null;
  const ks=new Set([...BUILTIN_KS, ...EXTRA_W.map(w=>w.k)]);
  ALL = BUILTIN.concat(EXTRA_W, custom.filter(w=>!ks.has(w.k)).map(w=>Object.assign({set:"C"},w)));
}
rebuild();
const setName = s => s==="A"?"頻出A":s==="B"?"頻出B":s==="D"?"頻出C":s==="M"?"中級":s==="L"?"4級":"追加";
const groupOf = w => w.set==="C" ? (String(w.group||"").trim()||"追加") : null;
const B_GROUPS = ["追加","過去問①"];   // この出典の単語はすべて頻出B
const M_GROUPS = ["TOPIK中級"];        // この出典の単語は中級
const isFB = w => w.set==="C" && B_GROUPS.includes(groupOf(w));
const isFM = w => w.set==="C" && M_GROUPS.includes(groupOf(w));
const isMid = w => w.set==="M" || isFM(w);
function groups(){
  if(!groupsCache){ const g=[]; ALL.forEach(w=>{ if(w.set==="C" && !isFB(w) && !isFM(w)){ const n=groupOf(w); if(!g.includes(n)) g.push(n) } }); groupsCache=g }
  return groupsCache.slice();
}   // 頻出B・中級に入る出典は個別に出さない
const groupList = n => ALL.filter(w=>w.set==="C" && groupOf(w)===n);
const dotCls = w => isFB(w) ? "B" : isFM(w) ? "M" : w.set==="C" ? "C"+(Math.max(0,groups().indexOf(groupOf(w)))%3) : w.set;
const wSetName = w => isFB(w) ? "頻出B · "+groupOf(w) : isFM(w) ? "中級 · "+groupOf(w) : w.set==="C" ? groupOf(w) : setName(w.set);
const rangeName = v => v==="UD" ? "増える・減る" : v.startsWith("WT:") ? "苦手・"+((TRENDS.find(t=>"WT:"+t.id===v)||{}).name||"") : v.startsWith("g:") ? v.slice(2) : ({A:"頻出A",B:"頻出B",D:"頻出C",M:"中級",L:"4級",C:"追加",ADV:"副詞",ALL:"全部",W:"苦手",RW:"くり返し苦手"}[v]||v);

let weak = store.get("kq-weak",{});   // 今の苦手：苦手に入ってから間違えた回数
// 苦手の記録：tot＝通算で間違えた回数（正解しても減らない）、clr＝苦手から外れる途中 {n:正解した日数, d:最後に数えた日}
// 苦手から外れるのは、自分で思い出す形で「日を変えて2回続けて正解」したとき。途中で間違えたらやり直し
const WEAK_CLEAR_N = 2, REPEAT_N = 2;
let wmeta = Object.assign({tot:{},clr:{}}, store.get("kq-wmeta",{}));
["tot","clr"].forEach(k=>{ if(!wmeta[k]) wmeta[k]={} });
function seedTot(){ Object.keys(weak).forEach(k=>{ if((wmeta.tot[k]||0)<weak[k]) wmeta.tot[k]=weak[k] }) }
seedTot();
const missTot = k => wmeta.tot[k]||0;
const isRepeat = k => missTot(k)>=REPEAT_N;
const clrOf = k => (weak[k] && wmeta.clr[k]) ? wmeta.clr[k].n : 0;
function weakMiss(k){ weak[k]=(weak[k]||0)+1; wmeta.tot[k]=missTot(k)+1; delete wmeta.clr[k] }
function weakHit(k,countable){
  if(!weak[k]) return null;
  if(!countable) return "nocount";
  const c=wmeta.clr[k];
  if(c && c.d===today()) return "today";
  const n=(c?c.n:0)+1;
  if(n>=WEAK_CLEAR_N){ delete weak[k]; delete wmeta.clr[k]; return "out" }
  wmeta.clr[k]={n,d:today()}; return "half";
}
// 覚えた：
//  ・自分で思い出す形（書いて答える／日→韓／穴埋め）の正解だけ数える。4択の韓→日は数えない
//  ・連続正解は1日1回まで。3日分たまったら「覚えた」。1回でも間違えたら0から
//  ・覚えた単語は3日ごとに確認で出る。正解ならそのまま、間違えたら覚えたから外す
const MASTER_N = 3, REVIEW_DAYS = 3, REVIEW_DAYS_BEGIN = 7;
// 試験と目標（次の試験は日程発表前なので仮の日付。tent＝仮）
const NEXT_EXAM = {date:"2027-04-11", goal:4, tent:true};
const PAST_EXAMS = ["2026-10-18"];
let exam = Object.assign({}, NEXT_EXAM, store.get("kq-exam",{}));
if(PAST_EXAMS.includes(exam.date)) exam = Object.assign({}, NEXT_EXAM);
// 4級を目指すあいだ、初級（頻出ABC）の「覚えた」は7日ごとの確認にする
const reviewDays = k => exam.goal>=4 && BEGIN_KEYS.has(k) ? REVIEW_DAYS_BEGIN : REVIEW_DAYS;
let dlog = store.get("kq-dlog",{});   // {日付: {w:単語の回答数, g:文法の回答数, wa/wo・ga/go:正誤つき回答数/正解数}}
let eDoc=null, lDoc=null, lTimer=null;
function saveExam(){ store.set("kq-exam",exam); if(eDoc) eDoc.set(Object.assign({},exam)).catch(()=>{}) }
function logToday(key,right){
  const d=today(), o=dlog[d]=dlog[d]||{}; o[key]=(o[key]||0)+1;
  if(typeof right==="boolean"){ o[key+"a"]=(o[key+"a"]||0)+1; if(right) o[key+"o"]=(o[key+"o"]||0)+1 }   // 正答率用（wa/wo・ga/go）
  Object.keys(dlog).sort().slice(0,-400).forEach(k=>delete dlog[k]);
  saveDlog();
}
function saveDlog(){
  store.set("kq-dlog",dlog);
  if(!lDoc) return; clearTimeout(lTimer);
  lTimer=setTimeout(()=>{ lDoc.set({days:JSON.parse(JSON.stringify(dlog))}).catch(()=>{}) },800);
}
const todayLog = () => dlog[today()]||{};
let mastery = Object.assign({streak:{},last:{},done:{},chk:{}}, store.get("kq-mastery",{}));
["streak","last","done","chk"].forEach(k=>{ if(!mastery[k]) mastery[k]={} });
// 2時区切りにしたときの1回だけの移動：10/15の0〜2時に付いた記録を10/14の分にする（この端末の保存分）
(function(){ try{
  if(store.get("kq-mig2am",false)) return;
  const A="2026-10-15", B="2026-10-14";
  if(dlog[A] && !dlog[B]){ dlog[B]=dlog[A]; delete dlog[A]; store.set("kq-dlog",dlog) }
  ["last","done","chk"].forEach(f=>Object.keys(mastery[f]).forEach(k=>{ if(mastery[f][k]===A) mastery[f][k]=B }));
  store.set("kq-mastery",mastery); store.set("kq-mig2am",true);
}catch(e){} })();
let mDoc=null, mTimer=null, curCountable=true;
// 1日の区切り：深夜2時まではその前の日として数える
const DAY_START_H = 2;
const dayOf = t => new Date(new Date(t).getTime() - DAY_START_H*36e5).toLocaleDateString("sv-SE");
const today = () => dayOf(Date.now());
const dayDiff = (a,b) => Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/864e5);
const addDays = (d,n) => { const t=new Date(d+"T00:00:00"); t.setDate(t.getDate()+n); return t.toLocaleDateString("sv-SE") };
const isDone = k => !!mastery.done[k];
const isDue = k => isDone(k) && dayDiff(mastery.chk[k]||mastery.done[k], today()) >= reviewDays(k);
const streakOf = k => mastery.streak[k]||0;
const countedToday = k => mastery.last[k]===today();
function saveMastery(){
  store.set("kq-mastery",mastery);
  if(!mDoc) return;
  clearTimeout(mTimer);
  const body={}; ["streak","last","done","chk"].forEach(k=>body[k]=Object.assign({},mastery[k]));
  mTimer=setTimeout(()=>{ mDoc.set(body).catch(()=>{}) },700);
}
function bumpStreak(k,right,countable){
  let ev;
  if(!right){
    mastery.streak[k]=0; delete mastery.last[k];
    if(isDone(k)){ delete mastery.done[k]; delete mastery.chk[k]; ev="lost" } else ev="reset";
  } else if(!countable){
    ev="nocount";
  } else if(isDone(k)){
    mastery.chk[k]=today(); ev="kept";
  } else if(countedToday(k)){
    ev="today";
  } else {
    const n=streakOf(k)+1; mastery.streak[k]=n; mastery.last[k]=today();
    if(n>=MASTER_N){ mastery.done[k]=today(); mastery.chk[k]=today(); ev="done" } else ev="up";
  }
  saveMastery();
  return ev;
}
function stkHtml(k,ev){
  if(isDone(k)){
    if(ev==="done") return `<span class="stk done pop">覚えた！</span>`;
    if(ev==="kept") return `<span class="stk done">確認OK</span>`;
    return isDue(k) ? `<span class="stk due">確認</span>` : `<span class="stk done">覚えた</span>`;
  }
  const n=Math.min(streakOf(k),MASTER_N);
  const note = ev==="nocount" ? "この答え方は「覚えた」に数えない" : (ev==="today"||(!ev && countedToday(k))) ? "今日はカウント済み" : (!ev && !curCountable) ? "この答え方は「覚えた」に数えない" : "";
  return `<span class="stk ${ev==="reset"||ev==="lost"?"reset":""} ${ev==="up"?"pop":""}" title="連続正解 ${n}/${MASTER_N}（1日1回まで）">${Array.from({length:MASTER_N},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}${note?`<small>${note}</small>`:""}</span>`;
}
let opt = Object.assign({set:"M",form:"word",mode:"choice",dir:"k2j",n:"20",dist:"sim",cform:"mix",incDone:"no"}, store.get("kq-opt",{}));
// 4級向けに切りかえたとき1回だけ：出題範囲を中級に
try{ if(!store.get("kq-mig-goal4",false)){ opt.set="M"; store.set("kq-opt",opt); store.set("kq-mig-goal4",true) } }catch(e){}
const lastNav = store.get("kq-nav",{});   // 前回最後に開いていたタブ（js/common.js の saveNav）
let view = {"#book":"book","#write":"write","#gram":"gram","#log":"log"}[location.hash]||(["book","write","gram","log"].includes(lastNav.view)?lastNav.view:"home");
let run = null;
let book = {q:"",f:lastNav.bf||"all",open:lastNav.bo||null};

// ---------- 保存（db があればそちら、なければこのブラウザ） ----------
let db=null, weakDoc=null, weakTimer=null, weakChain=Promise.resolve(), dbFail=false;
function saveWeak(){
  store.set("kq-weak",weak); store.set("kq-wmeta",wmeta);
  if(!weakDoc) return;
  clearTimeout(weakTimer);
  weakTimer=setTimeout(()=>{
    const body={counts:Object.assign({},weak), tot:Object.assign({},wmeta.tot), clr:JSON.parse(JSON.stringify(wmeta.clr))};
    weakChain=weakChain.then(()=>weakDoc.set(body)).catch(()=>{});
  },700);
}
(async()=>{
  if(!window.claude?.use) return;
  try{ db = await claude.use("db") }catch(e){ db=null }
  if(!db) return;
  weakDoc = db.doc("progress/weak");
  eDoc = db.doc("progress/exam");
  eDoc.onSnapshot(s=>{
    if(s.metadata.hasPendingWrites) return;
    if(s.exists){
      const d=s.data();
      if(PAST_EXAMS.includes(d.date)){ exam=Object.assign({},NEXT_EXAM,{goal:Math.max(+d.goal||4,4)}); saveExam() }
      else { exam={date:d.date||NEXT_EXAM.date, goal:+d.goal||4, tent:!!d.tent}; store.set("kq-exam",exam) }
    }
    else saveExam();
    if(view==="home") home();
  },()=>{});
  lDoc = db.doc("progress/daily");
  lDoc.onSnapshot(s=>{
    if(s.metadata.hasPendingWrites) return;
    if(s.exists){ const d=s.data().days||{}; Object.keys(d).forEach(k=>{ const a=dlog[k]||{}, b=d[k]||{}, m={}; new Set([...Object.keys(a),...Object.keys(b)]).forEach(f=>m[f]=Math.max(+a[f]||0,+b[f]||0)); dlog[k]=m }); store.set("kq-dlog",dlog) }
    if(view==="home") home(); else if(view==="log") logView();
  },()=>{});
  mDoc = db.doc("progress/mastery");
  mDoc.onSnapshot(s=>{
    if(s.metadata.hasPendingWrites) return;
    if(s.exists){ const d=s.data(); mastery={}; ["streak","last","done","chk"].forEach(k=>mastery[k]=Object.assign({},d[k]||{})); store.set("kq-mastery",mastery) }
    else if(Object.keys(mastery.streak).length||Object.keys(mastery.done).length){ saveMastery() }
    refresh();
  },()=>{});
  weakDoc.onSnapshot(s=>{
    if(s.metadata.hasPendingWrites) return;
    if(s.exists){
      const d=s.data();
      weak = Object.assign({}, d.counts||{});
      if(d.tot){ wmeta.tot=Object.assign({},d.tot); wmeta.clr=Object.assign({},d.clr||{}) }
      seedTot();
      store.set("kq-weak",weak); store.set("kq-wmeta",wmeta);
      if(!d.tot && (Object.keys(wmeta.tot).length||Object.keys(wmeta.clr).length)) saveWeak();   // 通算の記録をはじめて保存
    }
    else if(Object.keys(weak).length||Object.keys(wmeta.tot).length){ saveWeak() }
    refresh();
  },()=>{});
  db.collection("words").orderBy("created").onSnapshot(s=>{
    custom = s.docs.map(d=>Object.assign({id:d.id},d.data()));
    rebuild(); refresh();
  },()=>{ dbFail=true });
  db.doc("progress/grammar").onSnapshot(s=>{
    if(s.metadata.hasPendingWrites) return;
    if(s.exists){ gweak=Object.assign({},s.data().counts||{}); store.set("kq-gweak",gweak) }
    else if(Object.keys(gweak).length){ db.doc("progress/grammar").set({counts:Object.assign({},gweak)}).catch(()=>{}) }
    if(view==="gram") gramView();
  },()=>{});
  db.collection("writing").onSnapshot(s=>{
    if(s.metadata.hasPendingWrites) return;
    const m={}; s.docs.forEach(d=>{ m[d.id]=d.data() });
    // このブラウザにだけある答えはページ側にも保存
    Object.keys(wdata).forEach(id=>{ if(!m[id]) db.doc("writing/"+id).set(wdata[id]).catch(()=>{}) });
    wdata=Object.assign({},wdata,m); store.set("kq-writing",wdata);
    if(view==="write") writeView();
  },()=>{});
})();
function refresh(){ if(view==="home") home(); else if(view==="book") renderList(); else if(view==="write") writeView(); else if(view==="log") logView(); }
