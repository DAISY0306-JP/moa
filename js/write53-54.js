// ---------- 書き 53（グラフ・表の説明）：型を覚える ----------
// 練習問題（データは練習用の架空のもの）
function chart53(c){
  const max=Math.max(...c.rows.map(r=>r[1]));
  return `<figure class="c53" role="img" aria-label="${esc(c.t)}：${c.rows.map(([l,v])=>esc(l)+" "+v+esc(c.unit)).join("、")}">
    <figcaption>${esc(c.t)}<small>（単位：${esc(c.unit)}）</small></figcaption>
    ${c.rows.map(([l,v])=>`<div class="c53r"><span class="c53l">${esc(l)}</span><span class="c53b"><i style="width:${Math.max(4,v/max*100)}%"></i></span><span class="c53v">${v}</span></div>`).join("")}
  </figure>`;
}
function sec53(){
  const st = id => { const d=wdata[id]; if(!d) return `<span class="wst">未挑戦</span>`; if(d.fb && typeof d.fb.total==="number") return `<span class="wst done">${d.fb.total} / 30</span>`; return `<span class="wst">解答あり</span>` };
  return `<div class="glabel">53 グラフ・表の説明</div>
    <p class="hint">200〜300字でグラフを説明する問題（30点）。今回は「型」を覚えて、数字を当てはめて書ければ十分。-다 体（한다体）で書きます。</p>
    <details class="t53" ${book.t53open?"open":""} id="t53"><summary>型を見る（6パーツ）</summary>
      ${T53.map(g=>`<div class="t53g"><b>${esc(g.h)}</b>${g.rows.map(([k,j])=>`<div class="t53r">${speakBtn(k.replace(/[○◇◆▲△□]/g,""))}<div><div class="exk">${esc(k)}</div><div class="exj">${esc(j)}</div></div></div>`).join("")}</div>`).join("")}
      <p class="hint">基本の流れ：①導入 →（②順位 か ③増減、男女なら④）→ ⑤原因・理由 → ⑥まとめ・展望。グラフにある情報は全部入れるのがコツ。</p>
    </details>
    <button type="button" class="ghost" id="d53">表現ドリル（${D53.length}問）</button>
    <div class="list">${P53.map(p=>`<button type="button" class="wrow" data-w53="${p.id}">
      <span class="wid">${p.id}</span><span class="wt"><b>${esc(p.title)}</b><small>${esc(p.jp)}</small></span>${st(p.id)}</button>`).join("")}</div>`;
}
function bind53(){
  const t=document.getElementById("t53"); if(t) t.addEventListener("toggle",()=>{ book.t53open=t.open });
  const d=document.getElementById("d53"); if(d) d.onclick=()=>{ drun={list:shuffle(D53),i:0,ok:0,miss:[],kind:"53"}; view="d53"; dQuestion() };
  $app.querySelectorAll("[data-w53]").forEach(b=>b.onclick=()=>open53(b.dataset.w53));
}
// --- 表現ドリル
let drun=null;
function dQuestion(){
  const x=drun.list[drun.i], pct=drun.i/drun.list.length*100;
  const opts=shuffle([[x.a,true],...x.w.map(f=>[f,false])]);
  const [pre,post]=x.s.split("{}");
  $app.innerHTML=`
  <div class="topbar"><button class="quit" id="quit">← やめる</button><div class="bar"><i style="width:${pct}%"></i></div><div class="count">${drun.i+1} / ${drun.list.length}</div></div>
  <p class="gask">${drun.kind=="54"?"54":"53"}番の決まり文句：（　）に入るものは？</p>
  <div class="card gcard"><span class="tag">${drun.kind=="54"?"54":"53"} 表現</span><span id="spk"></span><div class="gs" id="gs">${esc(pre)}<span class="blank">&nbsp;</span>${esc(post)}</div></div>
  <div class="choices ko">${opts.map((o,i)=>`<button type="button" data-i="${i}">${esc(o[0])}</button>`).join("")}</div>
  <div id="after"></div><button class="primary" id="next" hidden>次へ</button>`;
  document.getElementById("quit").onclick=writeView;
  const btns=[...$app.querySelectorAll(".choices button")];
  btns.forEach(b=>b.onclick=()=>{
    const [f,ok]=opts[+b.dataset.i];
    btns.forEach(y=>{ y.disabled=true; if(opts[+y.dataset.i][1]) y.classList.add("right") });
    if(!ok) b.classList.add("wrong");
    if(ok) drun.ok++; else drun.miss.push(x);
    const full=x.s.replace("{}",x.a);
    document.getElementById("gs").innerHTML=`${esc(pre)}<b class="fill">${esc(x.a)}</b>${esc(post)}`;
    document.getElementById("spk").innerHTML=speakBtn(full);
    document.getElementById("after").innerHTML=`<div class="fbk"><div class="fr ${ok?"ok":"ng"}"><span class="mk">${ok?"○":"×"}</span><div><small>${ok?"正解！":"正解は"}</small><b>${esc(x.a)}</b></div></div><p class="fpt">${esc(x.n)}</p></div>`;
    const n=document.getElementById("next"); n.hidden=false; n.focus();
    n.onclick=()=>{ drun.i++; drun.i<drun.list.length?dQuestion():dResult() };
  });
}
function dResult(){
  view="d53r";
  $app.innerHTML=`
  <header class="hd"><h1>結果</h1><p class="hd-sub"><span>${drun.kind=="54"?"54":"53"} 表現ドリル</span></p></header>
  <div class="card" style="min-height:0"><div class="score">${drun.ok}<small> / ${drun.list.length}</small></div></div>
  ${drun.miss.length?`<div class="group"><div class="label">間違えた表現（${drun.miss.length}）</div><div class="miss">${drun.miss.map(x=>`<div><b>${esc(x.a)}</b><span><span class="inline-ko">${esc(x.s.replace("{}",x.a))}</span><em>${esc(x.n)}</em></span></div>`).join("")}</div></div>
  <button class="primary" id="dretry">間違えたのだけもう一回</button>`:""}
  <button class="ghost" id="dback">書きに戻る</button>`;
  const r=document.getElementById("dretry"); if(r) r.onclick=()=>{ drun={list:shuffle(drun.miss),i:0,ok:0,miss:[],kind:drun.kind}; view="d53"; dQuestion() };
  document.getElementById("dback").onclick=writeView;
}
// --- 練習問題
const len53 = t => [...String(t||"").replace(/\r?\n/g,"")].length;
function warn53(t){
  const s=String(t||"").trim(); if(!s) return "";
  const out=[], n=len53(s);
  if(n<200) out.push(`あと${200-n}字で200字`); else if(n>300) out.push(`${n-300}字オーバー（300字まで）`);
  if(/(요|니다)[.!?]?(\s|$)/.test(s)) out.push("-요・-습니다 で終わる文があります。53は -다 体で");
  return out.join("／");
}
function open53(id){
  const p=P53_BY[id]; if(!p) return;
  view="w53"; wcur=p;
  const prev=wdata[id]||{};
  $app.innerHTML=`
  <div class="topbar"><button class="quit" id="wback">← 問題一覧</button><span class="count">${p.id}</span></div>
  <div class="wq">
    <div class="label">53 グラフ・表の説明 · ${esc(p.jp)}</div>
    <p class="wtext53">다음을 참고하여 '${esc(p.title)}'에 대한 글을 200~300자로 쓰십시오. 단, 글의 제목을 쓰지 마십시오.</p>
    <div class="wfig">
      <p class="wwho">조사: ${esc(p.who)}</p>
      <div class="cgrid">${p.charts.map(chart53).join("")}</div>
      ${p.info.map(i=>`<p class="winfo">${esc(i)}</p>`).join("")}
      <p class="hint">※ 練習用の架空のデータです</p>
    </div>
  </div>
  <div class="wans">
    <label for="w53t">答え<span class="wcnt" id="w53c">${len53(prev.text)}字</span></label>
    <textarea id="w53t" rows="8" lang="ko" spellcheck="false" placeholder="型を使って200〜300字で">${esc(prev.text||"")}</textarea>
    <p class="warn" id="w53w"></p>
  </div>
  <details class="whint"><summary>入れるべき情報（ヒント）</summary><p>${p.pts.map(esc).join(" → ")}</p></details>
  <div class="wbtns">
    <button class="primary" id="w53g" hidden>Claudeに添削してもらう</button>
    <button class="ghost" id="w53cp">Claudeに添削を頼む（文章をコピー）</button>
    <button class="ghost" id="w53m">模範解答と比べる</button>
  </div>
  <p class="status" id="wstat" role="status"></p>
  <div id="wout"></div>`;
  document.getElementById("wback").onclick=()=>{ wCtl?.abort(); writeView() };
  bindAskClaude("w53cp","53",p);
  const ta=document.getElementById("w53t");
  const upd=()=>{ const n=len53(ta.value); const c=document.getElementById("w53c"); c.textContent=`${n}字`; c.className="wcnt "+(n>=200&&n<=300?"ok":n?"ng":""); document.getElementById("w53w").textContent=warn53(ta.value) };
  ta.oninput=upd; upd();
  document.getElementById("w53m").onclick=()=>{ saveWriting(p.id,{text:ta.value.trim()}); show53Model(p) };
  getSample().then(s=>{ if(s && view==="w53" && wcur===p) document.getElementById("w53g").hidden=false });
  document.getElementById("w53g").onclick=()=>grade53(p);
  if(prev.fb) render53(p,prev.fb);
}
function show53Model(p){
  document.getElementById("wout").innerHTML=`<div class="wmodel">
    <div class="wm"><div class="wm-h">模範解答<span class="wcnt">${len53(p.model)}字</span></div>
      <p class="m53">${esc(p.model)}</p>${speakBtn(p.model)}</div>
    <div class="wcheck"><div class="label">自分でチェック</div>
      ${p.pts.map(t=>`<label><input type="checkbox"> ${esc(t)}を書いた</label>`).join("")}
      <label><input type="checkbox"> 全部 -다 体で書いた</label>
      <label><input type="checkbox"> 200〜300字に収まった</label>
    </div></div>`;
}
async function grade53(p){
  const text=document.getElementById("w53t").value.trim();
  const st=document.getElementById("wstat"), btn=document.getElementById("w53g");
  if(!text){ st.className="status err"; st.textContent="答えを書いてから添削できます"; return }
  const sample=await getSample(); if(!sample) return;
  const data=p.charts.map(c=>`${c.t}（${c.unit}）: `+c.rows.map(([l,v])=>`${l} ${v}`).join(", ")).join("\n")+(p.info.length?"\n"+p.info.join("\n"):"");
  const prompt=`あなたはTOPIK II 쓰기 53番（グラフ・表の説明、30点、200〜300字）の採点者です。受験者は日本語話者で、今回は${exam.goal}級を目指しています。

問題: '${p.title}'에 대한 글을 200~300자로 쓰십시오. 조사: ${p.who}
データ:
${data}

模範解答（参考）:
${p.model}

受験者の解答（${len53(text)}字）:
${text}

採点の観点（合計30点の目安）:
- 内容（グラフ・資料の情報を漏れなく正確に書いたか）
- 構成（導入→結果→理由や展望→まとめ の流れになっているか）
- 言語使用（中級レベルの文法・語彙を正確に使い、全体を -다 体（한다体）で書いているか。つづり）
字数が200字未満・300字超なら減点。

JSONだけで答えてください。形:
{"total":0,"content":"内容について日本語で1〜2文","structure":"構成について日本語で1〜2文","language":"言語使用について日本語で1〜2文（よくある間違いを具体的に）","missing":["書けていない情報（日本語で短く）"],"fixed":"受験者の文章をできるだけ生かして直した全文（韓国語、-다体、200〜300字）"}`;
  wCtl?.abort(); wCtl=new AbortController();
  btn.disabled=true; st.className="status"; st.innerHTML=`添削中…（数十秒かかることがあります） <button class="linkbtn" id="wstop">止める</button>`;
  document.getElementById("wstop").onclick=()=>wCtl.abort();
  try{
    const fb=await sample.json(prompt,{signal:wCtl.signal});
    const res={total:Math.max(0,Math.min(30,Math.round(+fb?.total||0))),content:String(fb?.content||""),structure:String(fb?.structure||""),language:String(fb?.language||""),missing:(Array.isArray(fb?.missing)?fb.missing:[]).map(String).slice(0,6),fixed:String(fb?.fixed||"")};
    saveWriting(p.id,{text,fb:res});
    if(view==="w53" && wcur===p){ st.textContent=""; render53(p,res) }
  }catch(e){
    if(view!=="w53"||wcur!==p) return;
    st.className = e?.code==="cancelled" ? "status" : "status err"; st.textContent = sampleErrText(e);
  }finally{ btn.disabled=false }
}
function render53(p,fb){
  const out=document.getElementById("wout"); if(!out) return;
  out.innerHTML=`<div class="fbbox">
    <div class="fb-total"><span>Claudeの採点（目安）</span><b>${fb.total}</b><small>/ 30</small></div>
    <div class="fb"><div class="fb-h">内容</div><p>${esc(fb.content)}</p>
      ${fb.missing?.length?`<p class="fb-miss">抜けている情報：${fb.missing.map(esc).join("、")}</p>`:""}</div>
    <div class="fb"><div class="fb-h">構成</div><p>${esc(fb.structure)}</p></div>
    <div class="fb"><div class="fb-h">言葉の使い方</div><p>${esc(fb.language)}</p></div>
    ${fb.fixed?`<div class="fb"><div class="fb-h">修正版<span class="wcnt">${len53(fb.fixed)}字</span></div><p class="m53">${esc(fb.fixed)}</p></div>`:""}
    <button class="linkbtn" id="w53sm">模範解答も見る</button>
  </div>`;
  document.getElementById("w53sm").onclick=()=>show53Model(p);
}

// ---------- 書き 54（600〜700字の作文） ----------
// 練習問題（オリジナル）
const len54 = len53;
function warn54(t){
  const s=String(t||"").trim(); if(!s) return "";
  const out=[], n=len54(s);
  if(n<600) out.push(`あと${600-n}字で600字`); else if(n>700) out.push(`${n-700}字オーバー（700字まで）`);
  if(/(요|니다)[.!?]?(\s|$)/.test(s)) out.push("-요・-습니다 で終わる文があります。54は -다 体で");
  return out.join("／");
}
function sec54(){
  const st = id => { const d=wdata[id]; if(!d) return `<span class="wst">未挑戦</span>`; if(d.fb && typeof d.fb.total==="number") return `<span class="wst done">${d.fb.total} / 50</span>`; return `<span class="wst">解答あり</span>` };
  return `<div class="glabel">54 作文</div>
    <p class="hint">テーマについて600〜700字で自分の考えを書く問題（50点）。4級を取るには、ここで点を積めるかが大きいです。序論 → 本論（長所・問題点・方法や意見）→ 結論の型で、-다 体で書きます。</p>
    <details class="t53" ${book.t54open?"open":""} id="t54"><summary>型を見る（5パーツ）</summary>
      ${T54.map(g=>`<div class="t53g"><b>${esc(g.h)}</b>${g.rows.map(([k,j])=>`<div class="t53r">${speakBtn(k.replace(/~/g,""))}<div><div class="exk">${esc(k)}</div><div class="exj">${esc(j)}</div></div></div>`).join("")}</div>`).join("")}
      <p class="hint">段落ごとに改行して、問題の3つの問いに全部答えるのがコツ。空白も1字に数えます。</p>
    </details>
    <button type="button" class="ghost" id="d54">表現ドリル（${D54.length}問）</button>
    <div class="list">${P54.map(p=>`<button type="button" class="wrow" data-w54="${p.id}">
      <span class="wid">${p.id}</span><span class="wt"><b>${esc(p.title)}</b><small>${esc(p.jp)}</small></span>${st(p.id)}</button>`).join("")}</div>`;
}
function bind54(){
  const t=document.getElementById("t54"); if(t) t.addEventListener("toggle",()=>{ book.t54open=t.open });
  const d=document.getElementById("d54"); if(d) d.onclick=()=>{ drun={list:shuffle(D54),i:0,ok:0,miss:[],kind:"54"}; view="d53"; dQuestion() };
  $app.querySelectorAll("[data-w54]").forEach(b=>b.onclick=()=>open54(b.dataset.w54));
}
function open54(id){
  const p=P54_BY[id]; if(!p) return;
  view="w54"; wcur=p;
  const prev=wdata[id]||{};
  $app.innerHTML=`
  <div class="topbar"><button class="quit" id="wback">← 問題一覧</button><span class="count">${p.id}</span></div>
  <div class="wq">
    <div class="label">54 作文 · ${esc(p.jp)}</div>
    <p class="wtext53">다음을 주제로 하여 자신의 생각을 600~700자로 글을 쓰십시오. 단, 문제를 그대로 옮겨 쓰지 마십시오.</p>
    <div class="wfig">
      <p class="winfo">${esc(p.intro)}</p>
      <ul class="q54">${p.qs.map(q=>`<li>${esc(q)}</li>`).join("")}</ul>
    </div>
  </div>
  <div class="wans">
    <label for="w54t">答え<span class="wcnt" id="w54c">${len54(prev.text)}字</span></label>
    <textarea id="w54t" rows="14" lang="ko" spellcheck="false" placeholder="序論・本論・結論の型で600〜700字">${esc(prev.text||"")}</textarea>
    <p class="warn" id="w54w"></p>
  </div>
  <details class="whint"><summary>入れるべき内容（ヒント）</summary><p>${p.pts.map(esc).join(" → ")}</p></details>
  <div class="wbtns">
    <button class="primary" id="w54g" hidden>Claudeに添削してもらう</button>
    <button class="ghost" id="w54cp">Claudeに添削を頼む（文章をコピー）</button>
    <button class="ghost" id="w54m">模範解答と比べる</button>
  </div>
  <p class="status" id="wstat" role="status"></p>
  <div id="wout"></div>`;
  document.getElementById("wback").onclick=()=>{ wCtl?.abort(); writeView() };
  bindAskClaude("w54cp","54",p);
  const ta=document.getElementById("w54t");
  const upd=()=>{ const n=len54(ta.value); const c=document.getElementById("w54c"); c.textContent=`${n}字`; c.className="wcnt "+(n>=600&&n<=700?"ok":n?"ng":""); document.getElementById("w54w").textContent=warn54(ta.value) };
  ta.oninput=upd; upd();
  document.getElementById("w54m").onclick=()=>{ saveWriting(p.id,{text:ta.value.trim()}); show54Model(p) };
  getSample().then(s=>{ if(s && view==="w54" && wcur===p) document.getElementById("w54g").hidden=false });
  document.getElementById("w54g").onclick=()=>grade54(p);
  if(prev.fb) render54(p,prev.fb);
}
function show54Model(p){
  document.getElementById("wout").innerHTML=`<div class="wmodel">
    <div class="wm"><div class="wm-h">模範解答<span class="wcnt">${len54(p.model)}字</span></div>
      <p class="m53 m54">${esc(p.model)}</p>${speakBtn(p.model.replace(/\n/g," "))}</div>
    <div class="wcheck"><div class="label">自分でチェック</div>
      ${p.pts.map(t=>`<label><input type="checkbox"> ${esc(t)}を書いた</label>`).join("")}
      <label><input type="checkbox"> 3つの問いに全部答えた</label>
      <label><input type="checkbox"> 全部 -다 体で書いた</label>
      <label><input type="checkbox"> 600〜700字に収まった</label>
    </div></div>`;
}
async function grade54(p){
  const text=document.getElementById("w54t").value.trim();
  const st=document.getElementById("wstat"), btn=document.getElementById("w54g");
  if(!text){ st.className="status err"; st.textContent="答えを書いてから添削できます"; return }
  const sample=await getSample(); if(!sample) return;
  const prompt=`あなたはTOPIK II 쓰기 54番（600〜700字の作文、50点）の採点者です。受験者は日本語話者で、今回は${exam.goal}級を目指しています。

問題: ${p.intro}
問い:
${p.qs.map((q,i)=>`${i+1}. ${q}`).join("\n")}

模範解答（参考）:
${p.model}

受験者の解答（${len54(text)}字）:
${text}

採点の観点（TOPIKの基準に合わせて）:
- 内容・課題遂行（12点）：3つの問いに全部答えているか、内容が豊かで主題に合っているか
- 文章の構成（12点）：序論・本論・結論の流れ、段落の分け方、つなぎの言葉が適切か
- 言語使用（26点）：中級〜上級の文法・語彙を正確かつ多様に使っているか、全体を -다 体（한다体）で書いているか、つづり
字数が600字未満・700字超なら減点。

JSONだけで答えてください。形:
{"content":0,"structure":0,"language":0,"contentNote":"内容について日本語で1〜2文","structureNote":"構成について日本語で1〜2文","languageNote":"言語使用について日本語で1〜2文（よくある間違いを具体的に）","missing":["答えていない問い・足りない内容（日本語で短く）"],"fixed":"受験者の文章をできるだけ生かして直した全文（韓国語、-다体、600〜700字、段落ごとに改行）"}`;
  wCtl?.abort(); wCtl=new AbortController();
  btn.disabled=true; st.className="status"; st.innerHTML=`添削中…（1分ほどかかることがあります） <button class="linkbtn" id="wstop">止める</button>`;
  document.getElementById("wstop").onclick=()=>wCtl.abort();
  try{
    const fb=await sample.json(prompt,{signal:wCtl.signal});
    const sc=(v,m)=>Math.max(0,Math.min(m,Math.round(+v||0)));
    const c=sc(fb?.content,12), s=sc(fb?.structure,12), l=sc(fb?.language,26);
    const res={total:c+s+l,c,s,l,content:String(fb?.contentNote||""),structure:String(fb?.structureNote||""),language:String(fb?.languageNote||""),missing:(Array.isArray(fb?.missing)?fb.missing:[]).map(String).slice(0,6),fixed:String(fb?.fixed||"")};
    saveWriting(p.id,{text,fb:res});
    if(view==="w54" && wcur===p){ st.textContent=""; render54(p,res) }
  }catch(e){
    if(view!=="w54"||wcur!==p) return;
    st.className = e?.code==="cancelled" ? "status" : "status err"; st.textContent = sampleErrText(e);
  }finally{ btn.disabled=false }
}
function render54(p,fb){
  const out=document.getElementById("wout"); if(!out) return;
  const part=(h,n,m,t,extra="")=>`<div class="fb"><div class="fb-h">${h}${typeof n==="number"?`<span class="fb-s ${n/m>=.75?"s5":n/m>=.5?"s3":""}">${n} / ${m}</span>`:""}</div><p>${esc(t)}</p>${extra}</div>`;
  out.innerHTML=`<div class="fbbox">
    <div class="fb-total"><span>Claudeの採点（目安）</span><b>${fb.total}</b><small>/ 50</small></div>
    ${part("内容・課題",fb.c,12,fb.content,fb.missing?.length?`<p class="fb-miss">足りない内容：${fb.missing.map(esc).join("、")}</p>`:"")}
    ${part("構成",fb.s,12,fb.structure)}
    ${part("言葉の使い方",fb.l,26,fb.language)}
    ${fb.fixed?`<div class="fb"><div class="fb-h">修正版<span class="wcnt">${len54(fb.fixed)}字</span></div><p class="m53 m54">${esc(fb.fixed)}</p></div>`:""}
    <button class="linkbtn" id="w54sm">模範解答も見る</button>
  </div>`;
  document.getElementById("w54sm").onclick=()=>show54Model(p);
}
const openWriting = id => String(id).startsWith("53") ? open53(id) : String(id).startsWith("54") ? open54(id) : openProblem(id);
