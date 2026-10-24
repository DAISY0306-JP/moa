// ---------- 学習記録 ----------
let lsel = null;   // 選んでいる日
const dSum = d => (d?.w||0)+(d?.g||0);
function wrDays(){   // 書きは解答の保存日で数える（問題ごとに最新の1回）
  const m={};
  Object.values(wdata).forEach(d=>{ if(d?.at){ const k=dayOf(d.at); m[k]=(m[k]||0)+1 } });
  return m;
}
function actOf(d,wr){ const o=dlog[d]||{}; return {w:o.w||0,g:o.g||0,wa:o.wa||0,wo:o.wo||0,ga:o.ga||0,go:o.go||0,wr:(wr||{})[d]||0} }
const active = a => a.w+a.g+a.wr>0;
function studyStreak(wr){
  let d=today(), n=0;
  if(!active(actOf(d,wr))) d=addDays(d,-1);
  while(active(actOf(d,wr))){ n++; d=addDays(d,-1) }
  return n;
}
const pctTxt = (o,a) => a ? `正答 ${Math.round(o/a*100)}%` : "";
const mdLabel = d => { const t=new Date(d+"T00:00:00"); return `${t.getMonth()+1}/${t.getDate()}（${WD[t.getDay()]}）` };
function dayDetail(d,wr){
  const a=actOf(d,wr);
  const head=`<b>${d===today()?"今日 ":""}${esc(mdLabel(d))}</b>`;
  if(!active(a)) return `${head}<span class="lnone">${d>today()?"まだ先の日です":"この日は記録なし"}</span>`;
  const row=(cls,l,n,o,at)=>n?`<span class="lrow"><i class="key ${cls}"></i>${l} <b>${n}</b>問${at?`<small>${pctTxt(o,at)}</small>`:""}</span>`:"";
  return head+row("kw","単語",a.w,a.wo,a.wa)+row("kg","文法",a.g,a.go,a.ga)+(a.wr?`<span class="lrow"><i class="key kr"></i>書き <b>${a.wr}</b>問</span>`:"");
}
// カレンダー（13週・月曜はじまり）
function heatHtml(wr){
  const W=13, t=new Date(today()+"T00:00:00"), dow=(t.getDay()+6)%7;
  const start=addDays(today(),-dow-(W-1)*7);
  const lv = n => n<=0?0 : n<20?1 : n<40?2 : n<80?3 : 4;
  let cells="", months="";
  for(let c=0;c<W;c++){
    const first=addDays(start,c*7), m=+first.slice(5,7);
    const prevM = c? +addDays(start,(c-1)*7).slice(5,7) : 0;
    months += `<span style="grid-column:${c+2}">${m!==prevM?m+"月":""}</span>`;
    for(let r=0;r<7;r++){
      const d=addDays(start,c*7+r), a=actOf(d,wr), n=dSum(a)+a.wr*10;
      const fut=d>today();
      cells += `<button type="button" class="hc l${fut?"f":lv(n)} ${d===today()?"td":""} ${d===exam.date?"exd":""} ${d===lsel?"sel":""}" style="grid-column:${c+2};grid-row:${r+2}" data-day="${d}" aria-label="${esc(mdLabel(d))} ${dSum(a)}問" ${fut&&d!==exam.date?"disabled":""}></button>`;
    }
  }
  const rows=["月","","水","","金","",""].map((l,r)=>`<span class="hrl" style="grid-row:${r+2}">${l}</span>`).join("");
  return `<div class="heat" style="--w:${W}">${months}${rows}${cells}</div>
    <div class="hleg"><span>少</span>${[0,1,2,3,4].map(i=>`<i class="hc l${i}"></i>`).join("")}<span>多</span>${exam.date>=addDays(start,0)?`<span class="hex"><i class="hc exd"></i>試験日</span>`:""}</div>`;
}
const niceMax = v => { if(v<=10) return 10; const p=Math.pow(10,Math.floor(Math.log10(v))); for(const m of [1,2,2.5,5,10]) if(m*p>=v) return m*p; return v };
// 直近14日の棒グラフ（単語・文法の積み上げ）
function barsHtml(wr){
  const N=14, days=Array.from({length:N},(_,i)=>addDays(today(),i-N+1));
  const max=niceMax(Math.max(1,...days.map(d=>dSum(actOf(d,wr)))));
  const H=120;
  const col = d => { const a=actOf(d,wr), hw=a.w/max*H, hg=a.g/max*H;
    const seg=(h,cls,top)=>h>0?`<i class="bs ${cls} ${top?"top":""}" style="height:${Math.max(h,3).toFixed(1)}px"></i>`:"";
    return `<button type="button" class="bc ${d===lsel?"sel":""}" data-day="${d}" aria-label="${esc(mdLabel(d))} 単語${a.w}問 文法${a.g}問">
      <span class="bstack">${seg(hg,"kg",true)}${seg(hw,"kw",!a.g)}</span>
      <span class="bx">${d===today()?"今日":+d.slice(8)}</span></button>` };
  return `<div class="bars" style="--h:${H}px">
    <div class="by"><span>${max}</span><span>${max/2}</span><span>0</span></div>
    <div class="bplot"><i class="bg" style="bottom:${H}px"></i><i class="bg" style="bottom:${H/2}px"></i><i class="bg base" style="bottom:0"></i>${days.map(col).join("")}</div>
  </div>`;
}
// 覚えた単語の推移（今「覚えた」になっている単語を、覚えた日で数える）
function doneHtml(){
  const ds=Object.values(mastery.done).filter(Boolean).sort();
  if(!ds.length) return `<p class="hint">まだ「覚えた」単語はありません。自分で思い出す形で、別々の日に3回続けて正解すると増えていきます。</p>`;
  const first=ds[0], N=Math.max(7,Math.min(60,dayDiff(first,today())+2));
  const days=Array.from({length:N},(_,i)=>addDays(today(),i-N+1));
  const vals=days.map(d=>ds.filter(x=>x<=d).length);
  const W=300,H=110,L=4,R=34,T=10,B=18, max=niceMax(Math.max(...vals));
  const x=i=>L+(W-L-R)*i/(N-1), y=v=>T+(H-T-B)*(1-v/max);
  const pts=vals.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last=vals[N-1];
  return `<svg class="dline" viewBox="0 0 ${W} ${H}" role="img" aria-label="覚えた単語の数の推移。今は${last}語">
    <line x1="${L}" x2="${W-R}" y1="${y(max)}" y2="${y(max)}" class="grid"/><line x1="${L}" x2="${W-R}" y1="${y(max/2)}" y2="${y(max/2)}" class="grid"/><line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" class="axis"/>
    <text x="${W-R+6}" y="${y(max)+4}" class="tk">${max}</text><text x="${W-R+6}" y="${y(0)+4}" class="tk">0</text>
    <polygon points="${x(0)},${y(0)} ${pts} ${x(N-1)},${y(0)}" class="area"/>
    <polyline points="${pts}" class="ln"/>
    <circle cx="${x(N-1)}" cy="${y(last)}" r="4.5" class="dot"/>
    <text x="${x(N-1)-8}" y="${Math.max(y(last)-10,12)}" text-anchor="end" class="val">${last}語</text>
    <text x="${L}" y="${H-3}" class="tk">${esc(mdLabel(days[0]).replace(/（.）/,""))}</text><text x="${W-R}" y="${H-3}" text-anchor="end" class="tk">今日</text>
  </svg>`;
}
function writeLogHtml(){
  const all=[...WRITE.map(p=>({p,max:10})),...P53.map(p=>({p,max:30})),...P54.map(p=>({p,max:50}))].filter(({p})=>wdata[p.id]);
  if(!all.length) return `<p class="hint">まだ書いた問題はありません。書きタブで1問書くと、ここに点数が並びます。</p>`;
  all.sort((a,b)=>String(wdata[b.p.id].at||"").localeCompare(String(wdata[a.p.id].at||"")));
  return `<div class="list wlog">${all.map(({p,max})=>{ const d=wdata[p.id], fb=d.fb;
    const sc = !fb ? null : max>10 ? fb.total : (fb.a?.score||0)+(fb.b?.score||0);
    return `<button type="button" class="wrow" data-wid="${esc(p.id)}"><span class="wid">${esc(p.id)}</span><span class="wt"><b>${esc(p.title)}</b><small>${d.at?esc(mdLabel(dayOf(d.at))):""}</small></span>
      <span class="wsc">${sc==null?`<small>採点なし</small>`:`<b>${sc}</b><small>/ ${max}</small>`}</span></button>` }).join("")}</div>`;
}
function logView(){
  view="log";
  const wr=wrDays(), td=today();
  if(!lsel) lsel=td;
  const days=[...new Set([...Object.keys(dlog).filter(d=>dSum(dlog[d])>0),...Object.keys(wr)])];
  const tot=Object.values(dlog).reduce((s,d)=>s+dSum(d),0);
  const doneN=ALL.filter(w=>isDone(w.k)).length;
  const t=actOf(td,wr);
  const tile=(l,v,u,sub)=>`<div class="ltile"><small>${l}</small><b>${v}<span>${u}</span></b>${sub?`<em>${sub}</em>`:""}</div>`;
  const recent=days.sort().reverse().slice(0,10);
  $app.innerHTML = `
  <header class="hd"><h1>学習記録</h1><p class="hd-sub"><span>記録をはじめた日 ${days.length?esc(mdLabel(days.slice().sort()[0])):"—"}</span></p></header>
  ${tabs()}
  <div class="ltiles">
    ${tile("連続","" + studyStreak(wr),"日", active(t)?"今日も達成":"今日はまだ")}
    ${tile("今日",""+dSum(t),"問", t.wa||t.ga?pctTxt(t.wo+t.go,t.wa+t.ga):"")}
    ${tile("学習した日",""+days.length,"日", `合計 ${tot}問`)}
    ${tile("覚えた",""+doneN,"語", `全${ALL.length}語中`)}
  </div>
  <section class="lcard"><h2 class="lh">カレンダー</h2>${heatHtml(wr)}</section>
  <div class="ldetail" id="ldetail" aria-live="polite">${dayDetail(lsel,wr)}</div>
  <section class="lcard"><h2 class="lh">直近2週間の問題数</h2>
    <div class="lkeys"><span><i class="key kw"></i>単語</span><span><i class="key kg"></i>文法</span><small>日をタップすると上に内訳が出ます</small></div>
    ${barsHtml(wr)}
  </section>
  <section class="lcard"><h2 class="lh">覚えた単語の推移</h2>${doneHtml()}</section>
  <section class="lcard"><h2 class="lh">書きの点数</h2>${writeLogHtml()}</section>
  ${recent.length?`<details class="ltable"><summary>表で見る（最近${recent.length}日）</summary>
    <table><thead><tr><th>日付</th><th>単語</th><th>文法</th><th>書き</th></tr></thead><tbody>
    ${recent.map(d=>{ const a=actOf(d,wr); const c=(n,o,at)=>n?`${n}${at?`<small>${Math.round(o/at*100)}%</small>`:""}`:"—"; return `<tr><td>${esc(mdLabel(d))}</td><td>${c(a.w,a.wo,a.wa)}</td><td>${c(a.g,a.go,a.ga)}</td><td>${a.wr||"—"}</td></tr>` }).join("")}
    </tbody></table></details>`:""}
  <p class="hint">正答率は今日（10/14）以降の回答から記録しています。活用練習は単語に、書きは解答を保存した日に数えます。</p>
  ${backupHtml()}`;
  bindTabs();
  bindBackup();
  $app.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{ lsel=b.dataset.day;
    $app.querySelectorAll("[data-day]").forEach(x=>x.classList.toggle("sel",x.dataset.day===lsel));
    document.getElementById("ldetail").innerHTML=dayDetail(lsel,wr) });
  $app.querySelectorAll("[data-wid]").forEach(b=>b.onclick=()=>{ const id=b.dataset.wid; view="write"; openWriting(id) });
}

// ---------- Claudeに添削を頼む（依頼文をコピー） ----------
function askPrompt(kind,p){
  const v=id=>(document.getElementById(id)?.value||"").trim()||"（未記入）";
  const head=(no,pts,extra)=>`TOPIK II 쓰기 ${no}番の答案を添削してください。\n実際の採点基準（内容・課題の達成、文章の構成、言語の使い方）に沿って、${pts}点満点で点数をつけてください。\nそのうえで、日本語で「良い点」「直したほうがいい点（理由つき）」「直した答案」を教えてください。${extra||""}\n\n`;
  if(kind==="51"){
    const no=p.no, style=no===51?"前後の文体（-습니다体など）に合っているか":"書き言葉の -ㄴ/는다体で書けているか";
    return head(no,10,`\n${style}も見てください。`)+`【問題】\n${p.text}\n\n【私の答え】\n㉠ ${v("wa")}\n㉡ ${v("wb")}`;
  }
  if(kind==="53"){
    const charts=p.charts.map(c=>`${c.t}（${c.unit}）: `+c.rows.map(r=>`${r[0]} ${r[1]}`).join(" / ")).join("\n");
    const t=v("w53t");
    return head(53,30,"\n200〜300字に収まっているか、グラフの情報を落とさず書けているかも見てください。")+`【問題】\n다음을 참고하여 '${p.title}'에 대한 글을 200~300자로 쓰십시오. 단, 글의 제목을 쓰지 마십시오.\n조사: ${p.who}\n${charts}\n${p.info.join("\n")}\n\n【私の答え】（${len53(t==="（未記入）"?"":t)}字）\n${t}`;
  }
  const t=v("w54t");
  return head(54,50,"\n600〜700字の分量、序論・本論・結論の構成、3つの問いにすべて答えているかも見てください。")+`【問題】\n다음을 주제로 하여 자신의 생각을 600~700자로 글을 쓰십시오. 단, 문제를 그대로 옮겨 쓰지 마십시오.\n${p.intro}\n${p.qs.map((q,i)=>`${i+1}. ${q}`).join("\n")}\n\n【私の答え】（${len54(t==="（未記入）"?"":t)}字）\n${t}`;
}
function bindAskClaude(id,kind,p){
  const b=document.getElementById(id); if(!b) return;
  getSample().then(s=>{ if(s) b.hidden=true });   // AI添削が使える画面ではそちらを使う
  b.onclick=async()=>{
    const txt=askPrompt(kind,p);
    const st=document.getElementById("wstat"), out=document.getElementById("wout");
    try{ await navigator.clipboard.writeText(txt); st.className="status"; st.textContent="コピーしました。Claudeアプリに貼りつけて送ってください。" }
    catch(e){
      st.className="status err"; st.textContent="自動でコピーできませんでした。下の文章を全選択してコピーしてください。";
      out.innerHTML=`<textarea class="bkta" rows="10" readonly aria-label="添削の依頼文">${esc(txt)}</textarea>`;
      const ta=out.querySelector("textarea"); ta.focus(); ta.select();
    }
  };
}

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
    <div class="bkrow"><button class="primary sm" id="bk-dl">ファイルで書き出す</button><button class="ghost" id="bk-copy">テキストでコピー</button></div>
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
  </section>`;
}
function bkStatus(t,ng){ const e=document.getElementById("bk-st"); if(e){ e.textContent=t; e.className="status"+(ng?" ng":"") } }
function bindBackup(){
  const dl=document.getElementById("bk-dl"); if(!dl) return;
  const fname=()=>`moa-backup-${today()}.json`;
  dl.onclick=()=>{
    const txt=backupText();
    try{
      const a=document.createElement("a");
      a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));
      a.download=fname(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),4000);
      markBackup();
      bkStatus("書き出しました。ダウンロードされない場合は「テキストでコピー」を使ってください。");
    }catch(e){ showText(txt); bkStatus("ファイルにできなかったので、下のテキストをコピーしてください。",true) }
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
}
// バックアップ忘れ防止：最後の書き出しから7日たったらホームでお知らせ
const BK_EVERY = 7;
function markBackup(){ store.set("kq-lastbk", today()); store.set("kq-bksnooze", null) }
const daysBetween = (a,b) => Math.round((Date.parse(b+"T00:00:00")-Date.parse(a+"T00:00:00"))/864e5);
function bkNudgeHtml(){
  if(syncOn()) return "";
  const hasData = custom.length || Object.keys(dlog).length || Object.keys(mastery.done||{}).length;
  if(!hasData) return "";
  const td=today(), last=store.get("kq-lastbk",null), snooze=store.get("kq-bksnooze",null);
  if(snooze===td) return "";
  const gap = last ? daysBetween(last,td) : null;
  if(gap!==null && gap<BK_EVERY) return "";
  const msg = gap===null ? "まだ一度も書き出していません" : `最後の書き出しから${gap}日たちました`;
  return `<div class="bknudge" role="status"><div><b>${msg}</b><small>記録はこの端末にだけあります</small></div>
    <button class="tgo" id="bkn-go">書き出す</button><button class="linkbtn" id="bkn-later">今日はあとで</button></div>`;
}
function bindBkNudge(){
  const go=document.getElementById("bkn-go"); if(!go) return;
  go.onclick=()=>{ view="log"; logView(); const el=document.getElementById("bk"); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}) };
  document.getElementById("bkn-later").onclick=()=>{ store.set("kq-bksnooze",today()); home() };
}
function importBackup(txt){
  if(syncOn()){ bkStatus("この画面では読み込みは使えません。",true); return }
  let o; try{ o=JSON.parse(String(txt||"").trim()) }catch(e){ bkStatus("読み込めませんでした（形式がちがうようです）。",true); return }
  const d=o&&o.app==="moa"&&o.data;
  if(!d||typeof d!=="object"){ bkStatus("모아のデータではないようです。",true); return }
  const nW=Array.isArray(d["kq-custom"])?d["kq-custom"].length:0;
  const when=o.exported?new Date(o.exported).toLocaleString("ja-JP"):"不明";
  if(!confirm(`${when} に書き出したデータを読み込みます。\n追加した単語 ${nW}語\n\nこのブラウザの今の記録は置きかわります。よろしいですか？`)) return;
  if(Array.isArray(d["kq-custom"])) d["kq-custom"]=d["kq-custom"].slice().sort((a,b)=>(Date.parse(a.created)||0)-(Date.parse(b.created)||0));
  BK_KEYS.forEach(k=>{ if(k in d && d[k]!==null && d[k]!==undefined) store.set(k,d[k]) });
  markBackup();
  bkStatus("読み込みました。再読み込みします…");
  setTimeout(()=>location.reload(),600);
}
