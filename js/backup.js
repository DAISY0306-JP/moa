// ---------- データの書き出し・読み込み ----------
const BK_KEYS = ["kq-custom","kq-weak","kq-wmeta","kq-exam","kq-dlog","kq-mastery","kq-opt","kq-writing","kq-gweak","kq-gopt","kq-sopt","kq-lastgroup","kq-mig-goal4","kq-mig2am"];
const syncOn = () => !!(db && !dbFail);
function buildBackup(){
  // 画面が使っている最新の状態（同期済みのものを含む）をそのまま書き出す
  const live = {"kq-custom":custom.map(w=>{ const o=Object.assign({},w); return o }),"kq-weak":weak,"kq-wmeta":wmeta,"kq-exam":exam,"kq-dlog":dlog,"kq-mastery":mastery,"kq-opt":opt,"kq-writing":wdata,"kq-gweak":gweak,"kq-gopt":gopt,"kq-sopt":sopt};
  const data = {};
  BK_KEYS.forEach(k=>{ data[k] = k in live ? live[k] : store.get(k,null) });
  return {app:"moa", v:1, exported:new Date().toISOString(), data};
}
function backupText(){ return JSON.stringify(buildBackup()) }
// 追加単語 → data/words.js（EXTRA）用の行
const PROMOTE_KEYS=["k","j","ex","exj","group","pos","chunk","adv","note","blank"];
const promoteList = () => {
  const fixed=new Set([...BUILTIN_KS, ...EXTRA_W.map(w=>w.k)]);
  return custom.filter(w=>w && w.k && !fixed.has(w.k)).slice().sort((a,b)=>(Date.parse(a.created)||0)-(Date.parse(b.created)||0));
};
function promoteText(list){
  return list.map(w=>{
    const o={}; PROMOTE_KEYS.forEach(k=>{ if(w[k]!==undefined && w[k]!=="" && w[k]!==null) o[k]=w[k] });
    Object.keys(w).forEach(k=>{ if(!(k in o) && !["id","created","set","fixed"].includes(k) && w[k]!=="" && w[k]!=null) o[k]=w[k] });
    return JSON.stringify(o)+",";
  }).join("\n");
}
function backupHtml(){
  const sync=syncOn();
  return `<section class="lcard" id="bk"><h2 class="lh">データの書き出し・読み込み</h2>
    <p class="hint">追加した単語・苦手・覚えた単語・学習記録・書きの答えをまとめて1つのファイルにします。別の端末や別の場所の모아へ移すときに使います。</p>
    <button class="primary sm" id="bk-dl">${canShareFile()?"保存する（iCloud Drive・ファイルなど）":"ファイルで書き出す"}</button>
    <button class="ghost" id="bk-copy">テキストでコピー</button>
    <textarea id="bk-text" class="bkta" readonly hidden aria-label="書き出したデータ"></textarea>
    <button class="ghost" id="bk-promote">追加した単語をデータ用に書き出す${promoteList().length?`<small class="bkn">${promoteList().length}語</small>`:""}</button>
    <textarea id="bk-ptext" class="bkta" readonly hidden aria-label="データ用の単語"></textarea>
    ${sync?`<p class="hint">この画面では同期が有効なため、読み込みは使えません（書き出しのみ）。</p>`:`
    <details class="bkin"><summary>読み込む（今の記録は置きかわります）</summary>
      <div class="bkin-b">
        <label class="ghost bkfile">ファイルを選ぶ<input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden></label>
        <textarea id="bk-paste" class="bkta" placeholder="またはここに貼りつけ"></textarea>
        <button class="primary sm" id="bk-load">貼りつけた内容を読み込む</button>
      </div>
    </details>`}
    <p class="status" id="bk-st" aria-live="polite"></p>
    ${keepHtml()}
    <details class="bkin" id="snapbox"><summary>自動の控え（この端末内・${SNAP_KEEP}日分）</summary>
      <div class="bkin-b"><p class="hint">毎日はじめて開いたときに、その時点の記録を自動で残します。読み込みや操作をまちがえたときに戻せます。端末ごと失くしたときは戻せないので、上の「保存する」も時々使ってください。</p>
        <div id="snaplist" class="snaplist"><p class="hint">読み込み中…</p></div></div>
    </details>
  </section>`;
}
function bkStatus(t,ng){ const e=document.getElementById("bk-st"); if(e){ e.textContent=t; e.className="status"+(ng?" ng":"") } }
function bindBackup(){
  const dl=document.getElementById("bk-dl"); if(!dl) return;
  dl.onclick=async()=>{
    const r=await saveBackupFile();
    if(r==="shared") bkStatus("保存しました。");
    else if(r==="downloaded") bkStatus("書き出しました。ダウンロードされない場合は「テキストでコピー」を使ってください。");
    else if(r==="failed"){ showText(backupText()); bkStatus("ファイルにできなかったので、下のテキストをコピーしてください。",true) }
  };
  const showText=txt=>{ const ta=document.getElementById("bk-text"); ta.hidden=false; ta.value=txt; ta.focus(); ta.select() };
  document.getElementById("bk-copy").onclick=async()=>{
    const txt=backupText(); showText(txt);
    try{ await navigator.clipboard.writeText(txt); markBackup(); bkStatus("コピーしました。メモ帳などに貼って保存してください。") }
    catch(e){ bkStatus("自動でコピーできませんでした。下のテキストを全選択してコピーしてください。",true) }
  };
  document.getElementById("bk-promote").onclick=async()=>{
    const list=promoteList();
    if(!list.length){ bkStatus("データ用に移していない追加単語はありません。"); return }
    const txt=promoteText(list), ta=document.getElementById("bk-ptext");
    ta.hidden=false; ta.value=txt; ta.focus(); ta.select();
    try{ await navigator.clipboard.writeText(txt); bkStatus(`${list.length}語をコピーしました。data/words.js の EXTRA の最後（ ]; の前）に貼りつけてください。`) }
    catch(e){ bkStatus(`下の${list.length}語分を全選択してコピーし、data/words.js の EXTRA の最後に貼りつけてください。`,true) }
  };
  const file=document.getElementById("bk-file");
  if(file) file.onchange=async()=>{ const f=file.files[0]; if(!f) return; importBackup(await f.text()); file.value="" };
  const load=document.getElementById("bk-load");
  if(load) load.onclick=()=>importBackup(document.getElementById("bk-paste").value);
  renderSnaps();
}
// ファイルで保存：iPhoneなどは共有シート（iCloud Drive・ファイルに保存）、だめならダウンロード
const bkFileName = () => `moa-backup-${today()}.json`;
const canShareFile = () => { try{ return !!navigator.canShare?.({files:[new File(["{}"],"a.json",{type:"application/json"})]}) }catch(e){ return false } };
async function saveBackupFile(){
  const txt=backupText();
  if(canShareFile()){
    try{ await navigator.share({files:[new File([txt],bkFileName(),{type:"application/json"})], title:"모아の記録"}); markBackup(); return "shared" }
    catch(e){ if(e?.name==="AbortError") return "cancel" }   // 閉じただけ
  }
  try{
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));
    a.download=bkFileName(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    markBackup(); return "downloaded";
  }catch(e){ return "failed" }
}

// ---------- 記録を消されにくくする ----------
// ブラウザに「この記録は消さないで」と頼む。iPhoneのSafariは7日間開かないと消すことがあるが、ホーム画面に追加したアプリは対象外
const isStandalone = () => !!(navigator.standalone || matchMedia?.("(display-mode: standalone)").matches);
(async()=>{ try{ if(navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist() }catch(e){} })();
function keepHtml(){
  if(isStandalone()) return "";
  return `<p class="hint keep"><b>ホーム画面に追加して使うと、記録が消えにくくなります。</b>Safariで開いたままだと、しばらく開かない日が続いたときに記録が消されることがあります（共有ボタン →「ホーム画面に追加」）。</p>`;
}

// ---------- 自動の控え（この端末内に毎日1つ） ----------
const SNAP_KEEP = 7, SNAP_PRE_KEEP = 3;   // 毎日の控え7日分＋読み込み・戻す前の控え3つ
function snapDB(){
  return new Promise((ok,ng)=>{
    const r=indexedDB.open("moa-snap",1);
    r.onupgradeneeded=()=>r.result.createObjectStore("snaps",{keyPath:"id"});
    r.onsuccess=()=>ok(r.result); r.onerror=()=>ng(r.error);
  });
}
async function snapTx(mode,fn){
  const d=await snapDB();
  return new Promise((ok,ng)=>{
    const t=d.transaction("snaps",mode), req=fn(t.objectStore("snaps"));
    t.oncomplete=()=>{ d.close(); ok(req?.result) };
    t.onerror=t.onabort=()=>{ d.close(); ng(t.error) };
  });
}
const snapList = () => snapTx("readonly",s=>s.getAll()).then(a=>(a||[]).sort((x,y)=>String(y.at).localeCompare(String(x.at)))).catch(()=>[]);
const hasRecord = () => custom.length || Object.keys(dlog).length || Object.keys(mastery.done||{}).length || Object.keys(weak).length;
async function takeSnap(kind){   // kind: "day"＝その日はじめて開いたとき / "pre"＝読み込み・戻す前
  try{
    const b=buildBackup(), id=kind==="day" ? "d"+today() : "p"+Date.now();
    await snapTx("readwrite",s=>s.put({id,kind,day:today(),at:b.exported,b}));
    const all=await snapList();
    const drop=[...all.filter(x=>x.kind==="day").slice(SNAP_KEEP), ...all.filter(x=>x.kind!=="day").slice(SNAP_PRE_KEEP)];
    if(drop.length) await snapTx("readwrite",s=>{ drop.forEach(x=>s.delete(x.id)) });
  }catch(e){}
}
async function dailySnap(){
  if(!window.indexedDB || !hasRecord()) return;
  try{ if(await snapTx("readonly",s=>s.get("d"+today()))) return }catch(e){ return }
  takeSnap("day");
}
const snapSummary = b => {
  const d=b?.data||{}, m=d["kq-mastery"]||{}, n=o=>Object.keys(o||{}).length;
  return `覚えた ${n(m.done)}語・苦手 ${n(d["kq-weak"])}語・記録 ${n(d["kq-dlog"])}日`;
};
async function renderSnaps(){
  const box=document.getElementById("snaplist"); if(!box) return;
  const all=window.indexedDB ? await snapList() : [];
  if(!all.length){ box.innerHTML=`<p class="hint">まだ控えはありません（明日から毎日たまります）。</p>`; return }
  const sync=syncOn();
  box.innerHTML=all.map(x=>{
    const t=new Date(x.at);
    const when=`${x.kind==="day"?esc(mdLabel(x.day)):esc(mdLabel(dayOf(x.at)))} ${t.getHours()}:${String(t.getMinutes()).padStart(2,"0")}`;
    return `<div class="snap"><div><b>${when}</b>${x.kind==="day"?"":`<em>置きかえる前</em>`}<small>${esc(snapSummary(x.b))}</small></div>
      ${sync?"":`<button type="button" class="ghost sm" data-snap="${esc(x.id)}">この時点に戻す</button>`}</div>`;
  }).join("");
  box.querySelectorAll("[data-snap]").forEach(btn=>btn.onclick=()=>{
    const x=all.find(y=>y.id===btn.dataset.snap); if(!x) return;
    const t=new Date(x.at).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"numeric",minute:"2-digit"});
    applyBackup(x.b,`${t} の時点の記録に戻します。\n${snapSummary(x.b)}\n\n今の記録は置きかわります（今の状態も控えに残します）。よろしいですか？`);
  });
}

// バックアップ忘れ防止：最後の書き出しから7日たったらホームでお知らせ
const BK_EVERY = 7;
function markBackup(){ store.set("kq-lastbk", today()); store.set("kq-bksnooze", null) }
const daysBetween = (a,b) => Math.round((Date.parse(b+"T00:00:00")-Date.parse(a+"T00:00:00"))/864e5);
function bkNudgeHtml(){
  if(syncOn()) return "";
  if(!hasRecord()) return "";
  const td=today(), last=store.get("kq-lastbk",null), snooze=store.get("kq-bksnooze",null);
  if(snooze===td) return "";
  const gap = last ? daysBetween(last,td) : null;
  if(gap!==null && gap<BK_EVERY) return "";
  const msg = gap===null ? "まだ一度も書き出していません" : `最後の書き出しから${gap}日たちました`;
  return `<div class="bknudge" role="status"><div><b>${msg}</b><small>記録はこの端末にだけあります</small></div>
    <button class="tgo" id="bkn-go">${canShareFile()?"保存する":"書き出す"}</button><button class="linkbtn" id="bkn-later">今日はあとで</button></div>`;
}
function bindBkNudge(){
  const go=document.getElementById("bkn-go"); if(!go) return;
  go.onclick=async()=>{
    const r=await saveBackupFile();
    if(r==="shared"||r==="downloaded"){ home(); return }
    if(r==="cancel") return;
    view="log"; logView(); const el=document.getElementById("bk"); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}) };
  document.getElementById("bkn-later").onclick=()=>{ store.set("kq-bksnooze",today()); home() };
}
function importBackup(txt){
  if(syncOn()){ bkStatus("この画面では読み込みは使えません。",true); return }
  let o; try{ o=JSON.parse(String(txt||"").trim()) }catch(e){ bkStatus("読み込めませんでした（形式がちがうようです）。",true); return }
  const d=o&&o.app==="moa"&&o.data;
  if(!d||typeof d!=="object"){ bkStatus("모아のデータではないようです。",true); return }
  const nW=Array.isArray(d["kq-custom"])?d["kq-custom"].length:0;
  const when=o.exported?new Date(o.exported).toLocaleString("ja-JP"):"不明";
  applyBackup(o,`${when} に書き出したデータを読み込みます。\n追加した単語 ${nW}語・${snapSummary(o)}\n\nこのブラウザの今の記録は置きかわります（今の状態は「自動の控え」に残します）。よろしいですか？`,true);
}
async function applyBackup(o,msg,fromFile){
  if(syncOn()){ bkStatus("この画面では読み込みは使えません。",true); return }
  const d=o?.data; if(!d) return;
  if(!confirm(msg)) return;
  if(window.indexedDB && hasRecord()) await takeSnap("pre");
  if(Array.isArray(d["kq-custom"])) d["kq-custom"]=d["kq-custom"].slice().sort((a,b)=>(Date.parse(a.created)||0)-(Date.parse(b.created)||0));
  BK_KEYS.forEach(k=>{ if(k in d && d[k]!==null && d[k]!==undefined) store.set(k,d[k]) });
  if(fromFile) markBackup();
  bkStatus("読み込みました。再読み込みします…");
  setTimeout(()=>location.reload(),600);
}
