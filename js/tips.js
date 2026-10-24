// [韓, 意味, 例文, 例文の訳]
// 中級（3〜4級）：TOPIK II の読解・聞き取り・書きでよく出る語
// 4級：TOPIK II 4級までに押さえたい語（中級に入っていないもの）。[韓, 意味, 例文, 訳, 漢字, 空欄にする形]
// 混同しやすい組み合わせ（形・音・意味）
// 副詞：[グループ, よく一緒に使う形]
const advOf = w => ADV[w.k] ? {g:ADV[w.k][0], c:ADV[w.k][1]} : (w.adv ? {g:w.adv, c:w.chunk||""} : null);
const chunkOf = w => ADV[w.k] ? ADV[w.k][1] : (w.chunk||"");

// ---------- 苦手対策：漢字・セットで覚える・르変則・時間の副詞 ----------
// 漢字語：先頭から音節ごとに対応する漢字（-하다 などの部分は含めない）
const hanjaOf = w => HANJA[w.k] || (w.hanja ? String(w.hanja) : "");
const inAll = k => ALL.some(w=>w.k===k);
function hjIndex(){
  const pair={}, syl={};
  ALL.forEach(w=>{ const h=hanjaOf(w); [...h].forEach((c,i)=>{ const s=w.k[i]; (pair[s+c]=pair[s+c]||[]).push(w); (syl[s]=syl[s]||{})[c]=(syl[s][c]||[]).concat([w]) }) });
  return {pair,syl};
}
function hjTip(w){
  const h=hanjaOf(w); if(!h) return "";
  const {pair,syl}=hjIndex(), cs=[...h];
  const map=cs.map((c,i)=>`<b>${esc(w.k[i])}</b>＝${esc(c)}`).join("・");
  const lines=cs.map((c,i)=>{
    const s=w.k[i];
    const same=(pair[s+c]||[]).filter(x=>x.k!==w.k).slice(0,4);
    const other=Object.entries(syl[s]||{}).filter(([cc])=>cc!==c).slice(0,3);
    if(!same.length && !other.length) return "";
    return `<li><b>${esc(s)}</b>＝${esc(c)}${same.length?`　仲間：${same.map(x=>`<b>${esc(x.k)}</b> ${esc(hanjaOf(x))}`).join("・")}`:""}${other.length?`<br><span class="hjo">同じ音で別の漢字：${other.map(([cc,ws])=>`${esc(cc)}（${ws.slice(0,2).map(x=>`<b>${esc(x.k)}</b>`).join("・")}）`).join("・")}</span>`:""}</li>`;
  }).filter(Boolean).join("");
  return `<div class="tip"><span class="tl">漢字で覚える</span><b>${esc(w.k)}</b>＝${esc(h)}（${map}）${lines?`<ul class="hjl">${lines}</ul>`:""}</div>`;
}
// 意味が多い語：組み合わせる名詞で意味が決まる
const multiTip = w => MULTI[w.k] ? `<div class="tip"><span class="tl">セットで覚える</span><ul class="col">${MULTI[w.k].map(([a,b])=>`<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ul></div>` : "";
// 르変則：고르다 → 골라요
function ruConj(w){
  const k=w.k;
  if(!/르다$/.test(k) || k.length<3 || ["따르다","들르다","치르다","이르다","푸르다"].includes(k)) return null;
  const pre=k.slice(0,-2), last=pre.slice(-1), code=last.charCodeAt(0)-0xAC00;
  if(code<0||code>11171||code%28!==0) return null;
  const v=Math.floor(code/28)%21, bright=(v===0||v===8);
  const base=pre.slice(0,-1)+String.fromCharCode(last.charCodeAt(0)+8);
  return {yo:base+(bright?"라요":"러요"), past:base+(bright?"랐어요":"렀어요")};
}
const ruTip = w => { const r=ruConj(w); return r ? `<div class="tip"><span class="tl">르変則</span><b>${esc(w.k)}</b> → <b>${esc(r.yo)}</b>・<b>${esc(r.past)}</b>（르の前にㄹが入る）。この形を見たら <b>${esc(w.k)}</b> に戻す。</div>` : "" };
// 時間の副詞：線の上に並べる
const TIMEW = {"이미":[50,"すでに"],"막":[150,"ちょうど今"],"바로":[205,"すぐ"],"곧":[258,"まもなく"],"금방":[null,"さっき・すぐ"]};
function timeTip(k){
  if(!TIMEW[k]) return "";
  const col = x => x===k ? 'fill="var(--accent)" font-weight="700"' : 'fill="var(--muted)"';
  const words = Object.entries(TIMEW).filter(([w,[x]])=>x!=null && inAll(w));
  const svg = `<svg class="tlsvg" viewBox="0 0 300 116" role="img" aria-label="時間の副詞の位置">
    ${words.map(([w,[x]])=>`<text x="${x}" y="24" text-anchor="middle" font-size="15" font-family="var(--ko)" ${col(w)}>${esc(w)}</text><line x1="${x}" y1="32" x2="${x}" y2="52" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="3 3"/>`).join("")}
    <line x1="14" y1="58" x2="282" y2="58" stroke="var(--muted)" stroke-width="1.5"/><polyline points="276,53 283,58 276,63" fill="none" stroke="var(--muted)" stroke-width="1.5"/>
    <line x1="150" y1="52" x2="150" y2="64" stroke="var(--fg)" stroke-width="2"/>
    <text x="14" y="78" font-size="11" fill="var(--muted)">過去</text><text x="150" y="78" text-anchor="middle" font-size="11" fill="var(--fg)">今</text><text x="286" y="78" text-anchor="end" font-size="11" fill="var(--muted)">未来</text>
    ${inAll("금방")?`<line x1="98" y1="92" x2="208" y2="92" stroke="${k==="금방"?"var(--accent)":"var(--muted)"}" stroke-width="3" stroke-linecap="round"/><text x="153" y="110" text-anchor="middle" font-size="13" ${col("금방")}><tspan font-family="var(--ko)">금방</tspan>（さっきにも、すぐにも）</text>`:""}
  </svg>`;
  return `<div class="tip"><span class="tl">時間の線で見る</span>${svg}</div>`;
}

// ---------- 増える・減る ----------
// 分類：UI＝〜が増える、UT＝〜を増やす、DI＝〜が減る、DT＝〜を減らす
const UD_CLASS = {"늘다":"UI","늘어나다":"UI","증가하다":"UI","오르다":"UI","늘리다":"UT","상승하다":"UI","급증하다":"UI","줄다":"DI","하락하다":"DI","급감하다":"DI","줄어들다":"DI","감소하다":"DI","떨어지다":"DI","줄이다":"DT"};
const UD_MORE = ["차지하다","점점"];   // グラフの説明で一緒に使う語
const udCls = k => UD_CLASS[k]||null;
const udWords = () => ALL.filter(w=>udCls(w.k));
const udBook = () => ALL.filter(w=>udCls(w.k)||UD_MORE.includes(w.k));
// 使い分け用の例文（blank＝空欄にする形）
const UD_EX = [
  ["늘어나다","스마트폰을 사용하는 노인이 점점 늘어나고 있다.","スマホを使う高齢者がだんだん増えている。","늘어나고"],
  ["늘어나다","작년에 비해 관광객 수가 두 배로 늘어났다.","昨年に比べて観光客の数が2倍に増えた。","늘어났다"],
  ["늘리다","회사는 직원 수를 30명에서 50명으로 늘렸다.","会社は社員数を30人から50人に増やした。","늘렸다"],
  ["늘리다","건강을 위해 운동 시간을 늘리기로 했다.","健康のために運動の時間を増やすことにした。","늘리기로"],
  ["줄어들다","아이를 낳는 사람이 해마다 줄어들고 있다.","子どもを産む人が年々減っている。","줄어들고"],
  ["줄어들다","재활용 덕분에 쓰레기 양이 크게 줄어들었다.","リサイクルのおかげでごみの量が大きく減った。","줄어들었다"],
  ["줄이다","전기 요금을 줄이려고 에어컨을 덜 켠다.","電気代を減らそうとエアコンをあまりつけない。","줄이려고"],
  ["줄이다","회사는 비용을 줄이기 위해 회의를 온라인으로 바꿨다.","会社は費用を減らすために会議をオンラインに変えた。","줄이기"],
  ["증가하다","1인 가구가 2010년 15%에서 2020년 30%로 증가했다.","一人暮らし世帯が2010年の15%から2020年の30%に増加した。","증가했다"],
  ["증가하다","온라인 쇼핑 이용자가 꾸준히 증가하고 있다.","オンラインショッピングの利用者が着実に増加している。","증가하고"],
  ["감소하다","결혼하는 사람의 수가 10년 동안 절반으로 감소했다.","結婚する人の数が10年で半分に減少した。","감소했다"],
  ["감소하다","농촌 인구가 계속 감소하고 있다.","農村の人口が減少し続けている。","감소하고"],
  ["오르다","물가가 많이 올라서 생활비가 부족하다.","物価がかなり上がって生活費が足りない。","올라서"],
  ["오르다","오후에는 기온이 30도까지 올랐다.","午後には気温が30度まで上がった。","올랐다"],
  ["떨어지다","가격이 떨어져서 지금 사는 게 좋다.","値段が下がったので今買うのがいい。","떨어져서"],
  ["떨어지다","밤에는 기온이 영하로 떨어졌다.","夜には気温が氷点下まで下がった。","떨어졌다"],
  ["늘다","요즘 혼자 여행하는 사람이 늘었다.","最近ひとりで旅行する人が増えた。","늘었다"],
  ["상승하다","물가가 1년 동안 5% 상승했다.","物価が1年で5%上昇した。","상승했다"],
  ["하락하다","쌀 가격이 작년보다 10% 하락했다.","米の価格が昨年より10%下落した。","하락했다"],
  ["급증하다","배달 음식 주문이 3년 사이에 급증했다.","デリバリーの注文がこの3年で急増した。","급증했다"],
  ["급감하다","겨울에는 캠핑장 이용객이 급감한다.","冬はキャンプ場の利用客が急減する。","급감한다"]
];
function udPool(){
  const base = udWords();
  if(opt.form!=="cloze") return base;
  const extra = UD_EX.map(([k,ex,exj,blank])=>{ const w=ALL.find(x=>x.k===k); return w ? Object.assign({},w,{ex,exj,blank}) : null }).filter(Boolean);
  return base.concat(extra);
}
// 選択肢：ほかの3つの分類から1語ずつ（増える／減る × が／を）
function udOthers(w){
  const c=udCls(w.k);
  return ["UI","UT","DI","DT"].filter(x=>x!==c).map(x=>shuffle(ALL.filter(y=>udCls(y.k)===x))[0]).filter(Boolean);
}
const UD_SPARK = up => `<svg viewBox="0 0 28 14" width="28" height="14" aria-hidden="true"><polyline points="${up?"2,12 10,8 16,9 26,2":"2,2 10,6 16,5 26,12"}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function udTip(k){
  if(!udCls(k) && !UD_MORE.includes(k)) return "";
  const cell = ks => ks.map(x=>`<span class="${x===k?"on":""} ${inAll(x)?"":"off"}">${esc(x)}</span>`).join("");
  const rows = [
    ["〜が","自動詞・이/가",["늘다","늘어나다"],["줄다","줄어들다"]],
    ["〜を","他動詞・을/를",["늘리다"],["줄이다"]],
    ["書き言葉","人数・量",["증가하다"],["감소하다"]],
    ["急に","급＝急",["급증하다"],["급감하다"]],
    ["値段・気温","成績・割合",["오르다"],["떨어지다"]],
    ["数値の書き言葉","上昇・下落",["상승하다"],["하락하다"]]
  ];
  return `<div class="tip"><span class="tl">増える・減るの整理</span>
    <table class="udt"><thead><tr><th></th><th class="up">${UD_SPARK(true)}増える</th><th class="dn">${UD_SPARK(false)}減る</th></tr></thead>
    <tbody>${rows.map(([a,b,u,d])=>`<tr><th>${esc(a)}<small>${esc(b)}</small></th><td>${cell(u)}</td><td>${cell(d)}</td></tr>`).join("")}</tbody></table>
    <p class="udp">助詞で見分ける：<b>인구가 늘어나다</b>（が増える）／<b>인구를 늘리다</b>（を増やす）。グラフの説明は <b>A에서 B(으)로 증가했다</b>、<b>전체의 30%를 차지했다</b>、<b>점점 줄어들고 있다</b>。</p></div>`;
}
function studyTips(k){
  const w = ALL.find(x=>x.k===k) || {k};
  return udTip(k)+hjTip(w)+multiTip(w)+ruTip(w)+timeTip(k);
}
// 似た形の追加
NOTES.push(
  {w:["심하다","심각하다","심심하다","심다"],t:"<b>심하다</b>＝ひどい・激しい（甚）、<b>심각하다</b>＝深刻だ（深刻）、<b>심심하다</b>＝退屈だ、<b>심다</b>＝植える。심각は漢字の「深刻」で覚えると混ざりにくい。"},
  {w:["식히다","시키다"],t:"どちらも発音は［시키다］。<b>식히다</b>＝冷ます（식다＝冷める＋히）、<b>시키다</b>＝させる・注文する。"},
  {w:["서다","세우다"],t:"<b>서다</b>＝立つ（自動詞）、<b>세우다</b>＝立てる・止める（他動詞：계획을 세우다、차를 세우다）。"},
  {w:["떠나다","떠들다"],t:"<b>떠나다</b>＝去る・出発する、<b>떠들다</b>＝騒ぐ。どちらも떠-で始まる。"},
  {w:["오르다","떨어지다","증가하다","감소하다"],t:"値段・気温・成績は<b>오르다</b>／<b>떨어지다</b>（물가가 오르다）。人数・量は<b>증가하다</b>／<b>감소하다</b>（＝늘어나다／줄어들다の書き言葉）。물가가 증가하다 とは言わない。"},
  {w:["급증하다","급감하다","증가하다","감소하다"],t:"<b>급</b>＝急。<b>급증하다</b>＝急増する（증가하다より急）、<b>급감하다</b>＝急減する。"},
  {w:["상승하다","하락하다","오르다","떨어지다"],t:"<b>상승하다</b>（上昇）・<b>하락하다</b>（下落）は 오르다・떨어지다 の書き言葉。値段・気温・割合などの数値に使う（물가가 상승하다、주가가 하락하다）。"},
  {w:["이미","막","바로","곧","금방"],t:"<b>이미</b>＝すでに（済んでいる）、<b>막</b>＝ちょうど今、<b>바로</b>＝すぐ、<b>곧</b>＝まもなく、<b>금방</b>＝さっき・すぐ（両方）。"}
);
// 中級の見分け
NOTES.push(
  {w:["수출하다","수입하다"],t:"<b>수출</b>（輸出）＝外へ出す、<b>수입</b>（輸入）＝中へ入れる。どちらも수＝輸。名詞の<b>수입</b>には「収入」の意味もある（수입이 줄다）。"},
  {w:["수출하다","수입하다","수집하다","수면"],t:"同じ「수」でも漢字が違う：<b>수출・수입</b>＝輸、<b>수집</b>＝収（集める）、<b>수면</b>＝睡（眠る）。"},
  {w:["장점","단점"],t:"<b>장점</b>（長点）＝長所 ↔ <b>단점</b>（短点）＝短所。54の作文で「장점은 ~다는 것이다」の形でよく使う。"},
  {w:["적극적","소극적"],t:"<b>적극적</b>＝積極的 ↔ <b>소극적</b>＝消極的。-적으로（副詞）、-적인（名詞の前）の形で使う。"},
  {w:["긍정적","부정적"],t:"<b>긍정적</b>＝肯定的・前向き ↔ <b>부정적</b>＝否定的。부정적인 영향（悪い影響）は書きでよく出る。"},
  {w:["마침내","드디어","결국"],t:"<b>마침내</b>・<b>드디어</b>＝（待っていたことが）ついに。<b>결국</b>＝結局（良くない結果にも使う）。드디어は会話でも多い。"},
  {w:["나타나다","나타내다"],t:"<b>나타나다</b>＝現れる（自動詞：효과가 나타나다）、<b>나타내다</b>＝表す（他動詞：그래프가 변화를 나타내다）。"},
  {w:["쌓다","쌓이다"],t:"<b>쌓다</b>＝積む（경험을 쌓다）、<b>쌓이다</b>＝積もる・たまる（눈이 쌓이다、스트레스가 쌓이다）。"},
  {w:["모으다","모이다"],t:"<b>모으다</b>＝集める・貯める（돈을 모으다）、<b>모이다</b>＝集まる（사람들이 모이다）。"},
  {w:["확대하다","축소하다"],t:"<b>확대</b>＝拡大 ↔ <b>축소</b>＝縮小。"},
  {w:["찬성","반대"],t:"<b>찬성</b>＝賛成 ↔ <b>반대</b>＝反対。54で「찬성하는 의견과 반대하는 의견이 있다」とよく書く。"},
  {w:["흔하다","드물다"],t:"<b>흔하다</b>＝よくある・ありふれている ↔ <b>드물다</b>＝まれだ。드물다はㄹ語幹（드문 일）。"},
  {w:["거절하다","허락하다"],t:"<b>거절하다</b>＝（頼みを）断る、<b>허락하다</b>＝許す・許可する。"},
  {w:["만족하다","실망하다"],t:"<b>만족하다</b>＝満足する ↔ <b>실망하다</b>＝がっかりする。どちらも -에（〜に）をとる。"},
  {w:["참가하다","참여하다"],t:"<b>참가하다</b>＝（大会・行事に）出る、<b>참여하다</b>＝（活動・話し合いに）加わる・関わる。"},
  {w:["예상하다","예방하다"],t:"<b>예상</b>＝予想、<b>예방</b>＝予防。どちらも예＝予。"},
  {w:["바뀌다","바꾸다"],t:"<b>바꾸다</b>＝変える・取り替える（他動詞）、<b>바뀌다</b>＝変わる（自動詞）。"},
  {w:["사고","사과하다"],t:"<b>사고</b>＝事故（사고가 나다）、<b>사과하다</b>＝謝る（사과＝謝過。果物のりんごも사과）。"},
  {w:["넘다","넘치다","넘어지다"],t:"<b>넘다</b>＝超える、<b>넘치다</b>＝あふれる、<b>넘어지다</b>＝転ぶ。"},
  {w:["아무리","차라리"],t:"<b>아무리</b> ~아/어도＝どんなに〜しても。<b>차라리</b>＝いっそ（〜のほうがまし）。"},
  {w:["그러므로","그런데도","따라서"],t:"<b>그러므로</b>・<b>따라서</b>＝だから（結論）、<b>그런데도</b>＝それなのに（予想と逆）。"},
  {w:["즉","또한","한편"],t:"<b>즉</b>＝つまり（言い換え）、<b>또한</b>＝また（追加）、<b>한편</b>＝一方（別の面）。"}
);
// 4級の見分け
NOTES.push(
  {w:["출근하다","퇴근하다"],t:"<b>출근</b>（出勤）＝会社に行く ↔ <b>퇴근</b>（退勤）＝仕事を終えて帰る。"},
  {w:["입사하다","퇴사하다","취업"],t:"<b>입사</b>＝入社、<b>퇴사</b>＝退職（会社を辞める）。<b>취업</b>は「就職」全般（취업 준비＝就活）。"},
  {w:["유리하다","불리하다"],t:"<b>유리하다</b>（有利）↔ <b>불리하다</b>（不利）。〜에 유리하다＝〜に有利だ。"},
  {w:["가능하다","불가능하다"],t:"<b>가능하다</b>＝可能だ ↔ <b>불가능하다</b>＝不可能だ。불＝不。"},
  {w:["별로","그다지","전혀"],t:"どれも否定とセット。<b>별로</b>・<b>그다지</b>＝あまり〜ない、<b>전혀</b>＝まったく〜ない。"},
  {w:["혹시","어쩌면","아마"],t:"<b>혹시</b>＝もしかして（質問・仮定）、<b>어쩌면</b>＝もしかすると（-ㄹ지도 모르다とセット）、<b>아마</b>＝たぶん（-ㄹ 거예요とセット）。"},
  {w:["우선","일단"],t:"<b>우선</b>＝まず（順番の最初）、<b>일단</b>＝ひとまず・とりあえず（いったん）。"},
  {w:["겨우","거의"],t:"<b>겨우</b>＝やっと・わずか、<b>거의</b>＝ほとんど。"},
  {w:["갚다","돌려주다"],t:"<b>갚다</b>＝（借りたお金・恩を）返す、<b>돌려주다</b>＝（借りた物を）返す。"},
  {w:["외우다","기억하다"],t:"<b>외우다</b>＝（努力して）暗記する、<b>기억하다</b>＝覚えている・記憶している。"},
  {w:["깨다","깨지다"],t:"<b>깨다</b>＝割る・（目が）覚める、<b>깨지다</b>＝割れる（自動詞）。"},
  {w:["묵다","머무르다","숙박"],t:"<b>묵다</b>＝泊まる（会話）、<b>머무르다</b>＝滞在する（머물러요）、<b>숙박</b>＝宿泊（名詞）。"},
  {w:["인상하다","올리다"],t:"<b>인상하다</b>＝（料金・給料を）引き上げる（書き言葉）、<b>올리다</b>＝上げる（会話でも）。"},
  {w:["실수하다","실패하다"],t:"<b>실수</b>＝うっかりミス、<b>실패</b>＝失敗（うまくいかない結果）。"},
  {w:["외롭다","서운하다"],t:"<b>외롭다</b>＝ひとりで寂しい（孤独）、<b>서운하다</b>＝（人の態度に）寂しい・がっかり。"}
);
// 苦手の傾向
const TRENDS = [
  {id:"hj", name:"漢字語", how:"漢字に戻して、同じ漢字の語とまとめる", test:w=>!!hanjaOf(w)},
  {id:"mu", name:"意味が多い語", how:"名詞とのセットで覚える", test:w=>!!MULTI[w.k]},
  {id:"si", name:"形の似た語", how:"並べて違いを確認する", test:w=>notesFor(w.k).length>0},
  {id:"adv", name:"副詞", how:"一緒に使う形で覚える", test:w=>!!advOf(w)},
  {id:"ru", name:"르変則", how:"골라요の形から元の形に戻す", test:w=>!!ruConj(w)}
];
const trendList = id => { const t=TRENDS.find(x=>x.id===id); return t ? ALL.filter(w=>weak[w.k] && t.test(w)) : [] };
const typeList = id => { const t=TRENDS.find(x=>x.id===id); return t ? ALL.filter(t.test) : [] };
function trendCard(){
  const rows = TRENDS.map(t=>[t,trendList(t.id)]).filter(([,l])=>l.length);
  const rl = repeatList();
  if(!rows.length && !udWords().length && !rl.length) return "";
  const picked = opt.set==="RW" || opt.set==="UD" || opt.set.startsWith("WT:");
  return `<details class="today trend" id="trendbox" ${ui.trend||picked?"open":""}><summary class="foldh"><span><b>苦手の傾向と対策</b><small>苦手 ${weakList().length}語の内訳${rl.length?`・くり返し ${rl.length}語`:""}</small></span><i aria-hidden="true"></i></summary>
    <div class="trows">${rl.length?`<button type="button" class="trow rw" data-rw aria-pressed="${opt.set==="RW"}">
      <b>くり返し苦手</b><span class="tn">${rl.length}語</span><small>通算${REPEAT_N}回以上間違えた単語。日→韓で書いて答える・セットで覚える</small><span class="ck" aria-hidden="true"></span></button>`:""}${udWords().length?`<button type="button" class="trow" data-ud aria-pressed="${opt.set==="UD"}">
      <b>増える・減る</b><span class="tn">${udWords().length}語${udWords().filter(w=>weak[w.k]).length?`（苦手 ${udWords().filter(w=>weak[w.k]).length}）`:""}</span><small>例文の穴埋めで「が増える／を増やす」を見分ける</small><span class="ck" aria-hidden="true"></span></button>`:""}${rows.map(([t,l])=>`<button type="button" class="trow" data-trend="${t.id}" aria-pressed="${opt.set==="WT:"+t.id}">
      <b>${esc(t.name)}</b><span class="tn">${l.length}語</span><small>${esc(t.how)}</small><span class="ck" aria-hidden="true"></span></button>`).join("")}</div>
    <p class="thint">選ぶと出題範囲がその苦手だけになります。答えのあとに漢字・セット・活用のヒントが出ます。</p>
    ${picked?`<button type="button" class="primary sm" id="tstart">「${esc(rangeName(opt.set))}」ではじめる</button>`:""}</details>`;
}

// ---------- 絵で見る：入れる・置く・かける・貼る ----------
const PIC_ST = 'stroke="var(--muted)" stroke-width="2.5" fill="none" stroke-linecap="round"';
const PIC_AR = (x1,y1,x2,y2,head) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--fg)" stroke-width="2" stroke-linecap="round"/><polyline points="${head}" fill="none" stroke="var(--fg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const PIC_OBJ = (x,y,w,h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="var(--obj)" stroke="var(--obj-line)" stroke-width="1.5"/>`;
const PIC_TABLE = `<line x1="22" y1="80" x2="118" y2="80" ${PIC_ST}/><line x1="30" y1="80" x2="30" y2="98" ${PIC_ST}/><line x1="110" y1="80" x2="110" y2="98" ${PIC_ST}/>`;
const PIC = {
  "넣다":{jp:"中に入れる",ex:"가방에 넣다",svg:`<line x1="40" y1="60" x2="40" y2="100" ${PIC_ST}/><line x1="40" y1="100" x2="100" y2="100" ${PIC_ST}/><line x1="100" y1="60" x2="100" y2="100" ${PIC_ST}/>${PIC_OBJ(58,76,24,20)}${PIC_AR(70,10,70,66,"63,58 70,67 77,58")}`},
  "담다":{jp:"器に盛る・詰める",ex:"그릇에 밥을 담다",svg:`${[[56,64],[70,61],[84,64],[63,52],[77,52]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="var(--obj)" stroke="var(--obj-line)" stroke-width="1.5"/>`).join("")}<path d="M36 70 Q70 108 104 70" ${PIC_ST}/><line x1="32" y1="70" x2="108" y2="70" ${PIC_ST}/>${PIC_AR(70,6,70,38,"63,30 70,39 77,30")}`},
  "놓다":{jp:"上に置く（動作）",ex:"책상 위에 놓다",svg:`${PIC_TABLE}${PIC_OBJ(55,56,30,22)}${PIC_AR(70,8,70,48,"63,40 70,49 77,40")}`},
  "두다":{jp:"置いたままにする",ex:"집에 두고 오다",svg:`${PIC_TABLE}${PIC_OBJ(55,56,30,22)}<circle cx="104" cy="34" r="13" fill="var(--ok-bg)" stroke="var(--ok)" stroke-width="2"/><line x1="104" y1="34" x2="104" y2="25" stroke="var(--ok)" stroke-width="2" stroke-linecap="round"/><line x1="104" y1="34" x2="111" y2="38" stroke="var(--ok)" stroke-width="2" stroke-linecap="round"/>`},
  "걸다":{jp:"ひっかける・掛ける",ex:"옷을 벽에 걸다",svg:`<line x1="22" y1="16" x2="118" y2="16" ${PIC_ST}/><path d="M70 16 L70 25 Q70 31 64 31" ${PIC_ST}/><line x1="64" y1="31" x2="50" y2="54" stroke="var(--muted)" stroke-width="1.5"/><line x1="64" y1="31" x2="78" y2="54" stroke="var(--muted)" stroke-width="1.5"/>${PIC_OBJ(44,54,40,36)}`},
  "붙이다":{jp:"表面に貼る",ex:"우표를 붙이다",svg:`<line x1="112" y1="12" x2="112" y2="98" ${PIC_ST}/>${PIC_OBJ(100,38,10,30)}${PIC_AR(22,53,92,53,"84,46 93,53 84,60")}`}
};
// 移動の動詞
const PIC_HEAD = (x,y,fx,fy) => { const a=Math.atan2(y-fy,x-fx), L=9, W=.5; const p=g=>`${(x-L*Math.cos(g)).toFixed(1)},${(y-L*Math.sin(g)).toFixed(1)}`; return `<polyline points="${p(a-W)} ${x},${y} ${p(a+W)}" fill="none" stroke="var(--fg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` };
const PIC_LINE = (x1,y1,x2,y2,dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--fg)" stroke-width="2" stroke-linecap="round" ${dash?'stroke-dasharray="4 5"':""}/>`+PIC_HEAD(x2,y2,x1,y1);
const PIC_CURVE = (x1,y1,cx,cy,x2,y2) => `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="var(--fg)" stroke-width="2" stroke-linecap="round"/>`+PIC_HEAD(x2,y2,cx,cy);
const PIC_P = (x,y) => `<circle cx="${x}" cy="${y-25}" r="6" fill="var(--obj)" stroke="var(--obj-line)" stroke-width="1.5"/><rect x="${x-6}" y="${y-17}" width="12" height="17" rx="5" fill="var(--obj)" stroke="var(--obj-line)" stroke-width="1.5"/>`;
const PIC_HOUSE = (x,y) => `<polyline points="${x},${y+16} ${x+18},${y} ${x+36},${y+16}" ${PIC_ST}/><rect x="${x+5}" y="${y+16}" width="26" height="24" ${PIC_ST}/>`;
const PIC_FLAG = (x,y) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+40}" ${PIC_ST}/><rect x="${x}" y="${y}" width="18" height="12" fill="var(--ok-bg)" stroke="var(--ok)" stroke-width="2"/>`;
const PIC_STAIRS = `<polyline points="14,98 34,98 34,82 54,82 54,66 74,66 74,50 94,50 94,34 126,34" ${PIC_ST}/>`;
const PIC_ROAD = `<line x1="50" y1="14" x2="50" y2="98" ${PIC_ST}/><line x1="90" y1="14" x2="90" y2="98" ${PIC_ST}/>${[44,56,68].map(y=>`<line x1="56" y1="${y}" x2="84" y2="${y}" stroke="var(--line)" stroke-width="5"/>`).join("")}`;
Object.assign(PIC, {
  "올라가다":{jp:"上がっていく",ex:"계단으로 올라가다",svg:`${PIC_STAIRS}<line x1="8" y1="62" x2="8" y2="98" ${PIC_ST}/><rect x="8" y="62" width="14" height="10" fill="var(--ok-bg)" stroke="var(--ok)" stroke-width="2"/><text x="4" y="56" font-size="10" fill="var(--muted)">ここ</text>${PIC_P(44,82)}${PIC_LINE(66,58,108,22)}`},
  "올라오다":{jp:"上がってくる",ex:"2층으로 올라오다",svg:`${PIC_STAIRS}<line x1="124" y1="4" x2="124" y2="34" ${PIC_ST}/><rect x="124" y="4" width="13" height="10" fill="var(--ok-bg)" stroke="var(--ok)" stroke-width="2"/><text x="100" y="14" font-size="10" fill="var(--muted)">ここ</text>${PIC_P(44,82)}${PIC_LINE(62,60,110,24)}`},
  "꺼내다":{jp:"取り出す",ex:"가방에서 꺼내다",svg:`<line x1="40" y1="60" x2="40" y2="100" ${PIC_ST}/><line x1="40" y1="100" x2="100" y2="100" ${PIC_ST}/><line x1="100" y1="60" x2="100" y2="100" ${PIC_ST}/>${PIC_OBJ(58,16,24,20)}${PIC_LINE(70,92,70,44)}`},
  "내려가다":{jp:"下りていく",ex:"계단으로 내려가다",svg:`${PIC_STAIRS}${PIC_P(104,34)}${PIC_LINE(78,24,38,62)}`},
  "건너가다":{jp:"向こうへ渡る",ex:"길을 건너가다",svg:`${PIC_ROAD}${PIC_P(30,98)}${PIC_LINE(36,56,114,56)}`},
  "건너편":{jp:"向かい側",ex:"길 건너편에 있다",svg:`${PIC_ROAD}${PIC_P(30,98)}<rect x="102" y="40" width="26" height="40" fill="var(--ok-bg)" stroke="var(--ok)" stroke-width="2"/><line x1="40" y1="40" x2="98" y2="40" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 4"/>`},
  "지나다":{jp:"通り過ぎる",ex:"편의점 앞을 지나다",svg:`<rect x="58" y="22" width="26" height="36" fill="var(--ok-bg)" stroke="var(--ok)" stroke-width="2"/><line x1="10" y1="96" x2="130" y2="96" stroke="var(--line)" stroke-width="2"/>${PIC_P(24,92)}${PIC_LINE(38,74,126,74)}`},
  "나오다":{jp:"中から出てくる",ex:"집에서 나오다",svg:`<rect x="10" y="22" width="58" height="74" ${PIC_ST}/><line x1="68" y1="58" x2="68" y2="96" stroke="var(--surface)" stroke-width="4"/>${PIC_LINE(36,72,108,72)}${PIC_P(120,96)}`},
  "들어가다":{jp:"中へ入っていく",ex:"방에 들어가다",svg:`<rect x="10" y="22" width="58" height="74" ${PIC_ST}/><line x1="68" y1="58" x2="68" y2="96" stroke="var(--surface)" stroke-width="4"/>${PIC_LINE(126,72,34,72)}${PIC_P(120,96)}`},
  "다녀오다":{jp:"行って戻る",ex:"편의점에 다녀오다",svg:`${PIC_HOUSE(6,46)}${PIC_FLAG(112,46)}${PIC_CURVE(34,40,70,4,110,38)}${PIC_CURVE(110,96,72,112,34,96)}`},
  "다니다":{jp:"（毎日）通う",ex:"회사에 다니다",svg:`${PIC_HOUSE(6,46)}${PIC_FLAG(112,46)}${[54,66,78].map(y=>PIC_LINE(46,y,104,y)).join("")}<text x="75" y="44" text-anchor="middle" font-size="11" fill="var(--muted)">毎日</text>`},
  "떠나다":{jp:"その場所を離れる",ex:"고향을 떠나다",svg:`${PIC_HOUSE(6,46)}${PIC_P(84,96)}${PIC_LINE(98,70,130,70)}<line x1="46" y1="70" x2="70" y2="70" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 4"/>`}
});
const PIC_SETS = [["넣다","꺼내다"],["올라가다","올라오다"],["넣다","담다"],["놓다","두다"],["넣다","놓다"],["걸다","붙이다"],
  ["올라가다","내려가다"],["올라가다","건너가다"],["건너가다","건너편"],["건너가다","지나다"],["나오다","들어가다"],["다녀오다","다니다"],["다녀오다","떠나다"]];
const picRelated = k => [...new Set(PIC_SETS.filter(s=>s.includes(k)).flat())].filter(x=>x!==k);
function picCard(k,mark){
  const p=PIC[k]; if(!p) return "";
  return `<figure class="pic ${mark||""}"><svg viewBox="0 0 140 106" role="img" aria-label="${esc(k)}：${esc(p.jp)}">${p.svg}</svg>
    <figcaption><b>${esc(k)}</b><span>${esc(p.jp)}</span><small>${esc(p.ex)}</small></figcaption></figure>`;
}
function picCompare(keys,marks){
  const ks=[...new Set(keys)].filter(k=>PIC[k]).slice(0,3);
  if(!ks.length) return "";
  return `<div class="pics" style="--n:${ks.length}">${ks.map(k=>picCard(k,marks?.[k])).join("")}</div>`;
}
// 単語帳・カード用：その単語＋比べたい単語
const picOnly = k => PIC[k] ? `<div class="tip pictip"><span class="tl">絵で見る</span>${picCompare([k,...picRelated(k)].slice(0,3))}</div>` : "";
const picFor = k => studyTips(k)+picOnly(k);
// 4択や書き取りで間違えたとき：正解と選んだ単語を並べる
function picDiff(right,picked){
  if(PIC[right] && PIC[picked]) return studyTips(right)+`<div class="tip pictip"><span class="tl">絵で比べる</span>${picCompare([right,picked],{[right]:"ok",[picked]:"ng"})}</div>`;
  return picFor(right);
}
