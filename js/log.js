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
