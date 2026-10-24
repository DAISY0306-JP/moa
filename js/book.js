// ---------- 単語帳 ----------
let addTab="one", preview=null, addCtl=null;
let lastGroup = store.get("kq-lastgroup","確認用");
function bookView(){
  view="book";
  const gs=groups();
  $app.innerHTML = `
  <header class="hd"><h1>わたしの単語帳</h1>
    <p class="hd-sub"><span>${ALL.length}語</span>${gs.map(g=>`<span>${esc(g)} ${groupList(g).length}</span>`).join("")}</p></header>
  ${tabs()}
  <details class="addbox" id="addbox" ${book.addOpen?"open":""}>
    <summary>＋ 単語を追加</summary>
    <div class="addin">
      <div class="seg pills" id="addtabs">${[["one","1語ずつ"],["bulk","まとめて"],["gen","おまかせ"]].map(([v,l])=>`<button type="button" data-a="${v}" aria-pressed="${addTab===v}">${l}</button>`).join("")}</div>
      <div id="addpane"></div>
    </div>
  </details>
  <datalist id="grouplist">${[...new Set(gs.concat(["確認用","TOPIK中級"]))].map(g=>`<option value="${esc(g)}"></option>`).join("")}</datalist>
  <div class="search"><input id="q" type="search" placeholder="韓国語か日本語で検索" value="${esc(book.q)}" aria-label="単語を検索"></div>
  <div class="chips" id="chips"></div>
  <div class="lists" id="list"></div>`;
  bindTabs();
  document.getElementById("addbox").addEventListener("toggle",e=>{ book.addOpen=e.target.open });
  document.getElementById("addtabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{
    addCtl?.abort(); addTab=b.dataset.a; preview=null;
    document.getElementById("addtabs").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));
    renderAddPane();
  });
  document.getElementById("q").oninput=e=>{book.q=e.target.value.trim();renderList()};
  renderAddPane();
  renderList();
}
const groupField = id => `<label>グループ<input id="${id}" list="grouplist" maxlength="20" value="${esc(lastGroup)}" placeholder="例：確認用"></label>`;
function renderAddPane(){
  const pane=document.getElementById("addpane"); if(!pane) return;
  if(addTab==="one"){
    pane.innerHTML = `<form id="addform" class="addform" autocomplete="off">
      <label>韓国語<input class="ko" id="f-k" required maxlength="40" placeholder="예: 식히다"></label>
      <label>意味<input id="f-j" maxlength="80" placeholder="例：冷ます（空ならClaudeが埋められます）"></label>
      <button type="button" class="ghost sm" id="f-fill" hidden>意味・例文をClaudeで埋める</button>
      <label>例文（任意）<input id="f-ex" maxlength="120" placeholder="국을 식혀서 드세요."></label>
      <label>例文の訳（任意）<input id="f-exj" maxlength="120"></label>
      <div class="two">
        <label>品詞<select id="f-pos"><option value="">自動</option><option value="v">動詞</option><option value="a">形容詞</option><option value="n">名詞</option><option value="adv">副詞</option></select></label>
        ${groupField("f-group")}
      </div>
      <label>副詞なら種類<select id="f-adv"><option value="">副詞ではない</option>${ADV_GROUPS.map(([g,d])=>`<option value="${g}">${g}（${d}）</option>`).join("")}</select></label>
      <label>よく一緒に使う形（任意）<input id="f-chunk" maxlength="80" placeholder="국을 식히다＝スープを冷ます"></label>
      <label>メモ（任意）<textarea id="f-note" rows="2" maxlength="300" placeholder="似てる単語・覚え方など"></textarea></label>
      <button class="primary" id="f-save">追加する</button>
      <p class="status" id="f-status" role="status"></p>
    </form>`;
    document.getElementById("addform").onsubmit=addOne;
    getSample().then(s=>{ const b=document.getElementById("f-fill"); if(s&&b){ b.hidden=false; b.onclick=fillOne } });
  } else if(addTab==="bulk"){
    pane.innerHTML = `<div class="addform">
      <label>1行に1語ずつ貼り付け<textarea id="b-text" class="ko" rows="6" placeholder="늘다 増える&#10;공책 ノート&#10;아마&#10;（意味は書かなくてもOK）"></textarea></label>
      ${groupField("b-group")}
      <label class="chk" id="b-fillwrap" hidden><input type="checkbox" id="b-fill" checked> 意味・例文が空いているところはClaudeが埋める</label>
      <button class="primary" id="b-read">読み込む</button>
      <p class="status" id="a-status" role="status"></p>
      <div id="pv"></div>
    </div>`;
    getSample().then(s=>{ const w=document.getElementById("b-fillwrap"); if(s&&w) w.hidden=false });
    document.getElementById("b-read").onclick=readBulk;
    if(preview) renderPreview();
  } else {
    pane.innerHTML = `<div class="addform">
      <p class="hint">テーマを書くと、Claudeが単語を選んで意味と例文を作ります。今ある単語とは重ならないように選びます。</p>
      <label>どんな単語？<input id="g-theme" maxlength="80" value="TOPIK II 中級でよく出る単語" placeholder="例：52でよく使うつなぎの言葉"></label>
      <div class="two">
        <label>語数<select id="g-n"><option>10</option><option selected>20</option><option>30</option></select></label>
        ${groupField("g-group")}
      </div>
      <button class="primary" id="g-go">作る</button>
      <p class="status" id="a-status" role="status"></p>
      <div id="pv"></div>
    </div>`;
    getSample().then(s=>{
      if(s) return;
      const b=document.getElementById("g-go"); if(!b) return;
      b.disabled=true; document.getElementById("a-status").textContent="このページからClaudeを使えないため、この機能は使えません。";
    });
    document.getElementById("g-go").onclick=genWords;
    if(preview) renderPreview();
  }
}

// --- 貼り付けの読み取り
function parseBulk(text){
  const rows=[], seen=new Set();
  const push=(k,j)=>{ k=k.replace(/\s+/g," ").trim(); if(!k||seen.has(k)) return; seen.add(k); rows.push({k,j:(j||"").trim()}) };
  String(text).split(/\r?\n/).forEach(line=>{
    let s=line.trim(); if(!s) return;
    s=s.replace(/^\d+\s*[.)、．:]?\s+/,"").replace(/^[-・•*]\s*/,"");
    const cols=s.split(/\t+/).map(c=>c.trim()).filter(Boolean);
    if(cols.length>=2 && cols.every(c=>/^[가-힣\s~]+$/.test(c)||/^[—\-–]+$/.test(c))){ cols.forEach(c=>{ if(/[가-힣]/.test(c)) push(c,"") }); return }
    const m=s.match(/^([가-힣][가-힣\s~]*[가-힣~]|[가-힣])\s*[\t,，、:：=＝\/／\-–—]?\s*([^가-힣\s].*)$/);
    if(m) push(m[1],m[2]);
    else if(/^[가-힣][가-힣\s~]*$/.test(s)) push(s,"");
  });
  return rows;
}
const hasWord = k => ALL.some(x=>x.k===k);
function cleanItem(x){
  const t=(v,n)=>String(v??"").replace(/\s+/g," ").trim().slice(0,n);
  const w={k:t(x?.k,40), j:t(x?.j,80), pos:["v","a","n","adv"].includes(x?.pos)?x.pos:"", ex:t(x?.ex,160), exj:t(x?.exj,160), adv:"", chunk:t(x?.chunk,80)};
  if(w.pos==="adv") w.adv = ADV_GROUPS.some(([g])=>g===x?.adv) ? x.adv : "様子";
  return w;
}
const ITEM_SPEC = `各要素の形: {"k":"韓国語（辞書形）","j":"日本語の意味（短く。複数なら・で区切る）","pos":"v（動詞）|a（形容詞）|n（名詞）|adv（副詞・接続の言葉）","ex":"その単語（活用形でもよい）を必ず含む自然な韓国語の例文。15〜35字。한다体か해요体","exj":"例文の自然な日本語訳","adv":"posがadvのときだけ 程度|時間|確かさ|様子|つなぎ のどれか。それ以外は空文字","chunk":"よく一緒に使う形があれば「韓国語＝日本語」の形で。なければ空文字"}`;
async function claudeFill(rows,signal){
  const sample=await getSample(); if(!sample) throw {code:"not_granted"};
  const out=new Map();
  for(let i=0;i<rows.length;i+=25){
    const part=rows.slice(i,i+25);
    const prompt=`日本語話者がTOPIKに向けて使う韓国語の単語帳データを作ってください。
次の単語それぞれについて、意味・品詞・例文などを埋めてください。「｜」の右に意味が書いてあるものは、その意味を優先してください。

${part.map(r=>r.k+(r.j?"｜"+r.j:"")).join("\n")}

JSONの配列だけで答えてください。入力と同じ順番・同じ数で。
${ITEM_SPEC}`;
    const arr=await sample.json(prompt,{signal});
    (Array.isArray(arr)?arr:[]).forEach(x=>{ const w=cleanItem(x); if(w.k) out.set(w.k,w) });
  }
  return out;
}
async function readBulk(){
  const st=document.getElementById("a-status");
  const rows=parseBulk(document.getElementById("b-text").value);
  if(!rows.length){ st.className="status err"; st.textContent="韓国語の単語が見つかりませんでした。1行に1語ずつ貼り付けてください"; return }
  const group=(document.getElementById("b-group").value.trim()||"追加");
  const fillBox=document.getElementById("b-fill");
  const fill=!!(fillBox && !document.getElementById("b-fillwrap").hidden && fillBox.checked);
  let items=rows.map(r=>({k:r.k,j:r.j}));
  const todo=items.filter(r=>!hasWord(r.k));
  if(fill && todo.length){
    addCtl?.abort(); addCtl=new AbortController();
    st.className="status"; st.innerHTML=`Claudeが${todo.length}語の意味と例文を作っています… <button class="linkbtn" id="a-stop">止める</button>`;
    document.getElementById("a-stop").onclick=()=>addCtl.abort();
    try{
      const m=await claudeFill(todo,addCtl.signal);
      items=items.map(r=>{ const f=m.get(r.k); return f?Object.assign({},f,{k:r.k,j:r.j||f.j}):r });
      st.textContent="";
    }catch(e){
      st.className="status err"; st.textContent=sampleErrText(e)+" 意味を書いた語だけ追加できます。";
    }
  } else st.textContent="";
  preview={items,group,from:"bulk"};
  renderPreview();
}
async function genWords(){
  const st=document.getElementById("a-status"), btn=document.getElementById("g-go");
  const theme=document.getElementById("g-theme").value.trim()||"TOPIK II 中級でよく出る単語";
  const n=+document.getElementById("g-n").value||20;
  const group=(document.getElementById("g-group").value.trim()||"追加");
  const sample=await getSample(); if(!sample) return;
  addCtl?.abort(); addCtl=new AbortController();
  btn.disabled=true; st.className="status"; st.innerHTML=`Claudeが単語を選んでいます…（数十秒かかることがあります） <button class="linkbtn" id="a-stop">止める</button>`;
  document.getElementById("a-stop").onclick=()=>addCtl.abort();
  const have=ALL.map(w=>w.k).join("、");
  const prompt=`日本語話者がTOPIKに向けて使う韓国語の単語帳に、新しい単語を${n}語追加したいです。
テーマ: ${theme}

次の単語はすでに持っているので、選ばないでください:
${have}

テーマに合う、学習価値の高い単語を${n}語選んでください。JSONの配列だけで答えてください。
${ITEM_SPEC}`;
  try{
    const arr=await sample.json(prompt,{signal:addCtl.signal,cache:false});
    const items=(Array.isArray(arr)?arr:[]).map(cleanItem).filter(w=>/^[가-힣][가-힣\s~]*$/.test(w.k)&&w.j);
    if(!items.length) throw {code:"invalid_json"};
    st.textContent=""; preview={items,group,from:"gen"}; renderPreview();
  }catch(e){ st.className="status err"; st.textContent=sampleErrText(e) }
  finally{ btn.disabled=false }
}
function sampleErrText(e){
  const c=e?.code;
  if(c==="cancelled") return "止めました。";
  if(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(c)) return "このページからClaudeを使えませんでした。";
  if(c==="rate_limited") return "利用が集中しています。少し時間をおいてもう一度試してください。";
  if(c==="invalid_json") return "結果をうまく読み取れませんでした。もう一度試してください。";
  return "うまくいきませんでした。通信状態を確認してもう一度試してください。";
}
function renderPreview(){
  const pv=document.getElementById("pv"); if(!pv||!preview) return;
  const {items,group}=preview;
  const rows=items.map((w,i)=>{
    const dup=hasWord(w.k), noj=!w.j && !dup;
    const off=dup||noj;
    const jj = dup ? (ALL.find(x=>x.k===w.k)?.j||"") : w.j;
    return `<label class="prow ${off?"off":""}"><input type="checkbox" data-i="${i}" ${off?"disabled":"checked"}>
      <b>${esc(w.k)}</b><span>${esc(jj)||"<i>意味なし</i>"}${w.ex&&!dup?`<small>${esc(w.ex)}</small>`:""}</span>
      ${dup?`<em>登録済み</em>`:noj?`<em>意味を書いて</em>`:""}</label>`;
  }).join("");
  pv.innerHTML=`<div class="pv-h">${items.length}語を読み込みました</div><div class="plist">${rows}</div>
    <button class="primary" id="pv-add">選んだ単語を「${esc(group)}」に追加</button>`;
  const btn=document.getElementById("pv-add");
  const upd=()=>{ const n=pv.querySelectorAll("input:checked").length; btn.textContent=`${n}語を「${group}」に追加`; btn.disabled=!n };
  pv.querySelectorAll("input").forEach(c=>c.onchange=upd); upd();
  btn.onclick=async()=>{
    const pick=[...pv.querySelectorAll("input:checked")].map(c=>items[+c.dataset.i]);
    const ok=await saveWords(pick,group,btn);
    if(ok){ preview=null; pv.innerHTML=""; const t=document.getElementById("b-text"); if(t) t.value="" }
  };
}
async function saveWords(list,group,btn){
  const st=document.getElementById("a-status")||document.getElementById("f-status");
  lastGroup=group; store.set("kq-lastgroup",group);
  if(btn) btn.disabled=true;
  const base=Date.now(); let done=0;
  try{
    for(const w of list){
      if(hasWord(w.k)){ done++; continue }
      const doc=Object.assign({},w,{group,created:new Date(base+done).toISOString()});
      Object.keys(doc).forEach(k=>{ if(doc[k]==="") delete doc[k] });
      if(db && !dbFail){ await db.collection("words").add(doc) }
      else { custom=custom.concat([Object.assign({id:"l"+(base+done)},doc)]); store.set("kq-custom",custom); rebuild() }
      done++;
      if(st){ st.className="status"; st.textContent=`追加中… ${done} / ${list.length}` }
    }
    if(st){ st.className="status"; st.textContent=`${list.length}語を「${group}」に追加しました` }
    book.f=B_GROUPS.includes(group)?"B":M_GROUPS.includes(group)?"M":"g:"+group; renderList();
    return true;
  }catch(err){
    if(st){ st.className="status err"; st.textContent = (err?.code==="quota_exceeded"?"保存できる上限に達しました。":"途中で保存できなくなりました。")+`（${done}語まで追加済み）` }
    renderList();
    return false;
  }finally{ if(btn) btn.disabled=false }
}
async function addOne(e){
  e.preventDefault();
  const st=document.getElementById("f-status"), btn=document.getElementById("f-save");
  const v=id=>document.getElementById(id).value.trim();
  const w={k:v("f-k"),j:v("f-j"),ex:v("f-ex"),exj:v("f-exj"),pos:v("f-pos"),adv:v("f-adv"),chunk:v("f-chunk"),note:v("f-note")};
  if(w.adv && !w.pos) w.pos="adv";
  if(!w.k){ st.className="status err"; st.textContent="韓国語を入れてください"; return }
  if(!w.j){ st.className="status err"; st.textContent="意味を入れるか、「意味・例文をClaudeで埋める」を押してください"; return }
  if(hasWord(w.k)){ st.className="status err"; st.textContent=`「${w.k}」はもう単語帳にあります`; return }
  const group=v("f-group")||"追加";
  const ok=await saveWords([w],group,btn);
  if(ok){ ["f-k","f-j","f-ex","f-exj","f-chunk","f-note"].forEach(id=>document.getElementById(id).value=""); document.getElementById("f-pos").value=""; document.getElementById("f-adv").value=""; book.open=w.k; renderList() }
}
async function fillOne(){
  const st=document.getElementById("f-status"), b=document.getElementById("f-fill");
  const k=document.getElementById("f-k").value.trim();
  if(!k){ st.className="status err"; st.textContent="先に韓国語を入れてください"; return }
  addCtl?.abort(); addCtl=new AbortController();
  b.disabled=true; st.className="status"; st.textContent="Claudeが作っています…";
  try{
    const m=await claudeFill([{k,j:document.getElementById("f-j").value.trim()}],addCtl.signal);
    const f=m.get(k)||[...m.values()][0]; if(!f) throw {code:"invalid_json"};
    const set=(id,val)=>{ const el=document.getElementById(id); if(el && !el.value.trim() && val) el.value=val };
    set("f-j",f.j); set("f-ex",f.ex); set("f-exj",f.exj); set("f-chunk",f.chunk);
    if(!document.getElementById("f-pos").value && f.pos) document.getElementById("f-pos").value=f.pos;
    if(!document.getElementById("f-adv").value && f.adv) document.getElementById("f-adv").value=f.adv;
    st.textContent="埋めました。内容を確認して「追加する」を押してください";
  }catch(e){ st.className="status err"; st.textContent=sampleErrText(e) }
  finally{ b.disabled=false }
}

function renderList(){
  const chips=document.getElementById("chips"), list=document.getElementById("list");
  if(!chips||!list) return;
  const wn=weakList().length, gs=groups();
  if(book.f==="C") book.f="all";
  if(book.f.startsWith("g:") && !gs.includes(book.f.slice(2))) book.f="all";
  if(book.f==="W"&&!wn) book.f="all";
  const rn=repeatList().length;
  if(book.f==="RW"&&!rn) book.f="all";
  if(book.f==="DONE"&&!ALL.some(w=>isDone(w.k))) book.f="all";
  // 色の点つき（一覧の単語の点と同じ色）
  const chip=(v,l,n,dis,dot)=>`<button type="button" data-f="${esc(v)}" aria-pressed="${book.f===v}" ${dis?"disabled":""}>${dot?`<span class="dot ${dot}"></span>`:""}${esc(l)} ${n}</button>`;
  chips.innerHTML = chip("all","全部",ALL.length)+chip("M","中級",bySetM().length,0,"M")+chip("L","4級",bySetL().length,0,"L")+chip("A","頻出A",bySetA().length,0,"A")+chip("B","頻出B",bySetB().length,0,"B")+chip("D","頻出C",bySetD().length,0,"D")+chip("HJ","漢字語",typeList("hj").length)+chip("MU","意味が多い語",typeList("mu").length)+chip("UD","増える・減る",udBook().length)
    + gs.map((g,i)=>chip("g:"+g,g,groupList(g).length,0,"C"+(i%3))).join("")
    + chip("ADV","副詞",advList().length)+chip("W","苦手",wn,!wn)+chip("RW","くり返し苦手",rn,!rn)+chip("DONE","覚えた",ALL.filter(w=>isDone(w.k)).length,!ALL.some(w=>isDone(w.k)));
  chips.querySelectorAll("button").forEach(b=>b.onclick=()=>{book.f=b.dataset.f;renderList()});
  let items = book.f==="UD"?udBook():book.f==="HJ"?typeList("hj"):book.f==="MU"?typeList("mu"):book.f==="all"?ALL:book.f==="A"?bySetA():book.f==="B"?bySetB():book.f==="D"?bySetD():book.f==="M"?bySetM():book.f==="L"?bySetL():book.f==="ADV"?advList():book.f.startsWith("g:")?groupList(book.f.slice(2)):book.f==="DONE"?ALL.filter(w=>isDone(w.k)):book.f==="RW"?repeatList():weakList();
  const q=book.q;
  if(q) items = items.filter(w=>w.k.includes(q)||w.j.includes(q));
  if(!items.length){ list.innerHTML=`<div class="list"><div class="empty">${q?"見つかりませんでした":"まだ単語がありません。上の「＋ 単語を追加」から入れられます"}</div></div>`; return }
  if(book.f==="HJ"){
    const gs={}, order=[];
    items.forEach(w=>{ const key=w.k[0]+"＝"+[...hanjaOf(w)][0]; if(!gs[key]){gs[key]=[];order.push(key)} gs[key].push(w) });
    const multi=order.filter(k=>gs[k].length>1).sort((a,b)=>gs[b].length-gs[a].length), rest=order.filter(k=>gs[k].length===1).flatMap(k=>gs[k]);
    list.innerHTML = multi.map(k=>`<div class="glabel">${esc(k)}<small>同じ漢字ではじまる語</small></div><div class="list">${gs[k].map(rowHtml).join("")}</div>`).join("")
      + (rest.length?`<div class="glabel">その他<small>漢字語</small></div><div class="list">${rest.map(rowHtml).join("")}</div>`:"");
    bindList(list); return;
  }
  if(book.f==="ADV"){
    list.innerHTML = ADV_GROUPS.map(([g,d])=>{
      const gi=items.filter(w=>advOf(w).g===g);
      return gi.length?`<div class="glabel">${g}<small>${d}</small></div><div class="list">${gi.map(rowHtml).join("")}</div>`:"";
    }).join("");
  } else {
    list.innerHTML = `<div class="list">${items.map(rowHtml).join("")}</div>`;
  }
  bindList(list);
}
// 一覧では見出しだけ作り、中身（似てる単語など重い計算）は開いたときに作る
function rowHtml(w){
  const open=book.open===w.k;
  return `<details data-k="${esc(w.k)}" ${open?"open":""}>
      <summary><b><span class="dot ${dotCls(w)}"></span>${esc(w.k)}</b><span>${esc(w.j)}</span>${isDone(w.k)?(isDue(w.k)?`<em class="dueb">確認</em>`:`<em class="doneb">覚えた</em>`):weak[w.k]||isRepeat(w.k)?`<em class="weakb ${isRepeat(w.k)?"rp":""}" title="通算で間違えた回数">${isRepeat(w.k)?"くり返し ":""}×${missTot(w.k)}</em>`:streakOf(w.k)?stkHtml(w.k):"<i></i>"}</summary>
      ${open?entryHtml(w):""}
    </details>`;
}
function entryHtml(w){
  {
    const ns=notesFor(w.k);
    const auto=lookalikes(w,4,0).filter(x=>!ns.some(n=>n.w.includes(x.k))).slice(0,3);
    const simBtns=[...new Set(ns.flatMap(n=>n.w))].filter(k=>k!==w.k).map(k=>ALL.find(x=>x.k===k)).filter(Boolean)
      .concat(auto).map(x=>`<button type="button" data-jump="${esc(x.k)}"><b>${esc(x.k)}</b> ${esc(x.j)}</button>`).join("");
    return `<div class="entry">
        ${w.ex?`<div class="exrow">${speakBtn(w.ex)}<div><div class="exk">${esc(w.ex)}</div><div class="exj">${esc(w.exj||"")}</div></div></div>`:`<div class="exrow">${speakBtn(w.k)}<div class="exj">例文はまだありません</div></div>`}
        ${chunkOf(w)?`<p class="chunk"><span>セットで</span>${esc(chunkOf(w))}</p>`:""}
        ${w.note?`<div class="note">${esc(w.note)}</div>`:""}
        ${ns.map(n=>`<div class="tip"><span class="tl">見分けポイント</span>${n.t}</div>`).join("")}
        ${picFor(w.k)}
        ${simBtns?`<div class="sim"><span class="l">似てる</span>${simBtns}</div>`:""}
        <div class="mrow">${isDone(w.k)?`<span class="doneb">覚えた</span><span class="mtxt">${isDue(w.k)?"今日確認の日":`次の確認 ${esc(addDays(mastery.chk[w.k]||mastery.done[w.k],reviewDays(w.k)).slice(5).replace("-","/"))}`}</span><button type="button" class="del" data-unmaster="${esc(w.k)}">覚えたを外す</button>`
          :`<span class="stk">${Array.from({length:MASTER_N},(_,i)=>`<i class="${i<Math.min(streakOf(w.k),MASTER_N)?"on":""}"></i>`).join("")}</span><span class="mtxt">連続正解 ${Math.min(streakOf(w.k),MASTER_N)} / ${MASTER_N}${countedToday(w.k)?"（今日はカウント済み）":""}</span><button type="button" class="del" data-master="${esc(w.k)}">覚えたにする</button>`}</div>
        ${weak[w.k]?`<p class="wkst"><b>苦手</b>（通算 ${missTot(w.k)}回）　外れるまで<i>${Array.from({length:WEAK_CLEAR_N},(_,i)=>`<span class="${i<clrOf(w.k)?"on":""}"></span>`).join("")}</i> 日を変えて${WEAK_CLEAR_N}回続けて正解</p>`
          :missTot(w.k)?`<p class="wkst">通算 ${missTot(w.k)}回まちがえた${isRepeat(w.k)&&!isDone(w.k)?"・<b>くり返し苦手</b>（覚えたになると外れる）":""}</p>`:""}
        ${w.set==="C" && !w.fixed?`<button type="button" class="del" data-del="${esc(w.id||w.k)}">この単語を削除</button>`:""}
      </div>`;
  }
}
function bindList(list){
  list.querySelectorAll("details").forEach(d=>d.addEventListener("toggle",()=>{
    if(d.open){
      book.open=d.dataset.k;
      if(!d.querySelector(".entry")){ const w=ALL.find(x=>x.k===d.dataset.k); if(w){ d.insertAdjacentHTML("beforeend",entryHtml(w)); bindEntry(d,list) } }
    } else if(book.open===d.dataset.k) book.open=null;
  }));
  bindEntry(list,list);
}
function bindEntry(root,list){
  root.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{
    book.q=""; book.f="all"; book.open=b.dataset.jump;
    document.getElementById("q").value=""; renderList();
    const el=list.querySelector(`details[data-k="${CSS.escape(b.dataset.jump)}"]`); if(el) el.scrollIntoView({block:"center"});
  });
  root.querySelectorAll("[data-master]").forEach(b=>b.onclick=()=>{ const k=b.dataset.master; mastery.done[k]=today(); mastery.chk[k]=today(); mastery.streak[k]=Math.max(streakOf(k),MASTER_N); saveMastery(); renderList() });
  root.querySelectorAll("[data-unmaster]").forEach(b=>b.onclick=()=>{ const k=b.dataset.unmaster; delete mastery.done[k]; delete mastery.chk[k]; delete mastery.last[k]; mastery.streak[k]=0; saveMastery(); renderList() });
  root.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{
    if(!b.classList.contains("arm")){ b.classList.add("arm"); b.textContent="もう一度押すと削除"; return }
    delWord(b.dataset.del);
  });
}
async function delWord(id){
  try{
    if(db && !dbFail && !String(id).startsWith("l")){ await db.doc("words/"+id).delete() }
    else { custom=custom.filter(w=>(w.id||w.k)!==id); store.set("kq-custom",custom); rebuild(); renderList() }
  }catch(e){}
}
