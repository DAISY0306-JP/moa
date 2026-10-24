// ---------- 書き 51・52 ----------
// オリジナル問題（TOPIK II 쓰기 51・52 の形式）
let wdata = store.get("kq-writing",{});   // {id: {a,b,fb,at}}
let wcur = null, wSample = null, wSampleChecked = false, wCtl = null;

function wStatus(id){
  const d=wdata[id];
  if(!d) return `<span class="wst">未挑戦</span>`;
  if(d.fb && typeof d.fb.a?.score==="number") return `<span class="wst done">${(d.fb.a.score||0)+(d.fb.b?.score||0)} / 10</span>`;
  return `<span class="wst">解答あり</span>`;
}
function writeView(){
  view="write";
  const sec = no => `<div class="glabel">${W_INFO[no].name}</div>
    <p class="hint">${W_INFO[no].how}</p>
    <div class="list">${WRITE.filter(p=>p.no===no).map(p=>`<button type="button" class="wrow" data-w="${p.id}">
      <span class="wid">${p.id}</span><span class="wt"><b>${esc(p.title)}</b><small>${esc(p.jp)}</small></span>${wStatus(p.id)}</button>`).join("")}</div>`;
  $app.innerHTML = `
  <header class="hd"><h1>書き 51〜54</h1><p class="hd-sub"><span>TOPIK II 쓰기</span><span>51・52 各10点</span><span>53 30点</span><span>54 50点</span></p></header>
  ${tabs()}
  ${sec(51)}${sec(52)}${sec53()}${sec54()}
  <p class="hint">問題は練習用のオリジナルです。答えはこのページに保存されるので、あとから見直せます。</p>`;
  bindTabs();
  $app.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>openProblem(b.dataset.w));
  bind53(); bind54();
}
function wText(p){
  return esc(p.text).replace(/\(\s*㉠\s*\)/,'<span class="wblank">㉠</span>').replace(/\(\s*㉡\s*\)/,'<span class="wblank">㉡</span>').replace(/\n/g,"<br>");
}
function styleWarn(p,ans){
  const t=norm(ans); if(!t) return "";
  const out=[];
  const sentences = String(ans).trim().split(/[.!?。]\s*(?=\S)/).length;
  if(sentences>1) out.push("一文で書きます（文が2つ以上あるようです）");
  if(p.no===52 && /(요|니다|니까|세요|십시오)$/.test(t)) out.push("52は -ㄴ/는다体で書きます（〜요・〜습니다で終わると減点）");
  if(p.no===51 && /다$/.test(t) && !/(니다)$/.test(t) && /니다/.test(p.text)) out.push("前後が -습니다体なので、〜다 ではなく -습니다体に合わせましょう");
  if(p.no===51 && /요$/.test(t) && /니다/.test(p.text) && !/세요$/.test(p.text.split(/\(\s*㉡\s*\)/)[1]||"")) out.push("前後が -습니다体なので、そろえると安全です");
  return out.join("／");
}
async function getSample(){
  if(wSampleChecked) return wSample;
  wSampleChecked=true;
  try{ wSample = window.claude?.use ? await claude.use("sample") : null }catch(e){ wSample=null }
  return wSample;
}
function openProblem(id){
  const p=WRITE.find(x=>x.id===id); if(!p) return;
  wcur=p; view="wprob";
  const prev=wdata[id]||{};
  $app.innerHTML = `
  <div class="topbar"><button class="quit" id="wback">← 問題一覧</button><span class="count">${p.id}</span></div>
  <div class="wq">
    <div class="label">${W_INFO[p.no].name} · ${esc(p.jp)}</div>
    <p class="hint">${W_INFO[p.no].how}</p>
    <div class="wtext">${wText(p)}</div>
  </div>
  <div class="wans">
    <label for="wa"><span class="wblank">㉠</span></label>
    <textarea id="wa" rows="2" lang="ko" spellcheck="false" placeholder="ハングルで一文">${esc(prev.a||"")}</textarea>
    <p class="warn" id="wa-w"></p>
    <label for="wb"><span class="wblank">㉡</span></label>
    <textarea id="wb" rows="2" lang="ko" spellcheck="false" placeholder="ハングルで一文">${esc(prev.b||"")}</textarea>
    <p class="warn" id="wb-w"></p>
  </div>
  <details class="whint"><summary>ヒントを見る</summary><p><b>㉠</b> ${esc(p.pa)}</p><p><b>㉡</b> ${esc(p.pb)}</p></details>
  <div class="wbtns">
    <button class="primary" id="wgrade" hidden>Claudeに添削してもらう</button>
    <button class="ghost" id="wcopy">Claudeに添削を頼む（文章をコピー）</button>
    <button class="ghost" id="wmodel">模範解答と比べる</button>
  </div>
  <p class="status" id="wstat" role="status"></p>
  <div id="wout"></div>`;
  document.getElementById("wback").onclick=()=>{ wCtl?.abort(); writeView() };
  bindAskClaude("wcopy","51",p);
  const wa=document.getElementById("wa"), wb=document.getElementById("wb");
  const check=()=>{ document.getElementById("wa-w").textContent=styleWarn(p,wa.value); document.getElementById("wb-w").textContent=styleWarn(p,wb.value) };
  wa.oninput=check; wb.oninput=check; check();
  document.getElementById("wmodel").onclick=()=>{ saveWriting(p.id,{a:wa.value.trim(),b:wb.value.trim()}); showModel(p) };
  getSample().then(s=>{ if(s && view==="wprob" && wcur===p) document.getElementById("wgrade").hidden=false });
  document.getElementById("wgrade").onclick=()=>gradeWriting(p);
  if(prev.fb) renderFeedback(p,prev.fb,prev);
}
function showModel(p){
  const out=document.getElementById("wout");
  const mine=wdata[p.id]||{};
  out.innerHTML = `<div class="wmodel">
    ${["a","b"].map(k=>`<div class="wm"><div class="wm-h"><span class="wblank">${k==="a"?"㉠":"㉡"}</span>模範解答</div>
      <ul>${p[k].map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      ${mine[k]?`<div class="wm-mine"><span>あなた</span>${esc(mine[k])}</div>`:""}
      <p class="wm-p">${esc(k==="a"?p.pa:p.pb)}</p></div>`).join("")}
    <div class="wcheck"><div class="label">自分でチェック</div>
      <label><input type="checkbox"> 前後の文とつながる内容になっている</label>
      <label><input type="checkbox"> ${p.no===52?"-ㄴ/는다体（〜다）で書いた":"前後と同じ文体（-습니다体など）で書いた"}</label>
      <label><input type="checkbox"> それぞれ一文で書いた</label>
      <label><input type="checkbox"> つづり・パッチムの間違いがない</label>
    </div></div>`;
}
async function gradeWriting(p){
  const a=document.getElementById("wa").value.trim(), b=document.getElementById("wb").value.trim();
  const st=document.getElementById("wstat"), btn=document.getElementById("wgrade");
  if(!a && !b){ st.className="status err"; st.textContent="㉠か㉡に答えを書いてから添削できます"; return }
  const sample=await getSample(); if(!sample) return;
  const crit = p.no===52
    ? "書き言葉の -ㄴ/는다体（〜다）で書けているか。-요・-습니다で終わる答えは文体の減点"
    : "前後の文の文体（主に -습니다体）に合っているか";
  const prompt = `あなたはTOPIK II 쓰기の採点者です。${p.no}番（${p.no===51?"実用文":"説明文"}）の空欄問題の解答を採点してください。

問題文:
${p.text}

模範解答（参考。意味と形が合っていれば別の表現も正解）:
㉠: ${p.a.join(" / ")}
㉡: ${p.b.join(" / ")}

受験者の解答:
㉠: ${a||"（空欄）"}
㉡: ${b||"（空欄）"}

採点基準（各空欄5点、整数）:
- 前後の文脈に合った内容か
- 文法・語彙・つづりが正確か
- ${crit}
- 一文で書けているか
空欄は0点。

JSONだけで答えてください。形:
{"a":{"score":0,"comment":"日本語で1〜2文。良い点と直す点","fixed":"受験者の答えをできるだけ生かした修正案（韓国語の一文。直す必要がなければ受験者の答えのまま）"},"b":{"score":0,"comment":"","fixed":""},"advice":"全体へのひとこと（日本語で1文）"}`;
  wCtl?.abort(); wCtl=new AbortController();
  btn.disabled=true; st.className="status"; st.innerHTML=`添削中…（数十秒かかることがあります） <button class="linkbtn" id="wstop">止める</button>`;
  document.getElementById("wstop").onclick=()=>wCtl.abort();
  try{
    const fb = await sample.json(prompt,{signal:wCtl.signal});
    const clean = k => ({score:Math.max(0,Math.min(5,Math.round(+fb?.[k]?.score||0))), comment:String(fb?.[k]?.comment||""), fixed:String(fb?.[k]?.fixed||"")});
    const res = {a:clean("a"), b:clean("b"), advice:String(fb?.advice||"")};
    const rec = {a,b,fb:res};
    saveWriting(p.id,rec);
    if(view==="wprob" && wcur===p){ st.textContent=""; renderFeedback(p,res,rec) }
  }catch(e){
    if(view!=="wprob"||wcur!==p) return;
    const code=e?.code;
    st.className = code==="cancelled" ? "status" : "status err";
    st.textContent = code==="cancelled" ? "止めました"
      : (code==="not_granted"||code==="sampling_disabled"||code==="not_declared"||code==="capability_disabled"||code==="capability_removed") ? "このページからClaudeを使えないため、添削はできません。「模範解答と比べる」で確認してください"
      : code==="rate_limited" ? "利用が集中しています。少し時間をおいてもう一度押してください"
      : code==="invalid_json" ? "添削結果をうまく読み取れませんでした。もう一度押してください"
      : "添削できませんでした。通信状態を確認してもう一度押してください";
    if(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(code)) btn.hidden=true;
  }finally{ btn.disabled=false }
}
function renderFeedback(p,fb,rec){
  const out=document.getElementById("wout"); if(!out) return;
  const total=(fb.a?.score||0)+(fb.b?.score||0);
  const part = k => { const f=fb[k]||{}; const mine=rec[k]||""; return `<div class="fb">
    <div class="fb-h"><span class="wblank">${k==="a"?"㉠":"㉡"}</span><span class="fb-s s${f.score}">${f.score??0} / 5</span></div>
    <div class="fb-mine">${esc(mine)||"<i>（空欄）</i>"}</div>
    <p>${esc(f.comment)}</p>
    ${f.fixed&&norm(f.fixed)!==norm(mine)?`<div class="fb-fix"><span>修正案</span>${esc(f.fixed)}</div>`:""}
  </div>` };
  out.innerHTML = `<div class="fbbox">
    <div class="fb-total"><span>Claudeの採点（目安）</span><b>${total}</b><small>/ 10</small></div>
    ${part("a")}${part("b")}
    ${fb.advice?`<p class="fb-adv">${esc(fb.advice)}</p>`:""}
    <button class="linkbtn" id="wshowmodel">模範解答も見る</button>
  </div>`;
  document.getElementById("wshowmodel").onclick=()=>{ showModel(p); };
}
let wDoc=null;
function saveWriting(id,rec){
  const prev=wdata[id]||{};
  const next=Object.assign({},prev,rec,{at:new Date().toISOString()});
  if(!("fb" in rec) && (rec.a!==prev.a || rec.b!==prev.b || rec.text!==prev.text)) delete next.fb; // 答えが変わったら古い添削は外す
  wdata=Object.assign({},wdata,{[id]:next});
  store.set("kq-writing",wdata);
  if(db && !dbFail){ db.doc("writing/"+id).set(next).catch(()=>{}) }
}
