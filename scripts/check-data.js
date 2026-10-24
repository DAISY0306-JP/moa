// 모아 データチェック
// data/*.js と index.html の書き間違い（, の抜け、カッコの閉じ忘れなど）を見つけます。
// 使い方: node scripts/check-data.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const DATA = ["data/words.js", "data/grammar.js", "data/writing.js"];
const errors = [];
const warns = [];
const err = m => errors.push(m);
const warn = m => warns.push(m);

// 1) 各ファイルが JavaScript として正しく読めるか
const sources = {};
for (const f of DATA) {
  const src = fs.readFileSync(path.join(root, f), "utf8");
  sources[f] = src;
  try { new vm.Script(src, { filename: f }); }
  catch (e) {
    const where = (e.stack || "").split("\n")[0];
    err(`${f} が読めません（${e.message}）\n    場所: ${where}\n    → 前の行の最後の , や、[ ] { } " の閉じ忘れを確認してください`);
  }
}

// 2) 中身の形
let D = null;
if (!errors.length) {
  try {
    const ctx = vm.createContext({});
    const names = ["A_RAW", "B_RAW", "C_RAW", "M_RAW", "L_RAW", "EXTRA", "NOTES", "GRAMMAR", "SHEET", "WRITE", "P53", "P54"];
    const tail = `\n;({${names.map(n => `${n}: typeof ${n}==="undefined"?undefined:${n}`).join(",")}})`;
    D = vm.runInContext(DATA.map(f => sources[f]).join("\n;\n") + tail, ctx, { filename: "data" });
  } catch (e) { err(`データを実行できませんでした（${e.message}）`); }
}

if (D) {
  const isStr = v => typeof v === "string" && v.trim() !== "";
  const builtin = new Set();
  for (const set of ["A_RAW", "B_RAW", "C_RAW", "M_RAW", "L_RAW"]) {
    const rows = D[set];
    if (!Array.isArray(rows)) { err(`${set} がありません（data/words.js）`); continue; }
    rows.forEach((r, i) => {
      if (!Array.isArray(r)) return err(`${set} の ${i + 1} 番目が ["韓国語","意味","例文","訳"] の形になっていません`);
      if (!isStr(r[0]) || !isStr(r[1])) err(`${set} の ${i + 1} 番目（${JSON.stringify(r[0])}）: 韓国語と意味は必須です`);
      if (r.length < 4) warn(`${set} の ${i + 1} 番目（${r[0]}）: 例文か訳が足りません`);
      builtin.add(r[0]);
    });
  }
  if (D.EXTRA !== undefined) {
    if (!Array.isArray(D.EXTRA)) err("EXTRA が配列（[ ... ]）になっていません");
    else {
      const seen = new Set();
      D.EXTRA.forEach((w, i) => {
        if (!w || typeof w !== "object" || Array.isArray(w)) return err(`EXTRA の ${i + 1} 番目が {k:…, j:…} の形になっていません`);
        if (!isStr(w.k) || !isStr(w.j)) err(`EXTRA の ${i + 1} 番目（${JSON.stringify(w.k)}）: k（韓国語）と j（意味）は必須です`);
        if (seen.has(w.k)) warn(`EXTRA に「${w.k}」が2回あります（後のほうは使われません）`);
        if (builtin.has(w.k)) warn(`EXTRA の「${w.k}」はもともとの単語と重なっています（使われません）`);
        seen.add(w.k);
      });
    }
  }
  if (!Array.isArray(D.GRAMMAR) || !D.GRAMMAR.length) err("GRAMMAR がありません（data/grammar.js）");
  if (!Array.isArray(D.WRITE)) err("WRITE がありません（data/writing.js）");
  else {
    const ids = new Set();
    D.WRITE.forEach((p, i) => { if (!p || !p.id) err(`WRITE の ${i + 1} 番目に id がありません`); else if (ids.has(p.id)) err(`WRITE の id「${p.id}」が重なっています`); else ids.add(p.id); });
  }
  for (const n of ["P53", "P54"]) {
    if (!Array.isArray(D[n])) { err(`${n} がありません（data/writing.js）`); continue; }
    const ids = new Set();
    D[n].forEach((p, i) => { if (!p || !p.id) err(`${n} の ${i + 1} 番目に id がありません`); else if (ids.has(p.id)) err(`${n} の id「${p.id}」が重なっています`); else ids.add(p.id); });
  }
}

// 3) index.html の中のスクリプト
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  try { new vm.Script(m[1], { filename: `index.html のスクリプト${i + 1}` }); }
  catch (e) { err(`index.html のスクリプト${i + 1} が読めません（${e.message}）`); }
});
for (const f of DATA) if (!html.includes(`src="${f}"`)) err(`index.html が ${f} を読み込んでいません`);

// 結果
if (D) {
  const n = ["A_RAW", "B_RAW", "C_RAW", "M_RAW", "L_RAW"].reduce((s, k) => s + (Array.isArray(D[k]) ? D[k].length : 0), 0);
  console.log(`単語 ${n} 行 ＋ 追加単語 ${Array.isArray(D.EXTRA) ? D.EXTRA.length : 0} 語 / 文法 ${D.GRAMMAR?.length ?? 0} 項目 / 書き ${(D.WRITE?.length ?? 0) + (D.P53?.length ?? 0) + (D.P54?.length ?? 0)} 問`);
}
warns.forEach(w => console.log("注意: " + w));
if (errors.length) {
  errors.forEach(e => console.error("エラー: " + e));
  console.error(`\n${errors.length} 件のエラーがあります。直すまでサイトは更新されません。`);
  process.exit(1);
}
console.log("OK: データに問題はありません");
