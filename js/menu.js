// ---------- 今日のメニュー（試験日から逆算） ----------
const daysLeft = () => dayDiff(today(), exam.date);
const WD = ["日","月","火","水","木","金","土"];
const fmtDate = d => { const t=new Date(d+"T00:00:00"); return `${t.getMonth()+1}/${t.getDate()}（${WD[t.getDay()]}）` };
function wordPlan(){
  const due = ALL.filter(w=>isDue(w.k));
  const cont = ALL.filter(w=>!isDone(w.k) && streakOf(w.k)>0 && !countedToday(w.k));
  const startedToday = ALL.filter(w=>!isDone(w.k) && countedToday(w.k) && streakOf(w.k)===1).length;
  // 4級を目指すあいだ、新しく始めるのは中級・過去問・追加と、初級で苦手なものだけ（初級の残りは自由に練習で）
  const newOk = w => exam.goal<4 || !BEGIN_KEYS.has(w.k) || weak[w.k] || isRepeat(w.k);
  const fresh = ALL.filter(w=>!isDone(w.k) && streakOf(w.k)===0 && newOk(w));
  const dl = daysLeft();
  let quota;
  if(dl<=0) quota = 15;                                   // 試験後：ふつうのペース
  else if(dl < MASTER_N) quota = 0;                        // 直前：新しい単語は増やさない
  else {
    const newDays = Math.max(1, dl-(MASTER_N-1));          // 試験の前日までに3日分そろう最後の日まで
    quota = Math.min(40, Math.max(10, Math.ceil((fresh.length+startedToday)/newDays)));
  }
  const newN = Math.max(0, Math.min(fresh.length, quota-startedToday));
  const rank = w => (isRepeat(w.k)?0:weak[w.k]?10:20) + (/^過去問/.test(groupOf(w)||"")?0:isMid(w)?1:w.set==="L"?2:isFB(w)?3:w.set==="C"?4:w.set==="A"?5:w.set==="B"?6:7);   // 苦手→過去問→中級→4級→追加→初級
  const newPick = fresh.slice().sort((a,b)=>rank(a)-rank(b)).slice(0,newN);
  return {due, cont, newPick, quota, startedToday, list:[...due,...cont,...newPick]};
}
const gLvGoal = () => exam.goal>=4 ? 4 : 3;
const G_DAILY = 10;
function gramPlan(){
  const pool = S_ITEMS.filter(it=>it.g.lv<=gLvGoal() && !it.g.biz);   // 仕事の敬語は今日のメニューには入れない（範囲で選んで練習）
  const weakFirst = shuffle(pool.filter(it=>gweak[it.id])).concat(shuffle(pool.filter(it=>!gweak[it.id])));
  return {list: weakFirst.slice(0,G_DAILY), done: (todayLog().g||0)};
}
function writePlan(){
  const wroteToday = Object.values(wdata).some(d=>d?.at && dayOf(d.at)===today());
  // 4級を目指すあいだは 51〜54 を回す（書いた数が少ない番号から）
  const pool = exam.goal>=4 ? [...WRITE,...P53,...P54] : WRITE;
  const typ = p => String(p.id).slice(0,2);
  const cnt = t => pool.filter(p=>typ(p)===t && wdata[p.id]).length;
  const fresh = pool.filter(p=>!wdata[p.id]).sort((a,b)=>cnt(typ(a))-cnt(typ(b)))[0];
  const pct = p => { const f=wdata[p.id]?.fb; if(!f) return 99; if(typeof f.total==="number") return f.total/(typ(p)==="54"?50:30); return ((f.a?.score||0)+(f.b?.score||0))/10 };
  const next = fresh || pool.slice().sort((a,b)=>pct(a)-pct(b))[0];
  return {wroteToday, next};
}
function todayCard(){
  const dl=daysLeft(), wp=wordPlan(), gp=gramPlan(), wr=writePlan();
  const wDone = !wp.list.length;
  const gDone = gp.done>=G_DAILY;
  const task = (id,done,title,sub,right,btn) => `<div class="task ${done?"done":""}">
      <span class="tck" aria-hidden="true"></span>
      <div class="tt"><b>${title}</b><small>${sub}</small></div>
      <span class="tr">${right}</span>
      <button type="button" class="tgo" data-task="${id}">${btn}</button></div>`;
  const head = dl>0 ? `<b class="dl">あと<span>${dl}</span>日</b>` : dl===0 ? `<b class="dl">今日が試験日</b>` : `<b class="dl small">試験おつかれさま</b>`;
  return `<section class="today">
    <div class="tdh">
      <div class="ex-l"><small>TOPIK ${esc(fmtDate(exam.date))}${exam.tent?"（仮）":""}${dl>=0?`<button type="button" class="infobtn" id="tinfo" aria-expanded="false" aria-label="このメニューの説明">？</button>`:""}</small>${head}</div>
      <button type="button" class="goal" id="goalbtn"><small>目標</small><b>${exam.goal}級</b></button>
    </div>
    <div class="goaledit" id="goaledit" hidden>
      <label>試験日<input type="date" id="ex-date" value="${esc(exam.date)}"></label>
      <div><div class="label">目標</div><div class="seg pills" id="ex-goal">${[3,4,5,6].map(g=>`<button type="button" data-goal="${g}" aria-pressed="${exam.goal===g}">${g}級</button>`).join("")}</div></div>
      <button type="button" class="primary sm" id="ex-save">保存</button>
    </div>
    ${dl<0?`<p class="hint">次の試験日と目標（4級など）を設定すると、そこから逆算してメニューを作り直します。</p>`:""}
    <div class="tinfo-b" id="tinfo-b" hidden>
    ${exam.tent&&dl>0?`<p class="hint">試験日は仮です。日程が発表されたら「目標」を押して直してください。4級を目指すあいだ、新しい単語は中級・4級から出し、初級（頻出ABC）は苦手と確認だけにしています。</p>`:""}
    ${dl>=MASTER_N?`<p class="hint">新しい単語は ${esc(fmtDate(addDays(exam.date,-MASTER_N)))} までに全部始めて、試験前日までに「覚えた」がそろうペースで出しています。</p>`:""}
    </div>
    <div class="tasks">
      ${task("word", wDone, "単語", wDone?"今日の分は終わり！":`確認 ${wp.due.length}・続き ${wp.cont.length}・新しく ${wp.newPick.length}`, wDone?"✓":`${wp.list.length}語`, wDone?"もう少し":"始める")}
      ${task("gram", gDone, "文法 使い分け", `${gLvGoal()}級までの文法から${gp.done?`・今日 ${gp.done}問`:""}`, gDone?"✓":`${Math.min(gp.done,G_DAILY)}/${G_DAILY}`, gDone?"もう少し":"始める")}
      ${task("write", wr.wroteToday, exam.goal>=4?"書き 51〜54":"書き 51・52", wr.wroteToday?"今日は書いた！":`次は ${esc(wr.next.id)}「${esc(wr.next.title)}」`, wr.wroteToday?"✓":"1問", wr.wroteToday?"もう1問":"書く")}
    </div>
    ${dl>0&&dl<MASTER_N?`<p class="hint">試験直前なので、新しい単語は増やさず「確認」と「続き」に集中する配分にしています。</p>`:""}
  </section>`;
}
function bindTodayCard(){
  const gb=document.getElementById("goalbtn"); if(!gb) return;
  const ed=document.getElementById("goaledit");
  let goal=exam.goal;
  gb.onclick=()=>{ ed.hidden=!ed.hidden };
  const ib=document.getElementById("tinfo");
  if(ib) ib.onclick=()=>{ const b=document.getElementById("tinfo-b"); b.hidden=!b.hidden; ib.setAttribute("aria-expanded",!b.hidden) };
  ed.querySelectorAll("[data-goal]").forEach(b=>b.onclick=()=>{ goal=+b.dataset.goal; ed.querySelectorAll("[data-goal]").forEach(x=>x.setAttribute("aria-pressed",x===b)) });
  document.getElementById("ex-save").onclick=()=>{
    const d=document.getElementById("ex-date").value;
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)) exam.date=d;
    exam.goal=goal; exam.tent=false; sopt.lv = goal>=4 ? "4" : "3"; store.set("kq-sopt",sopt);
    saveExam(); home();
  };
  document.querySelectorAll("[data-task]").forEach(b=>b.onclick=()=>{
    const t=b.dataset.task;
    if(t==="word") startDailyWords();
    else if(t==="gram") startDailyGram();
    else { const wr=writePlan(); view="write"; openWriting(wr.next.id) }
  });
}
function startDailyWords(){
  let list=wordPlan().list;
  if(!list.length){   // 今日の分が終わっていたら、苦手と続きからもう少し
    const more=ALL.filter(w=>!isDone(w.k) && (weak[w.k]||isRepeat(w.k)||streakOf(w.k)>0));
    list=shuffle(more.filter(w=>isRepeat(w.k))).concat(shuffle(more.filter(w=>!isRepeat(w.k)))).slice(0,15);   // くり返し苦手を先に
    if(!list.length) list=shuffle(ALL.filter(w=>!isDone(w.k))).slice(0,15);
  }
  if(!list.length) return;
  if(opt.form==="conj") opt.form="word";
  if(opt.mode==="choice" && opt.form==="word" && opt.dir==="k2j") opt.dir="j2k";   // 数える形式で出す
  store.set("kq-opt",opt);
  view="quiz"; run={list:shuffle(list),i:0,miss:[],ok:0,daily:true}; question();
}
function startDailyGram(){
  const list=gramPlan().list; if(!list.length) return;
  srun={list,i:0,ok:0,miss:[],form:"cloze",daily:true}; view="squiz"; sQuestion();
}
