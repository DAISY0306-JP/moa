// ---------- 文法（言い換え） ----------
// 文法パターンは学習者が持っている教材の順。例文はオリジナル。
GRAMMAR.forEach(g=>g.items.forEach((it,i)=>{ it.id=g.id+"-"+(i+1); it.g=g }));
const G_ITEMS = GRAMMAR.flatMap(g=>g.items);
const isUpper = label => G_UPPER.has(label) || G_UPPER.has(String(label).replace(/^-\(으\)/,"-"));
let gweak = store.get("kq-gweak",{});
let gopt = Object.assign({form:"para",range:"all",n:"10"}, store.get("kq-gopt",{}));
let grun = null, gDoc=null, gTimer=null;
function saveGWeak(){
  store.set("kq-gweak",gweak);
  if(!(db && !dbFail)) return;
  clearTimeout(gTimer);
  gTimer=setTimeout(()=>{ db.doc("progress/grammar").set({counts:Object.assign({},gweak)}).catch(()=>{}) },700);
}
const gSent = (it,fill) => {
  const [pre,post]=it.s.split("{}");
  return esc(pre)+fill+esc(post);
};
const gFull = it => it.s.replace("{}",it.a);
function gPool(){
  if(gopt.range==="W") return G_ITEMS.filter(it=>gweak[it.id]);
  if(gopt.range==="all") return G_ITEMS;
  return G_ITEMS.filter(it=>it.g.cat===gopt.range);
}
function rankView(){
  view="gram";
  const wn=G_ITEMS.filter(it=>gweak[it.id]).length;
  if(gopt.range==="W"&&!wn) gopt.range="all";
  const poolN=gPool().length, qN=gopt.n==="all"?poolN:Math.min(+gopt.n,poolN);
  const pill=(k,v,l)=>`<button type="button" data-k="${k}" data-v="${esc(v)}" aria-pressed="${gopt[k]===v}">${l}</button>`;
  $app.innerHTML = `
  ${gHead(`<span>${GRAMMAR.length}パターン</span><span>${G_ITEMS.length}問</span><span class="${wn?"is-weak":""}">苦手 ${wn}問</span>`)}
  <div class="settings">
    <div class="group"><div class="label">問題の形</div><div class="seg pills">${pill("form","para","言い換え")}${pill("form","cloze","穴埋め")}</div></div>
    <div class="group"><div class="label">範囲</div><div class="seg chipset">
      ${pill("range","all","全部")}${GRAMMAR.map(g=>pill("range",g.cat,g.cat)).join("")}${wn?pill("range","W","苦手"):""}
    </div></div>
    <div class="group"><div class="label">問題数</div><div class="seg pills">${pill("n","10","10問")}${pill("n","all","全部")}</div></div>
    <p class="hint mode-hint">${gopt.form==="para"?"下線部と意味がいちばん近いものを選びます（TOPIK II 読解の言い換え問題の形式）。":"日本語訳を手がかりに、（　）に入る表現を選びます。"}</p>
  </div>
  <div class="glist">
    <div class="label">文法一覧</div>
    <div class="list">${GRAMMAR.map(g=>`<details class="gitem" ${book.gopen===g.id?"open":""} data-g="${g.id}">
      <summary><span class="gno">${String(g.no).padStart(2,"0")}</span><span class="gm"><b>${esc(g.main)}</b><small>${esc(g.cat)}</small></span>
        <span class="gst">${g.items.filter(it=>gweak[it.id]).length?`<em class="weakb">苦手 ${g.items.filter(it=>gweak[it.id]).length}</em>`:""}</span></summary>
      <div class="entry">
        <div class="gforms"><span class="l">似た表現</span>${g.forms.map(f=>`<span class="gf ${isUpper(f)?"up":""}">${esc(f)}${isUpper(f)?"<i>上級</i>":""}</span>`).join("")}</div>
        <div class="tip"><span class="tl">ポイント</span>${esc(g.note)}</div>
        ${g.items.map(it=>`<div class="gex">
          <div class="exrow">${speakBtn(gFull(it))}<div><div class="exk">${gSent(it,`<b>${esc(it.a)}</b>`)}</div><div class="exj">${esc(it.j)}</div>
          <div class="galts">${it.alts.map(([f,l])=>`<span class="${isUpper(l)?"up":""}">＝ ${esc(f)}</span>`).join("")}</div></div></div>
        </div>`).join("")}
      </div></details>`).join("")}</div>
  </div>
  <div class="startbar">
    <button class="primary" id="gstart" ${qN?"":"disabled"}><span>はじめる</span><small>${gopt.form==="para"?"言い換え":"穴埋め"} · ${esc(gopt.range==="all"?"全部":gopt.range==="W"?"苦手":gopt.range)} · ${qN}問</small></button>
  </div>`;
  bindGHead();
  $app.querySelectorAll(".settings [data-k]").forEach(b=>b.onclick=()=>{ gopt[b.dataset.k]=b.dataset.v; store.set("kq-gopt",gopt); rankView() });
  $app.querySelectorAll(".gitem").forEach(d=>d.addEventListener("toggle",()=>{ if(d.open) book.gopen=d.dataset.g; else if(book.gopen===d.dataset.g) book.gopen=null }));
  document.getElementById("gstart").onclick=()=>gStart(gPool());
}
function gStart(items){
  let list=shuffle(items); if(gopt.n!=="all") list=list.slice(0,+gopt.n);
  if(!list.length) return;
  grun={list,i:0,ok:0,miss:[]}; view="gquiz"; gQuestion();
}
function gQuestion(){
  const it=grun.list[grun.i], para=gopt.form==="para";
  const pct=grun.i/grun.list.length*100;
  const pickAlt=it.alts[Math.floor(Math.random()*it.alts.length)];
  const correct = para ? pickAlt[0] : (Math.random()<.6 ? it.a : pickAlt[0]);
  const opts=shuffle([[correct,"ok"],...it.w.map(x=>[x[0],x[1]])]);
  $app.innerHTML = `
  <div class="topbar"><button class="quit" id="quit">← やめる</button><div class="bar"><i style="width:${pct}%"></i></div><div class="count">${grun.i+1} / ${grun.list.length}</div></div>
  <p class="gask">${para?"밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.":"（　）에 들어갈 가장 알맞은 것을 고르십시오."}</p>
  <div class="card gcard">
    <span class="tag">${String(it.g.no).padStart(2,"0")} · ${esc(it.g.cat)}</span>
    <span id="spk"></span>
    <div class="gs" id="gs">${para?gSent(it,`<u>${esc(it.a)}</u>`):gSent(it,`<span class="blank">&nbsp;</span>`)}</div>
    <p class="sent-j" id="gj" ${para?"hidden":""}>${esc(it.j)}</p>
  </div>
  <div class="choices ko">${opts.map(([f,m],i)=>`<button type="button" data-i="${i}">${esc(f)}</button>`).join("")}</div>
  <div id="after"></div>
  <button class="primary" id="next" hidden>次へ</button>`;
  document.getElementById("quit").onclick=gramView;
  const btns=[...$app.querySelectorAll(".choices button")];
  btns.forEach(b=>b.onclick=()=>{
    const [f,m]=opts[+b.dataset.i], right=m==="ok";
    btns.forEach(x=>{ x.disabled=true; if(opts[+x.dataset.i][1]==="ok") x.classList.add("right") });
    if(!right) b.classList.add("wrong");
    logToday("g",right);
    if(right){ grun.ok++; delete gweak[it.id] } else { grun.miss.push({it,picked:[f,m]}); gweak[it.id]=(gweak[it.id]||0)+1 }
    saveGWeak();
    document.getElementById("gj").hidden=false;
    if(!para) document.getElementById("gs").innerHTML=gSent(it,`<b class="fill">${esc(correct)}</b>`);
    document.getElementById("spk").innerHTML=speakBtn(it.s.replace("{}",correct));
    const all=[[it.a,it.g.main],...it.alts];
    document.getElementById("after").innerHTML=`<div class="fbk">
      ${right?`<div class="fr ok"><span class="mk">○</span><div><small>正解！</small><b>${esc(f)}</b></div></div>`
             :`<div class="fr ng"><span class="mk">×</span><div><small>あなたの答え</small><b>${esc(f)}</b><span>${esc(m)}</span></div></div>
               <div class="fr ok"><span class="mk">○</span><div><small>正解</small><b>${esc(correct)}</b></div></div>`}
      <div class="fdiff"><span class="tl">同じ意味で言える形</span>
        ${all.map(([x,l])=>`<div class="dr"><b>${esc(x)}</b><span>${esc(l)}${isUpper(l)?" · 上級":""}</span></div>`).join("")}</div>
      <p class="fpt">${esc(it.g.note)}</p>
    </div>`;
    const n=document.getElementById("next"); n.hidden=false; n.onclick=gNext; n.focus();
  });
}
function gNext(){ grun.i++; grun.i<grun.list.length?gQuestion():gResult() }
function gResult(){
  view="gresult";
  const total=grun.list.length, rate=Math.round(grun.ok/total*100);
  $app.innerHTML = `
  <header class="hd"><h1>結果</h1><p class="hd-sub"><span>文法 · ${gopt.form==="para"?"言い換え":"穴埋め"}</span></p></header>
  <div class="card" style="min-height:0"><div class="score">${grun.ok}<small> / ${total}</small></div><p class="sub">${rate}%</p></div>
  ${grun.miss.length?`<div class="group"><div class="label">間違えた問題（${grun.miss.length}）</div>
    <div class="miss">${grun.miss.map(({it,picked})=>`<div><b>${esc(it.g.main)}</b><span><span class="inline-ko">${gSent(it,`<b>${esc(it.a)}</b>`)}</span><em>あなた：${esc(picked[0])}（${esc(picked[1])}）</em></span></div>`).join("")}</div></div>
    <button class="primary" id="gretry">間違えたのだけもう一回</button>`:""}
  <button class="${grun.miss.length?"ghost":"primary"}" id="gagain">同じ設定でもう一回</button>
  <button class="ghost" id="gback">文法に戻る</button>`;
  const r=document.getElementById("gretry"); if(r) r.onclick=()=>{ const m=grun.miss.map(x=>x.it); grun={list:shuffle(m),i:0,ok:0,miss:[]}; view="gquiz"; gQuestion() };
  document.getElementById("gagain").onclick=()=>gStart(gPool());
  document.getElementById("gback").onclick=gramView;
}

// ---------- 文法 使い分け（TOPIK文法整理シート） ----------
// 文法・意味・ポイントは整理シートの分類に沿って収録。問題の例文はオリジナル。
SHEET.forEach(g=>{ g.sec=SHEET_SECS.find(s=>s.cats.includes(g.cat)); g.items.forEach((it,i)=>{ it.id=g.id+"-"+(i+1); it.g=g }) });
const SHEET_BY = Object.fromEntries(SHEET.map(g=>[g.id,g]));
// レベルの目安：3級（中級の入り口）までに必須／4級で必要になるもの
SHEET.forEach(g=>{ g.lv=SHEET_LV4.has(g.id)?4:3; g.biz=g.sec.type==="仕事" });
const S_ITEMS = SHEET.flatMap(g=>g.items);

// ---------- 文法タブ：使い分け（整理シート） ----------
let sopt = Object.assign({book:"sheet",form:"cloze",range:"all",n:"10",lv:(exam.goal>=4?"4":"3")}, store.get("kq-sopt",{}));
let srun = null;
SHEET_SECS.forEach(s=>s.short=SEC_SHORT[s.id]||s.name);
const diffRows = t => String(t).split("／").map(p=>{ const i=p.indexOf("："); return i>0?`<div class="dr"><b>${esc(p.slice(0,i))}</b><span>${esc(p.slice(i+1))}</span></div>`:`<div class="dr"><span>${esc(p)}</span></div>` }).join("");
function gHead(sub){
  return `<header class="hd"><h1>文法</h1><p class="hd-sub">${sub}</p></header>
  ${tabs()}
  <div class="subtabs" role="tablist">
    <button type="button" role="tab" data-book="sheet" aria-selected="${sopt.book==="sheet"}">使い分け<small>${SHEET.length}</small></button>
    <button type="button" role="tab" data-book="rank" aria-selected="${sopt.book==="rank"}">言い換え<small>${GRAMMAR.length}</small></button>
  </div>`;
}
function bindGHead(){
  bindTabs();
  $app.querySelectorAll("[data-book]").forEach(b=>b.onclick=()=>{ sopt.book=b.dataset.book; store.set("kq-sopt",sopt); gramView() });
}
function gramView(){ return sopt.book==="rank" ? rankView() : sheetView() }
const sWeakItems = () => S_ITEMS.filter(it=>gweak[it.id]);
const sWeakGs = () => SHEET.filter(g=>gweak["m:"+g.id]);
function sPool(){
  const cloze = sopt.form==="cloze";
  if(sopt.range==="W") return cloze ? sWeakItems() : sWeakGs();
  const inSec = g => (sopt.range==="all" || g.sec.id===sopt.range) && g.lv <= +sopt.lv;
  return cloze ? S_ITEMS.filter(it=>inSec(it.g)) : SHEET.filter(inSec);
}
function sheetView(){
  view="gram";
  const wn = sopt.form==="cloze" ? sWeakItems().length : sWeakGs().length;
  if(sopt.range==="W" && !wn) sopt.range="all";
  const poolN=sPool().length, qN=sopt.n==="all"?poolN:Math.min(+sopt.n,poolN);
  const pill=(k,v,l)=>`<button type="button" data-k="${k}" data-v="${esc(v)}" aria-pressed="${sopt[k]===v}">${l}</button>`;
  const allWeak = sWeakItems().length + sWeakGs().length;
  const secLabel = s => `${s.type}・${s.name}`;
  $app.innerHTML = `
  ${gHead(`<span>連結 ${SHEET.filter(g=>g.sec.type==="連結").length}</span><span>終結 ${SHEET.filter(g=>g.sec.type==="終結").length}</span><span>仕事 ${SHEET.filter(g=>g.biz).length}</span><span class="${allWeak?"is-weak":""}">苦手 ${allWeak}</span>`)}
  <div class="settings">
    <div class="group"><div class="label">問題の形</div><div class="seg pills">${pill("form","cloze","使い分け穴埋め")}${pill("form","mean","意味")}</div></div>
    <div class="group"><div class="label">範囲</div><div class="rngs">
      <div class="rng seg chipset">${pill("range","all",`全部<small>${SHEET.length}</small>`)}${wn?pill("range","W",`苦手<small>${wn}</small>`):""}</div>
      ${["連結","終結","仕事"].map(t=>`<div class="rng seg chipset"><span class="rng-l">${t}</span>${SHEET_SECS.filter(s=>s.type===t).map(s=>pill("range",s.id,`${esc(s.short)}<small>${SHEET.filter(g=>g.sec===s).length}</small>`)).join("")}</div>`).join("")}
    </div></div>
    <div class="group"><div class="label">レベル（目安）</div><div class="seg pills">${pill("lv","3",`3級まで<small>${SHEET.filter(g=>g.lv<=3).length}</small>`)}${pill("lv","4",`4級まで<small>${SHEET.length}</small>`)}</div></div>
    <div class="group"><div class="label">問題数</div><div class="seg pills">${pill("n","10","10問")}${pill("n","20","20問")}${pill("n","all","全部")}</div></div>
    <p class="hint mode-hint">${sopt.form==="cloze"?"日本語訳を手がかりに、似た文法の中から（　）に合うものを選びます。間違えると、選んだ文法の意味と使い分けが出ます。":"文法を見て、意味を4つから選びます。選択肢は同じ分類の文法から出ます。"}</p>
  </div>
  <h2 class="sech">文法リスト</h2>
  <div class="ssecs">${SHEET_SECS.map(s=>{ const gs=SHEET.filter(g=>g.sec===s), wk=gs.filter(g=>g.items.some(it=>gweak[it.id])||gweak["m:"+g.id]).length;
    return `<details class="ssec" data-sec="${s.id}" ${ui.gsec[s.id]?"open":""}>
    <summary class="glabel"><span class="stype">${s.type}</span><span class="gsn">${esc(s.name)}</span><span class="gsc">${wk?`<em class="weakb">苦手 ${wk}</em>`:""}${gs.length}</span><span class="chev" aria-hidden="true"></span></summary>
    <div class="ssec-in">
    <div class="sdiff"><span class="tl">似ている文法の違い</span>${s.diff.map(([h,t])=>`<div class="dg">${diffRows(t)}</div>`).join("")}</div>
    <div class="list">${SHEET.filter(g=>g.sec===s).map(g=>{
      const wk=g.items.filter(it=>gweak[it.id]).length+(gweak["m:"+g.id]?1:0);
      return `<details class="gitem" data-g="${g.id}" ${book.sopen===g.id?"open":""}>
      <summary class="two"><span class="gm"><b>${esc(g.f)}${g.lv>=4?`<i class="lvb">4級</i>`:""}</b><small>${esc(g.m)}</small></span><span class="gst">${wk?`<em class="weakb">苦手 ${wk}</em>`:""}</span></summary>
      <div class="entry">
        <div class="tip"><span class="tl">使い分けのポイント</span>${esc(g.pt)}</div>
        ${g.items.map(it=>`<div class="gex"><div class="exrow">${speakBtn(gFull(it))}<div><div class="exk">${gSent(it,`<b>${esc(it.a)}</b>`)}</div><div class="exj">${esc(it.j)}</div></div></div></div>`).join("")}
      </div></details>` }).join("")}</div>
    </div></details>` }).join("")}</div>
  <div class="startbar">
    <button class="primary" id="sstart" ${qN?"":"disabled"}><span>はじめる</span><small>${sopt.form==="cloze"?"使い分け穴埋め":"意味"} · ${esc(sopt.range==="all"?"全部":sopt.range==="W"?"苦手":SHEET_SECS.find(s=>s.id===sopt.range).short)} · ${qN}問</small></button>
  </div>`;
  bindGHead();
  $app.querySelectorAll(".settings [data-k]").forEach(b=>b.onclick=()=>{ sopt[b.dataset.k]=b.dataset.v; store.set("kq-sopt",sopt); sheetView() });
  $app.querySelectorAll("details.ssec").forEach(d=>d.addEventListener("toggle",()=>{ ui.gsec[d.dataset.sec]=d.open }));
  $app.querySelectorAll(".gitem").forEach(d=>d.addEventListener("toggle",()=>{ if(d.open) book.sopen=d.dataset.g; else if(book.sopen===d.dataset.g) book.sopen=null }));
  document.getElementById("sstart").onclick=()=>sStart(sPool());
}
function sStart(list){
  list=shuffle(list); if(sopt.n!=="all") list=list.slice(0,+sopt.n);
  if(!list.length) return;
  srun={list,i:0,ok:0,miss:[],form:sopt.form}; view="squiz"; sQuestion();
}
function sDiff(g){
  if(g.sec.diff.length===1) return g.sec.diff[0];
  const core=g.f.replace(/^-/,"").replace(/\(으\)/g,"").replace(/^(ㄴ\/는|ㄹ|아\/어)\s*/,"").replace(/\([^)]*\)$/,"").trim();
  return g.sec.diff.find(([h])=>h.includes(core)) || null;
}
const gLine = g => `<b class="inline-ko">${esc(g.f)}</b>：${esc(g.m)}<span class="gpt">${esc(g.pt)}</span>`;
function sQuestion(){
  const x=srun.list[srun.i], cloze=srun.form==="cloze";
  const pct=srun.i/srun.list.length*100;
  let card, opts;
  if(cloze){
    opts=shuffle([[x.a,x.g.id,true],...x.w.map(([f,g])=>[f,g,false])]);
    card=`<span class="tag">${esc(x.g.sec.type)} · ${esc(x.g.cat)}</span><span id="spk"></span>
      <div class="gs" id="gs">${gSent(x,`<span class="blank">&nbsp;</span>`)}</div>
      <p class="sent-j">${esc(x.j)}</p>`;
  } else {
    const same=SHEET.filter(g=>g!==x && g.sec===x.sec && g.m!==x.m);
    const others=shuffle(same).slice(0,3);
    while(others.length<3){ const r=SHEET[Math.floor(Math.random()*SHEET.length)]; if(r!==x && !others.includes(r) && r.m!==x.m) others.push(r) }
    opts=shuffle([[x.m,x.id,true],...others.map(g=>[g.m,g.id,false])]);
    card=`<span class="tag">${esc(x.sec.type)} · ${esc(x.cat)}</span>
      <div class="q ko">${esc(x.f)}</div><p class="sent-j" id="sj" hidden></p>`;
  }
  $app.innerHTML = `
  <div class="topbar"><button class="quit" id="quit">← やめる</button><div class="bar"><i style="width:${pct}%"></i></div><div class="count">${srun.i+1} / ${srun.list.length}</div></div>
  <p class="gask">${cloze?"（　）에 들어갈 가장 알맞은 것을 고르십시오.":"この文法の意味はどれ？"}</p>
  <div class="card gcard">${card}</div>
  <div class="choices ${cloze?"ko":""}">${opts.map((o,i)=>`<button type="button" data-i="${i}">${esc(o[0])}</button>`).join("")}</div>
  <div id="after"></div>
  <button class="primary" id="next" hidden>次へ</button>`;
  document.getElementById("quit").onclick=gramView;
  const btns=[...$app.querySelectorAll(".choices button")];
  btns.forEach(b=>b.onclick=()=>{
    const [f,gid,ok]=opts[+b.dataset.i];
    btns.forEach(y=>{ y.disabled=true; if(opts[+y.dataset.i][2]) y.classList.add("right") });
    if(!ok) b.classList.add("wrong");
    const key = cloze ? x.id : "m:"+x.id;
    logToday("g",ok);
    if(ok){ srun.ok++; delete gweak[key] } else { srun.miss.push({x,f,gid}); gweak[key]=(gweak[key]||0)+1 }
    saveGWeak();
    const g = cloze ? x.g : x, picked=SHEET_BY[gid];
    if(cloze){
      document.getElementById("gs").innerHTML=gSent(x,`<b class="fill">${esc(x.a)}</b>`);
      document.getElementById("spk").innerHTML=speakBtn(gFull(x)); speak(gFull(x));
    } else {
      const ex=x.items[0]; const sj=document.getElementById("sj"); sj.hidden=false;
      sj.innerHTML=`<span class="inline-ko">${gSent(ex,`<b>${esc(ex.a)}</b>`)}</span><br>${esc(ex.j)}`;
    }
    const diff = sDiff(g);
    const fr = (cls,mk,lab,gg) => `<div class="fr ${cls}"><span class="mk">${mk}</span><div><small>${lab}</small><b>${esc(gg.f)}</b><span>${esc(gg.m)}</span></div></div>`;
    document.getElementById("after").innerHTML=`<div class="fbk">
      ${ok?fr("ok","○","正解！",g):fr("ng","×","あなたの答え",picked)+fr("ok","○","正解",g)}
      <p class="fpt">${esc(g.pt)}</p>
      ${diff?`<div class="fdiff"><span class="tl">似ている文法の違い</span>${diffRows(diff[1])}</div>`:""}
      ${["e01","e02","e03"].includes(g.id)?`<div class="fdiff"><span class="tl">絵で見る：놓다 と 두다</span>${picCompare(["놓다","두다"])}</div>`:""}
    </div>`;
    const n=document.getElementById("next"); n.hidden=false; n.onclick=sNext; n.focus();
  });
}
function sNext(){ srun.i++; srun.i<srun.list.length?sQuestion():sResult() }
function sResult(){
  view="gresult";
  const total=srun.list.length, rate=Math.round(srun.ok/total*100), cloze=srun.form==="cloze";
  $app.innerHTML = `
  <header class="hd"><h1>結果</h1><p class="hd-sub"><span>文法 · ${cloze?"使い分け穴埋め":"意味"}</span></p></header>
  <div class="card" style="min-height:0"><div class="score">${srun.ok}<small> / ${total}</small></div><p class="sub">${rate}%</p></div>
  ${srun.miss.length?`<div class="group"><div class="label">間違えた問題（${srun.miss.length}）</div>
    <div class="miss">${srun.miss.map(({x,f,gid})=>{ const g=cloze?x.g:x; return `<div><b>${esc(g.f)}</b><span>${cloze?`<span class="inline-ko">${gSent(x,`<b>${esc(x.a)}</b>`)}</span>`:esc(g.m)}<em>あなた：${esc(f)}${SHEET_BY[gid]&&cloze?`（${esc(SHEET_BY[gid].f)}）`:""}</em></span></div>` }).join("")}</div></div>
    <button class="primary" id="sretry">間違えたのだけもう一回</button>`:""}
  <button class="${srun.miss.length?"ghost":"primary"}" id="sagain">同じ設定でもう一回</button>
  <button class="ghost" id="sback">文法に戻る</button>`;
  const r=document.getElementById("sretry"); if(r) r.onclick=()=>{ const m=srun.miss.map(o=>o.x); srun={list:shuffle(m),i:0,ok:0,miss:[],form:srun.form}; view="squiz"; sQuestion() };
  document.getElementById("sagain").onclick=()=> srun.daily ? startDailyGram() : sStart(sPool());
  document.getElementById("sback").onclick=gramView;
}
