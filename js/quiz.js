// ---------- テスト設定 ----------
function segBtn(group,val,label,sub,disabled){
  return `<button type="button" data-g="${group}" data-v="${esc(val)}" aria-pressed="${opt[group]===val}" ${disabled?"disabled":""}>${label}${sub!=null?`<small>${sub}</small>`:""}</button>`;
}
// ホームの開閉（free＝自由に練習、trend＝苦手の傾向）は次に開いたときも同じに
const ui = Object.assign({more:false, gsec:{}, free:false, trend:false}, store.get("kq-ui",{}));
const saveUi = () => store.set("kq-ui",{free:ui.free, trend:ui.trend});
function home(){
  view="home";
  const wn=weakList().length, cn=customList().length, rn=repeatList().length;
  if(opt.set.startsWith("g:") && B_GROUPS.includes(opt.set.slice(2))) opt.set="B";
  if(opt.set.startsWith("g:") && M_GROUPS.includes(opt.set.slice(2))) opt.set="M";
  if((opt.set==="DONE"&&!ALL.some(w=>isDone(w.k)))||(opt.set==="W"&&!wn)||(opt.set==="RW"&&!rn)||(opt.set==="C")||(opt.set.startsWith("WT:")&&!trendList(opt.set.slice(3)).length) || (opt.set.startsWith("g:") && !groupList(opt.set.slice(2)).length)) opt.set="M";
  const cloze=opt.form==="cloze", conj=opt.form==="conj";
  const cnt = list => cloze ? list.filter(blankOf).length : conj ? list.filter(conjInfo).length : list.length;
  const setLabel=esc(opt.set==="DONE"?"覚えた":rangeName(opt.set));
  const poolN=cnt(pool()), qN=opt.n==="all"?poolN:Math.min(+opt.n,poolN);
  const formLabel={word:"単語",cloze:"穴埋め",conj:"活用"}[opt.form], modeLabel={choice:"4択",type:"書いて答える",card:"カード"}[opt.mode];
  const pills=(g,items)=>`<div class="seg pills" role="group">${items.map(([v,l])=>segBtn(g,v,l,null)).join("")}</div>`;
  $app.innerHTML = `
  <header class="hd"><h1 class="ko"><small>集めて覚える韓国語</small>모아</h1>
    <p class="hd-sub"><span>全${ALL.length}語</span><span class="is-done">覚えた ${ALL.filter(w=>isDone(w.k)).length}語</span>${ALL.some(w=>isDue(w.k))?`<span class="is-due">今日の確認 ${ALL.filter(w=>isDue(w.k)).length}語</span>`:""}<span class="${wn?"is-weak":""}">苦手 ${wn}語</span>${rn?`<span class="is-weak">くり返し ${rn}語</span>`:""}</p></header>
  ${tabs()}
  ${bkNudgeHtml()}
  ${todayCard()}
  ${trendCard()}
  <section class="free">
  <button type="button" class="foldh" id="freeh" aria-expanded="${ui.free}"><span><b>自由に練習</b><small>${setLabel} · ${formLabel} · ${modeLabel} · ${qN}問</small></span><i aria-hidden="true"></i></button>
  <div class="free-b" id="free-b" ${ui.free?"":"hidden"}>
  <div class="group"><div class="label">出題範囲</div>
    <div class="seg srcs">
      ${[["M","中級","M",bySetM(),"3〜4級"],["L","4級","L",bySetL(),"4級"],["A","頻出A","A",bySetA(),"初級"],["B","頻出B","B",bySetB(),"初級"],["D","頻出C","D",bySetD(),"初級"],...groups().map((g,i)=>["g:"+g,g,"C"+(i%3),groupList(g)])].map(([v,name,dot,list,lv])=>{
        const n=cnt(list), d=list.filter(w=>isDone(w.k)).length;
        return `<button type="button" class="srow" data-g="set" data-v="${esc(v)}" aria-pressed="${opt.set===v}" ${n?"":"disabled"}>
          <span class="dot ${dot}"></span><span class="sn">${esc(name)}${lv?`<small class="lvt ${lv==="初級"?"beg":""}">${lv}</small>`:""}</span>
          <span class="sc">${d?`<span class="sdone">覚えた ${d}</span>`:""}${n}語</span><span class="ck" aria-hidden="true"></span>
          <span class="sbar" aria-hidden="true"><i style="width:${list.length?Math.round(d/list.length*100):0}%"></i></span></button>`;
      }).join("")}
    </div>
    <div class="seg pills quick">
      ${[["ALL","全部",cnt(ALL)],["ADV","副詞",cnt(advList())],["W","苦手",cnt(weakList())],["DONE","覚えた",ALL.filter(w=>isDone(w.k)).length]].map(([v,l,n])=>
        `<button type="button" data-g="set" data-v="${v}" aria-pressed="${opt.set===v}" ${n?"":"disabled"}>${l}<small>${n}</small></button>`).join("")}
    </div>
  </div>
  <div class="settings">
    <div class="group"><div class="label">問題の形</div>${pills("form",[["word","単語"],["cloze","例文の穴埋め"],["conj","活用"]])}</div>
    ${conj?`<div class="group"><div class="label">活用の形</div><div class="seg chipset">
      ${segBtn("cform","mix","ミックス",null)}
      ${CONJ_FORMS.map(f=>segBtn("cform",f.id,f.l,null)).join("")}
    </div></div>`:""}
    <div class="group"><div class="label">答え方</div>${pills("mode",[["choice","4択"],["type","書いて答える"],["card","カード"]])}</div>
    ${!cloze&&!conj&&opt.mode!=="type"?`<div class="group"><div class="label">向き</div>${pills("dir",[["k2j","韓 → 日"],["j2k","日 → 韓"]])}</div>`:""}
    <p class="hint mode-hint">${modeHint()}</p>
    <details class="more" id="more" ${ui.more?"open":""}>
      <summary><span>細かい設定</span><small>${esc([opt.mode==="choice"&&!conj?(opt.dist==="rand"?"ランダム":"似た形"):"", {"10":"10問","20":"20問","all":"全部"}[opt.n], opt.set!=="DONE"?(opt.incDone==="yes"?"覚えた単語も出す":"覚えた単語は確認日だけ"):""].filter(Boolean).join(" · "))}</small></summary>
      <div class="more-in">
        <div class="group"><div class="label">問題数</div>${pills("n",[["10","10問"],["20","20問"],["all","全部"]])}</div>
        ${opt.mode==="choice"&&!conj?`<div class="group"><div class="label">4択のまぎらわしさ</div>${pills("dist",[["sim","似た形の単語"],["rand","ランダム"]])}</div>`:""}
        ${opt.set!=="DONE"?`<div class="group"><div class="label">覚えた単語</div>${pills("incDone",[["no","確認の日だけ出す"],["yes","いつも出す"]])}</div>`:""}
        <p class="hint">覚えたになるのは、自分で思い出す形（書いて答える・日→韓・穴埋め・カード）で、別々の日に3回連続正解したとき。4択の韓→日は数えません。覚えた単語は${REVIEW_DAYS}日ごと（4級を目指すあいだ、初級の頻出ABCは${REVIEW_DAYS_BEGIN}日ごと）に確認で出て、間違えると覚えたから外れます。</p>
        <p class="hint">間違えた単語は「苦手」に入ります。外れるのは、自分で思い出す形で<b>日を変えて${WEAK_CLEAR_N}回続けて正解</b>したとき（同じ日に何回当てても1回分。途中で間違えたらやり直し）。通算${REPEAT_N}回以上間違えた単語は、正解しても「くり返し苦手」に残ります（覚えたになると外れます）。${wn||rn?` <button class="linkbtn" id="clear">苦手の記録を空にする</button>`:""}</p>
      </div>
    </details>
  </div>
  <div class="startbar">
    <p class="status err" id="start-msg" role="status">${qN?"":conj?"この範囲には活用できる単語がありません":cloze?"この範囲には例文のある単語がありません":"この範囲には単語がありません"}</p>
    <button class="primary" id="start" ${qN?"":"disabled"}><span>はじめる</span><small>${setLabel} · ${formLabel} · ${modeLabel} · ${qN}問</small></button>
  </div>
  </div></section>`;
  bindTabs();
  bindBkNudge();
  $app.querySelectorAll(".seg button[data-g]").forEach(b=>b.onclick=()=>{opt[b.dataset.g]=b.dataset.v;store.set("kq-opt",opt);home()});
  bindTodayCard();
  const udb=$app.querySelector("[data-ud]"); if(udb) udb.onclick=()=>{ if(opt.set==="UD") opt.set="W"; else { opt.set="UD"; opt.form="cloze" } store.set("kq-opt",opt); home() };
  const rwb=$app.querySelector("[data-rw]"); if(rwb) rwb.onclick=()=>{ opt.set = opt.set==="RW" ? "W" : "RW"; store.set("kq-opt",opt); home() };
  $app.querySelectorAll("[data-trend]").forEach(b=>b.onclick=()=>{ const v="WT:"+b.dataset.trend; opt.set = opt.set===v ? "W" : v; store.set("kq-opt",opt); home() });
  const fh=document.getElementById("freeh");
  fh.onclick=()=>{ ui.free=!ui.free; saveUi(); fh.setAttribute("aria-expanded",ui.free); document.getElementById("free-b").hidden=!ui.free };
  const td=document.getElementById("trendbox"); if(td) td.addEventListener("toggle",()=>{ ui.trend=td.open; saveUi() });
  const ts=document.getElementById("tstart"); if(ts) ts.onclick=()=>document.getElementById("start").click();
  document.getElementById("more").addEventListener("toggle",e=>{ ui.more=e.target.open });
  document.getElementById("start").onclick=()=>{
    if(!start(pool())) document.getElementById("start-msg").textContent = opt.form==="conj" ? "この範囲には活用できる動詞・形容詞がありません" : "この範囲には例文のある単語がありません。単語帳で例文を足すと出題できます";
  };
  const c=document.getElementById("clear");
  if(c) c.onclick=()=>{
    if(c.dataset.arm){ weak={}; wmeta={tot:{},clr:{}}; saveWeak(); home() }
    else { c.dataset.arm="1"; c.textContent="もう一度押すと空にします" }
  };
}
function modeHint(){
  const cloze=opt.form==="cloze";
  if(opt.form==="conj") return opt.mode==="choice" ? "動詞・形容詞を指定の形に活用して、4つから選びます。ひっかけは不規則活用のよくある間違いです。"
    : opt.mode==="type" ? "動詞・形容詞を指定の形に活用して、ハングルで書きます。韓国語キーボードが必要です。"
    : "活用形を思い出してから答えを見て、自分で○×をつけます。";
  if(opt.mode==="type") return cloze
    ? "例文の空欄に入る単語をハングルで書きます。辞書形（例：걷다）でも、文の中の形（例：걸어요）でも正解です。韓国語キーボードが必要です。"
    : "日本語を見て、韓国語をハングルで書きます。韓国語キーボードが必要です。";
  if(cloze) return opt.mode==="choice" ? "例文の空欄に入る単語を4つから選びます。動詞・形容詞は辞書形で並びます。" : "例文の空欄を思い出してから答えを見て、自分で○×をつけます。";
  return opt.mode==="choice" ? "単語の意味を4つから選びます。" : "単語を見て思い出してから答えを見て、自分で○×をつけます。";
}

function start(words){
  if(opt.form==="cloze") words = words.filter(blankOf);
  if(opt.form==="conj") words = words.filter(conjInfo).map(w=>Object.assign({},w,{_cf: opt.cform&&opt.cform!=="mix" ? opt.cform : CONJ_FORMS[Math.floor(Math.random()*CONJ_FORMS.length)].id}));
  let list = shuffle(words);
  if(opt.n!=="all") list = list.slice(0, +opt.n);
  if(!list.length) return false;
  view="quiz";
  run = {list, i:0, miss:[], ok:0};
  question();
  return true;
}

function exLine(w){
  const c = chunkOf(w);
  const chunk = c?`<p class="chunk"><span>セットで</span>${esc(c)}</p>`:"";
  if(!w.ex) return chunk;
  const b = blankOf(w);
  const hl = b ? esc(w.ex).replace(esc(b), m=>`<b>${m}</b>`) : esc(w.ex);
  return `<p class="ex">${hl}<br>${esc(w.exj||"")}</p>${chunk}`;
}
function tipBlock(a,b){
  const n = NOTES.find(n=>n.w.includes(a)&&n.w.includes(b));
  return n?`<div class="tip"><span class="tl">見分けポイント</span>${n.t}</div>`:"";
}
const norm = s => String(s||"").normalize("NFC").replace(/[\s.,!?。、？！\-~〜～]/g,"");
function diffHtml(got,want){
  const g=[...got], t=[...want];
  return g.map((c,i)=>c===t[i]?esc(c):`<mark>${esc(c)}</mark>`).join("") + (g.length<t.length?`<mark class="gap">${"・".repeat(t.length-g.length)}</mark>`:"");
}

function question(){
  if(run.list[run.i]._cf) return conjQuestion();
  const w = run.list[run.i];
  const cloze = opt.form==="cloze" && !!blankOf(w), typed = opt.mode==="type";
  const k2j = !cloze && !typed && opt.dir==="k2j";
  curCountable = !(opt.mode==="choice" && k2j);
  const pct = run.i/run.list.length*100;

  let prompt;
  if(cloze){
    prompt = `<div class="sent" id="sent">${clozeHtml(w,false)}</div>
      <p class="sent-j">${esc(w.exj||"")}</p>
      <div class="ans ko" id="ans" hidden>${esc(w.k)}<small>${esc(w.j)}</small></div>
      <div id="exw" hidden>${chunkOf(w)?`<p class="chunk"><span>セットで</span>${esc(chunkOf(w))}</p>`:""}</div>`;
  } else {
    prompt = `<div class="q ${k2j?"ko":"jp"}">${esc(k2j?w.k:w.j)}</div>
      <div class="ans ${k2j?"":"ko"}" id="ans" hidden>${esc(k2j?w.j:w.k)}</div>
      <div id="exw" hidden>${exLine(w)}</div>`;
  }

  let body;
  if(opt.mode==="choice"){
    let others;
    if(opt.set==="UD" && udCls(w.k)) others = udOthers(w);
    else if(cloze){
      const same = x => posOf(x)===posOf(w);
      others = opt.dist==="sim" ? lookalikes(w,3,.12,same) : shuffle(ALL.filter(x=>x.k!==w.k && same(x))).slice(0,3);
      if(others.length<3) others = others.concat(lookalikes(w,3-others.length,.12,x=>!others.includes(x)));
    } else {
      others = opt.dist==="sim" ? lookalikes(w,3) : shuffle(ALL.filter(x=>x.k!==w.k && x.j!==w.j)).slice(0,3);
    }
    const opts = shuffle([w,...others]);
    const koOpts = cloze || !k2j;
    body = `<div class="choices ${koOpts?"ko":""}">${opts.map(o=>`<button type="button" data-k="${esc(o.k)}">${esc(koOpts?o.k:o.j)}</button>`).join("")}</div>
            <div id="after"></div>
            <button class="primary" id="next" hidden>次へ</button>`;
  } else if(typed){
    body = `<form class="typer" id="tf" autocomplete="off">
              <input id="ti" lang="ko" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ハングルで入力" aria-label="答えをハングルで入力">
              <button class="primary" id="tsub">答える</button>
            </form>
            <button type="button" class="linkbtn giveup" id="giveup">わからない（答えを見る）</button>
            <div id="after"></div>
            <button class="primary" id="next" hidden>次へ</button>`;
  } else {
    body = `<button class="primary" id="reveal">答えを見る</button>
            <div id="after"></div>
            <div class="row" id="grade" hidden><button class="btn-ng" id="ng">× 出なかった</button><button class="btn-ok" id="ok">○ 覚えてた</button></div>`;
  }

  $app.innerHTML = `
  <div class="topbar"><button class="quit" id="quit">← やめる</button><div class="bar"><i style="width:${pct}%"></i></div><div class="count">${run.i+1} / ${run.list.length}</div></div>
  <div class="card ${cloze?"cloze":""}">
    <span class="tag"><span class="dot ${dotCls(w)}"></span>${esc(wSetName(w))}${advOf(w)?` · 副詞`:""}<span id="stk">${stkHtml(w.k)}</span></span>
    <span id="spk">${k2j?speakBtn(w.k):""}</span>
    ${prompt}
  </div>
  ${body}`;
  document.getElementById("quit").onclick=home;
  const ans=document.getElementById("ans"), exw=document.getElementById("exw"), after=document.getElementById("after");
  const sayText = cloze ? w.ex : w.k;
  function reveal(){
    ans.hidden=false; exw.hidden=false;
    if(cloze) document.getElementById("sent").innerHTML=clozeHtml(w,true);
    document.getElementById("spk").innerHTML=speakBtn(sayText);
    if(!k2j) speak(sayText);
  }
  function showNext(){ const n=document.getElementById("next"); n.hidden=false; n.onclick=next; n.focus() }

  if(opt.mode==="choice"){
    const btns=[...$app.querySelectorAll(".choices button")];
    btns.forEach(b=>b.onclick=()=>{
      const right = b.dataset.k===w.k;
      btns.forEach(x=>{x.disabled=true; if(x.dataset.k===w.k) x.classList.add("right")});
      if(!right) b.classList.add("wrong");
      const picked = ALL.find(x=>x.k===b.dataset.k);
      if(!right) snapAnswer(run);
      const ev=record(w,right,right?null:picked);
      reveal();
      if(right){ setTimeout(next, ev==="done"||ev==="kept"?1400:cloze?1300:(ev==="up"?900:650)) }
      else {
        after.innerHTML=`<p class="confused">選んだのは <b>${esc(picked.k)}</b>＝${esc(picked.j)}</p>${tipBlock(w.k,picked.k)}${picDiff(w.k,picked.k)}`;
        offerUndo(after,question);
        showNext();
      }
    });
  } else if(typed){
    const form=document.getElementById("tf"), inp=document.getElementById("ti"), give=document.getElementById("giveup");
    let composing=false, done=false;
    inp.addEventListener("compositionstart",()=>composing=true);
    inp.addEventListener("compositionend",()=>composing=false);
    const accept = [w.k]; if(cloze) accept.push(blankOf(w));
    function finish(got){
      done=true; inp.disabled=true; document.getElementById("tsub").disabled=true; give.hidden=true;
      const g=norm(got), right = !!g && accept.map(norm).includes(g);
      const other = !right && g ? ALL.find(x=>x.k!==w.k && norm(x.k)===g) : null;
      if(!right && g) snapAnswer(run);
      record(w,right,other||null);
      reveal();
      form.classList.add(right?"is-right":"is-wrong");
      if(right){
        after.innerHTML=`<p class="verdict ok">正解！${mastery.done[w.k]===today()&&streakOf(w.k)===MASTER_N?" 覚えた単語に入りました":""}</p>`;
      } else if(!g){
        after.innerHTML="";
      } else {
        const near = lev(jamo(g),jamo(w.k))<=2 || (cloze && lev(jamo(g),jamo(blankOf(w)))<=2);
        after.innerHTML=`<div class="typed">
            <div><span>あなた</span><b>${diffHtml(g, cloze&&[...g].length>[...w.k].length?blankOf(w):w.k)}</b></div>
            <div><span>正解</span><b>${esc(w.k)}</b>${cloze&&blankOf(w)!==w.k?`<small>文の中では ${esc(blankOf(w))}</small>`:""}</div>
          </div>
          ${other?`<p class="confused">それは <b>${esc(other.k)}</b>＝${esc(other.j)}</p>${tipBlock(w.k,other.k)}${picDiff(w.k,other.k)}`
                 :(near?`<p class="verdict near">おしい！つづりが少し違います</p>`:"")+picFor(w.k)}`;
        offerUndo(after,question);
      }
      showNext();
    }
    form.onsubmit=e=>{ e.preventDefault(); if(done||composing) return; if(!norm(inp.value)) { inp.focus(); return } finish(inp.value) };
    give.onclick=()=>{ if(!done) finish("") };
    setTimeout(()=>{ try{ inp.focus({preventScroll:true}) }catch(e){} },50);
  } else {
    const rev=document.getElementById("reveal"), grade=document.getElementById("grade");
    rev.onclick=()=>{
      reveal(); rev.hidden=true; grade.hidden=false;
      const ns=notesFor(w.k);
      after.innerHTML=(ns.length?`<div class="tip"><span class="tl">似てる単語</span>${ns[0].t}</div>`:"")+picFor(w.k);
    };
    document.getElementById("ok").onclick=()=>{record(w,true);next()};
    document.getElementById("ng").onclick=()=>{record(w,false);next()};
  }
}

const cformOf = id => CONJ_FORMS.find(f=>f.id===id);
function missRow(w){
  if(w._cf){
    const f=cformOf(w._cf), a=conjAnswer(w,w._cf);
    return `<div><b>${esc(w.k)}</b><span>${esc(f.l)} → <b class="inline-ko">${esc(a.m)}</b>${w.picked?`<em>あなた：${esc(w.picked.k)}</em>`:""}</span></div>`;
  }
  return `<div><b>${esc(w.k)}</b><span>${esc(w.j)}${w.picked?`<em>↔ ${esc(w.picked.k)}（${esc(w.picked.j)}）と混同</em>`:""}${isRepeat(w.k)?`<em>くり返し苦手：通算 ${missTot(w.k)}回</em>`:""}</span></div>`;
}
function conjQuestion(){
  const w = run.list[run.i], f = cformOf(w._cf), ans = conjAnswer(w,w._cf), info = conjInfo(w);
  const pct = run.i/run.list.length*100;
  const note = conjNote(w);
  const hanNote = w._cf==="han" ? `<div class="tip"><span class="tl">書き言葉</span>${info.adj?"形容詞は辞書形のまま（〜다）。":"動詞は母音語幹＋ㄴ다、子音語幹＋는다。"}TOPIK 52〜54はこの形で書きます。</div>` : "";
  let body;
  if(opt.mode==="choice"){
    const opts = shuffle([ans.m, ...conjDistractors(w,w._cf,3)]);
    body = `<div class="choices ko">${opts.map(o=>`<button type="button" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>
            <div id="after"></div><button class="primary" id="next" hidden>次へ</button>`;
  } else if(opt.mode==="type"){
    body = `<form class="typer" id="tf" autocomplete="off">
              <input id="ti" lang="ko" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ハングルで入力" aria-label="活用形をハングルで入力">
              <button class="primary" id="tsub">答える</button>
            </form>
            <button type="button" class="linkbtn giveup" id="giveup">わからない（答えを見る）</button>
            <div id="after"></div><button class="primary" id="next" hidden>次へ</button>`;
  } else {
    body = `<button class="primary" id="reveal">答えを見る</button><div id="after"></div>
            <div class="row" id="grade" hidden><button class="btn-ng" id="ng">× 出なかった</button><button class="btn-ok" id="ok">○ 覚えてた</button></div>`;
  }
  $app.innerHTML = `
  <div class="topbar"><button class="quit" id="quit">← やめる</button><div class="bar"><i style="width:${pct}%"></i></div><div class="count">${run.i+1} / ${run.list.length}</div></div>
  <div class="card">
    <span class="tag"><span class="dot ${dotCls(w)}"></span>${esc(wSetName(w))} · ${info.adj?"形容詞":"動詞"}</span>
    <span id="spk"></span>
    <div class="q ko">${esc(w.k)}</div>
    <p class="sent-j">${esc(w.j)}</p>
    <div class="cform"><span>${esc(f.l)}</span>${esc(f.s)}</div>
    <div class="ans ko" id="ans" hidden>${esc(ans.m)}${ans.all.length>1?`<small>${ans.all.slice(1).map(esc).join("・")} でもOK</small>`:""}</div>
  </div>
  ${body}`;
  document.getElementById("quit").onclick=home;
  const after=document.getElementById("after");
  const explain = () => (note?`<div class="tip"><span class="tl">ポイント</span>${esc(note)}</div>`:"") + hanNote;
  function reveal(){ document.getElementById("ans").hidden=false; document.getElementById("spk").innerHTML=speakBtn(ans.m); speak(ans.m) }
  function showNext(){ const n=document.getElementById("next"); n.hidden=false; n.onclick=next; n.focus() }
  if(opt.mode==="choice"){
    const btns=[...$app.querySelectorAll(".choices button")];
    btns.forEach(b=>b.onclick=()=>{
      const right = ans.all.includes(b.dataset.v);
      btns.forEach(x=>{x.disabled=true; if(ans.all.includes(x.dataset.v)) x.classList.add("right")});
      if(!right){ b.classList.add("wrong"); snapAnswer(run) }
      record(w,right,right?null:{k:b.dataset.v,j:""});
      reveal();
      if(right && !note && !hanNote){ setTimeout(next,700) }
      else { after.innerHTML=(right?`<p class="verdict ok">正解！</p>`:"")+explain(); if(!right) offerUndo(after,conjQuestion); showNext() }
    });
  } else if(opt.mode==="type"){
    const form=document.getElementById("tf"), inp=document.getElementById("ti"), give=document.getElementById("giveup");
    let composing=false, done=false;
    inp.addEventListener("compositionstart",()=>composing=true);
    inp.addEventListener("compositionend",()=>composing=false);
    function finish(got){
      done=true; inp.disabled=true; document.getElementById("tsub").disabled=true; give.hidden=true;
      const g=norm(got), right = !!g && ans.all.map(norm).includes(g);
      if(!right && g) snapAnswer(run);
      record(w,right,right||!g?null:{k:g,j:""});
      reveal();
      form.classList.add(right?"is-right":"is-wrong");
      after.innerHTML = right ? `<p class="verdict ok">正解！</p>${explain()}`
        : (g?`<div class="typed"><div><span>あなた</span><b>${diffHtml(g,ans.m)}</b></div><div><span>正解</span><b>${esc(ans.m)}</b></div></div>
              ${lev(jamo(g),jamo(ans.m))<=2?`<p class="verdict near">おしい！</p>`:""}`:"") + explain();
      if(!right && g) offerUndo(after,conjQuestion);
      showNext();
    }
    form.onsubmit=e=>{ e.preventDefault(); if(done||composing) return; if(!norm(inp.value)){ inp.focus(); return } finish(inp.value) };
    give.onclick=()=>{ if(!done) finish("") };
    setTimeout(()=>{ try{ inp.focus({preventScroll:true}) }catch(e){} },50);
  } else {
    const rev=document.getElementById("reveal"), grade=document.getElementById("grade");
    rev.onclick=()=>{ reveal(); rev.hidden=true; grade.hidden=false; after.innerHTML=explain() };
    document.getElementById("ok").onclick=()=>{record(w,true);next()};
    document.getElementById("ng").onclick=()=>{record(w,false);next()};
  }
}

function record(w,right,picked){
  if(right){
    run.ok++;
    const we=weakHit(w.k, w._cf ? true : curCountable);   // 活用の正解も自分で思い出す形として数える
    if(we==="out") (run.wout=run.wout||[]).push(w);
    if(we==="half") (run.whalf=run.whalf||[]).push(w);
  }
  else { run.miss.push(Object.assign({},w,{picked})); weakMiss(w.k) }
  saveWeak();
  logToday("w",right);
  if(w._cf) return null;            // 活用練習は「覚えた」に数えない
  const ev=bumpStreak(w.k,right,curCountable);
  if(ev==="done") (run.mastered=run.mastered||[]).push(w);
  if(ev==="lost") (run.lost=run.lost||[]).push(w);
  const el=document.getElementById("stk"); if(el) el.innerHTML=stkHtml(w.k,ev);
  return ev;
}
function next(){ run.i++; run.i<run.list.length ? question() : result() }

function result(){
  view="result";
  const total=run.list.length, rate=Math.round(run.ok/total*100);
  const msg = rate===100?"全問正解！":rate>=80?"あと少し。間違えたのを詰めよう":rate>=50?"半分以上いけてる":"まずはカードで眺めるのもあり";
  const label = run.daily ? "今日の単語" : esc(opt.set==="DONE"?"覚えた":rangeName(opt.set))
    + (opt.form==="cloze"?" · 穴埋め":opt.form==="conj"?" · 活用":"") + (opt.mode==="type"?" · 書いて答える":"");
  $app.innerHTML = `
  <h1><small>結果</small>${label}</h1>
  <div class="card" style="min-height:0">
    <div class="score">${run.ok}<small> / ${total}</small></div>
    <p class="sub">${rate}% · ${msg}</p>
  </div>
  ${run.mastered?.length?`<div class="group"><div class="label">今回覚えた単語（${run.mastered.length}）</div>
    <div class="donechips">${run.mastered.map(w=>`<span><b>${esc(w.k)}</b>${esc(w.j)}</span>`).join("")}</div></div>`:""}
  ${run.lost?.length?`<p class="hint">間違えたので「覚えた」から外れた単語：${run.lost.map(w=>esc(w.k)).join("、")}</p>`:""}
  ${run.wout?.length?`<p class="hint">日を変えて${WEAK_CLEAR_N}回正解したので苦手から外れた単語：${[...new Set(run.wout.map(w=>w.k))].map(esc).join("、")}</p>`:""}
  ${run.whalf?.filter(w=>weak[w.k]).length?`<p class="hint">苦手から外れるまで、別の日にあと1回正解：${[...new Set(run.whalf.filter(w=>weak[w.k]).map(w=>w.k))].map(esc).join("、")}</p>`:""}
  ${run.miss.length?`<div class="group"><div class="label">出なかった単語（${run.miss.length}）</div>
    <div class="miss">${run.miss.map(missRow).join("")}</div></div>
    <button class="primary" id="retry">間違えたのだけもう一回</button>`:""}
  <button class="${run.miss.length?"ghost":"primary"}" id="again">同じ設定でもう一回</button>
  <button class="ghost" id="back">設定に戻る</button>`;
  const r=document.getElementById("retry"); if(r) r.onclick=()=>{const m=run.miss.map(({picked,...w})=>w); view="quiz"; run={list:shuffle(m),i:0,miss:[],ok:0}; question()};
  document.getElementById("again").onclick=()=> run.daily ? startDailyWords() : start(pool());
  if(run.daily){ const a=document.getElementById("again"); a.textContent = wordPlan().list.length ? `今日の残り ${wordPlan().list.length}語を続ける` : "もう少しやる" }
  document.getElementById("back").onclick=home;
}
