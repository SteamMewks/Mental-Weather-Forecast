console.log(`
やあ （´・ω・｀)

こころの天気予報アプリへようこそ──とは言え、君はちょっと覗きすぎているね。

この小さな晴れ間や雨雲を数字で追うより、まずは深呼吸して落ち着いて欲しい。

そう、「また」覗いたんだね。やると思ったよ。

仏の顔もって言うし、責めるつもりもない。ここに書かれた秘密のちょっとした「気付き」は、君だけのものだ。

殺伐とした日常で、心の晴れ間を忘れないでほしい──そう思って、この小さな項目を残したんだ。

さて、ここで一言。

「これをネタバレして“台無し”にしないと気が済まないくらい、気分は荒んでいるのかい？」

さて、そろそろ画面に戻ろうか。このアプリはきっと、君の役にも立つ。
`);

/* =========================
   データ管理
========================= */
const STORAGE_KEY = "moodLog";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
if (!data.settings) data.settings = { username: "" };
if (!data.records) data.records = {};

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


/* =========================
   日付ユーティリティ
========================= */
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

function pad(n) {
  return n.toString().padStart(2, "0");
}

function makeKey(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}


/* =========================
   定数
========================= */
const MOOD_COLORS = ["#4AA8FF", "#4DFF7A", "#FFF55C", "#FF9A2B", "#FF3A3A"];
const FATIGUE_COLORS = ["#8AFF8A", "#FFFFA8", "#FF8A8A"];


/* =========================
   カレンダー描画
========================= */
function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const first = new Date(currentYear, currentMonth, 1);
  const last = new Date(currentYear, currentMonth + 1, 0);

  document.getElementById("title").textContent =
    `${currentYear}年 ${currentMonth + 1}月`;

  for (let i = 0; i < first.getDay(); i++) {
    cal.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const key = makeKey(currentYear, currentMonth + 1, d);
    cal.appendChild(createDayCell(d, key));
  }
}

function createDayCell(day, key) {
  const cell = document.createElement("div");
  cell.className = "day";

  const rec = data.records[key];

  if (rec) {
    cell.appendChild(createMoodBox(rec.mood));
    cell.appendChild(createFatigueBar(rec.fatigue));
  }

  cell.appendChild(createDateLabel(day, rec));
  cell.onclick = () => openModal(key);

  return cell;
}

function createMoodBox(mood) {
  const box = document.createElement("div");
  box.className = "color-box";
  box.style.background = MOOD_COLORS[mood];
  return box;
}

function createFatigueBar(fatigue) {
  const bar = document.createElement("div");
  bar.className = "fatigue-bar";
  bar.style.background = FATIGUE_COLORS[fatigue];
  return bar;
}

function createDateLabel(day, rec) {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.justifyContent = "center";
  wrap.style.alignItems = "center";
  wrap.style.gap = "2px";

  const mark =
    rec?.flags?.morningGood === true ? "💤" :
    rec?.flags?.morningGood === false ? "☁️" : "";

  wrap.innerHTML = `<span style="font-weight:bold;">${day}</span>` +
                   `<span style="font-size:12px;">${mark}</span>`;
  return wrap;
}


/* =========================
   日別入力モーダル
========================= */
function openModal(key) {
  document.getElementById("modalBg").style.display = "flex";

  const rec = data.records[key] || {
    mood: 0,
    fatigue: 0,
    memo: "",
    flags: { morningGood: null }
  };

  document.getElementById("modalDate").textContent = key;

  bindMorningRadios(rec);
  bindSelectButtons(".color-btn", rec, "mood");
  bindSelectButtons(".fatigue-btn", rec, "fatigue");

  document.getElementById("memo").value = rec.memo;

  document.getElementById("saveBtn").onclick = () => {
    rec.memo = document.getElementById("memo").value;
    data.records[key] = rec;
    saveData();
    closeModal();
    renderCalendar();
    renderAnalysis();
  };

  document.getElementById("deleteBtn").onclick = () => {
    delete data.records[key];
    saveData();
    closeModal();
    renderCalendar();
    renderAnalysis();
  };
}

function bindMorningRadios(rec) {
  document.querySelectorAll('input[name="morningGood"]').forEach(r => {
    r.checked = String(rec.flags.morningGood) === r.value;
    r.onchange = () => rec.flags.morningGood = (r.value === "true");
  });
}

function bindSelectButtons(selector, rec, field) {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach(btn => {
    btn.classList.toggle("selected", Number(btn.dataset.val) === rec[field]);
    btn.onclick = () => {
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      rec[field] = Number(btn.dataset.val);
    };
  });
}

function closeModal() {
  document.getElementById("modalBg").style.display = "none";
}


/* =========================
   設定モーダル
========================= */
function openSettings() {
  document.getElementById("settingsModalBg").style.display = "flex";
  document.getElementById("usernameInput").value = data.settings.username;
}

function closeSettings() {
  document.getElementById("settingsModalBg").style.display = "none";
}


/* =========================
   分析表示
========================= */
function getWeeklyAverage(days = 7) {
  const now = new Date();
  let moodSum = 0, fatigueSum = 0, count = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const rec = data.records[key];
    if (!rec) continue;

    moodSum += rec.mood;
    fatigueSum += rec.fatigue;
    count++;
  }

  if (count === 0) return null;

  return {
    avgMood: moodSum / count,
    avgFatigue: fatigueSum / count
  };
}

function getMoodMessage(avg) {
  if (avg <= 1) return "気分が優れないのかな。気持ちを吐き出すことはできそう？";
  if (avg <= 1.2) return "少し落ち込み気味かな？";
  if (avg <= 2.5) return "安定してる感じだよ。";
  if (avg <= 3.2) return "調子が良いね。何か良いことでもあったの？";
  return "ちょっとテンションが上がりすぎかも？必要なら誰かに相談しようね";
}

function getFatigueMessage(avg) {
  if (avg <= 1.0) return "体力は十分そうだよ。";
  if (avg <= 1.3) return "少し疲れがたまってるかも。適時休憩を取ってね。";
  return "ちょっと休息が必要かも。たまにはサボるのも大事だよ。";
}

function getTodayMessage() {
  const today = new Date();
  const key = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  const rec = data.records[key];
  if (!rec) return "今日の記録はまだないよ。";

  let msg = "";

  const m = rec.mood;
  if (m === 0) msg += "今日はあまり良い日じゃなかったのかな？明日は良い日になるといいね。<br>";
  else if (m === 1) msg += "今日は平凡な日だった、といった感じかな？ゆっくり休んでね。<br>";
  else if (m === 2) msg += "今日は何か良いことはあった？明日も良いことがあるといいね。<br>";
  else if (m === 3) msg += "少し気分が上がることがあったのかな？疲れに気付けない事もあるから、ゆっくり休もうね。<br>";
  else msg += "気分が上がりすぎているかも。寝る前に紅茶でも飲んで、少し落ち着く時間を作ってもいいかも。<br>";

  const f = rec.fatigue;
  if (f === 0) msg += "体力は十分みたいだね。";
  else if (f === 1) msg += "少し疲れがあるかも、無理は禁物だよ。";
  else msg += "疲れが強いみたい、今日は無理せず休もうね。";

  return msg;
}

function hasTodayRecord() {
  const today = new Date();
  const key = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  return !!data.records[key];
}

function renderAnalysis() {
  const box = document.getElementById("analysis");
  const weekly = getWeeklyAverage();

  if (!weekly) {
    box.textContent = "直近1週間の記録がありません。";
    return;
  }

  const moodMsg = getMoodMessage(weekly.avgMood);
  const fatigueMsg = getFatigueMessage(weekly.avgFatigue);
  const todayMsg = getTodayMessage();
  const gameCode = generateGameCode();

  let omikujiHtml = "";

  if (hasTodayRecord()) {
    const omikuji = drawOmikuji();

    omikujiHtml = `
      <br><br>
      <b>明日の運試し</b><br>
      ${omikuji}
      <br>
      <small style="color:#666;">
        記録から生成された符号：<b>${gameCode}</b>
      </small>
    `;
  } else {
    omikujiHtml = `
      <br><br>
      <b>明日の運試し</b><br>
      今日の記録をつけると見られるよ。
    `;
  }

  const html = `
    <b>直近1週間の傾向</b>
    / 平均気分：${weekly.avgMood.toFixed(2)}
    / 平均疲労：${weekly.avgFatigue.toFixed(2)}<br>
    ${moodMsg}<br>
    ${fatigueMsg}
    <br><br>
    <b>今日の状態</b><br>
    ${todayMsg}
    ${omikujiHtml}
  `;

  box.innerHTML = html;
}


/* =========================
   ナビゲーション
========================= */
document.getElementById("prevMonth").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
  renderAnalysis();
};

document.getElementById("nextMonth").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
  renderAnalysis();
};

document.getElementById("prevYear").onclick = () => {
  currentYear--;
  renderCalendar();
  renderAnalysis();
};

document.getElementById("nextYear").onclick = () => {
  currentYear++;
  renderCalendar();
  renderAnalysis();
};


/* =========================
   初期化
========================= */
document.getElementById("openSettings").onclick = openSettings;
document.getElementById("settingsSaveBtn").onclick = () => {
  const name = document.getElementById("usernameInput").value.trim();
  if (name.length < 1 || name.length > 6) {
    alert("ユーザー名は1〜6文字で入力してね");
    return;
  }
  data.settings.username = name;
  saveData();
  closeSettings();
};

/* =========================
   乱数生成：未使用
========================= */

function getSeedString(date = new Date()) {
  const name = (data.settings.username || "noname")
    .normalize("NFKC")
    .trim()
    .toLowerCase();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${name}_${y}-${m}-${d}`;
}


function seedToNumber(seed) {
  let h = 2166136261;
  for (const c of seed) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  return (seed % 1000000) / 1000000;
}

function drawOmikuji(date = new Date()) {
  const seed = seedToNumber(getSeedString(date));
  const r = Math.floor(seededRandom(seed) * 100); // 0～99

  if (r === 0)
    return "？？？ / 「今日の運勢は……うわ、なんだ貴様！離せ！やめろ！」";

  if (r < 8)
    return "大凶 / 「お布団から出られたら、それだけで優勝でいいと思うんだけど？」";

  if (r < 18)
    return "凶 / 「ところでさ、おみくじって引く前に“何を占うか”決めないと意味ないらしいよ」";

  if (r < 35)
    return "小吉 / 「まあ今日は様子見で。動かないのも一つの選択肢だよ」";

  if (r < 60)
    return "吉 / 「特別なことは起きないけど、致命的なことも起きない日。晴れたら合格ってことでおひとつ……」";

  if (r < 85)
    return "中吉 / 「あと一歩踏み出せたら上出来。とはいえ、状況を俯瞰して楽しむのも一興だよ」";

  if (r < 99)
    return "大吉 / 「今日をちゃんと終えられたら、それで合格点。平々凡々に勝るものは無いよ。」";

  return "？？？ / 「今日の運勢は……特吉！？いやそんなはずは、ちゃんと隠しておいたはずなのに…ゴニョゴニョ」";
}

function seedToCode(seed) {
  return seed.toString(36).toUpperCase();
}

function formatCode(code, length = 8) {
  return code.padStart(length, "0").slice(-length);
}

function prettifyCode(code) {
  return code.match(/.{1,4}/g).join("-");
}

function generateGameCode(date = new Date()) {
  const seedStr = getSeedString(date);
  const seedNum = seedToNumber(seedStr);
  const rawCode = seedToCode(seedNum);
  const fixed = formatCode(rawCode, 8);
  return prettifyCode(fixed);
}

renderCalendar();
renderAnalysis();