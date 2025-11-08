// --- ロジック層 ---

/**
 * 重み付きリストからランダムにアイテムを選択します。
 * @param {Array<{name: string, weight: number}>} items - 選択肢の配列。各要素は名前と重みを持つオブジェクト。
 * @returns { {name: string, weight: number} | null } 選択されたアイテム、または選択肢がない場合はnull。
 */
function weightedRandom(items) {
  if (!items || items.length === 0) {
    return null;
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    // 重みの合計が0以下の場合は、均等に選択
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  }

  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random < 0) {
      return item;
    }
  }

  // フォールバック (浮動小数点数の精度の問題など)
  return items[items.length - 1];
}

// --- プレゼンテーション層 ---

document.addEventListener("DOMContentLoaded", () => {
  const optionsList = document.getElementById("options-list");
  const addOptionButton = document.getElementById("add-option");
  const spinButton = document.getElementById("spin-button");
  const resultText = document.getElementById("result-text");
  const canvas = document.getElementById("roulette-canvas");
  const ctx = canvas.getContext("2d");
  const runSimulationButton = document.getElementById("run-simulation");
  const simulationResultDiv = document.getElementById("simulation-result");

  const MAX_OPTIONS = 10;
  let options = []; // idプロパティは使わない

  const COLORS = [
    "#F9D5BB", // コーラルベージュ（柔らかい暖色）
    "#FAEDCB", // バニラクリーム（軽やか）
    "#C6EBBE", // ペールグリーン（透明感強め）
    "#A7D8DE", // パウダーブルー（空気感）
    "#C9C9FF", // ラベンダーブルー（柔らかい寒色）
    "#FFD6E0", // ベビーピンク（優しい印象）
    "#E7D3B8", // クリームベージュ（中和）
    "#D8E2DC", // ペールグレーグリーン（清潔感）
    "#CDE7BE", // ライトセージ（自然な淡緑）
    "#BEE7E8", // クリアティール（透明感の締め）
  ];

  /**
   * options配列に基づいて入力欄を再描画します。
   */
  function renderOptions() {
    optionsList.innerHTML = "";
    options.forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.classList.add("option-item");
      optionDiv.innerHTML = `
                <input type="text" value="${option.name}" data-index="${index}" placeholder="選択肢名">
                <input type="number" value="${option.weight}" data-index="${index}" min="1" placeholder="重み">
                <button class="remove-option" data-index="${index}">削除</button>
            `;
      if (options.length <= 2) {
        optionDiv.querySelector(".remove-option").disabled = true;
      }
      optionsList.appendChild(optionDiv);
    });
  }

  /**
   * 新しい選択肢を追加します。
   */
  function addOption() {
    if (options.length >= MAX_OPTIONS) {
      alert(`選択肢は${MAX_OPTIONS}個までです。`);
      return;
    }
    const newOption = {
      name: `選択肢 ${options.length + 1}`,
      weight: 1,
    };
    options.push(newOption);
    renderOptions();
    drawRoulette();
  }

  /**
   * 指定されたインデックスの選択肢を削除します。
   * @param {number} index - 削除する選択肢のインデックス
   */
  function removeOption(index) {
    if (options.length <= 2) {
      alert("選択肢は2個未満にはできません。");
      return;
    }
    options.splice(index, 1);
    renderOptions();
    drawRoulette();
  }

  /**
   * 選択肢の入力値を更新します。
   * @param {number} index - 更新する選択肢のインデックス
   * @param {string} key - 更新するプロパティ名 ('name' or 'weight')
   * @param {string|number} value - 更新後の値
   */
  function updateOption(index, key, value) {
    const option = options[index];
    if (option) {
      option[key] = value;
      drawRoulette();
    }
  }

  /**
   * ルーレットを描画します。
   */
  function drawRoulette() {
    const totalWeight = options.reduce(
      (sum, item) => sum + (item.weight || 1),
      0
    );
    if (totalWeight <= 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const radius = canvas.width / 2;
    let startAngle = -Math.PI / 2; // 12時の方向から開始

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    options.forEach((option, index) => {
      const weight = option.weight || 1;
      const angle = (weight / totalWeight) * 2 * Math.PI;
      const endAngle = startAngle + angle;

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fill();

      // テキストを描画
      ctx.save();
      ctx.fillStyle = "black";

      const baseFontSize = 16;
      const maxLength = 10;
      const scale = Math.min(1, maxLength / option.name.length);
      const fontSize = baseFontSize * scale;

      ctx.font = `${fontSize}px sans-serif`;
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + angle / 2);
      ctx.textAlign = "right";
      ctx.fillText(option.name, radius - 20, 10);
      ctx.restore();

      startAngle = endAngle;
    });
  }

  /**
   * ルーレットを回すアニメーションを実行します。
   */
  function spin() {
    const items = options.map((opt) => ({
      name: opt.name,
      weight: parseInt(opt.weight, 10) || 1,
    }));
    if (items.length < 2) {
      alert("選択肢を2つ以上入力してください。");
      return;
    }

    spinButton.disabled = true;
    resultText.textContent = "...";

    const winner = weightedRandom(items);
    if (!winner) {
      spinButton.disabled = false;
      return;
    }

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = -Math.PI / 2; // 12時の方向から開始
    let targetAngleRad = 0;

    for (const item of items) {
      const angle = (item.weight / totalWeight) * 2 * Math.PI;
      if (item.name === winner.name) {
        // 勝者のセクター内でランダムな停止位置を計算
        const padding = angle * 0.05; // 境界から5%内側
        const randomOffset = Math.random() * (angle - padding * 2) + padding;
        targetAngleRad = startAngle + randomOffset;
        break;
      }
      startAngle += angle;
    }

    const targetRotationDeg = 270 - (targetAngleRad * 180) / Math.PI;
    const totalRotationDeg = 1800 + targetRotationDeg;
    const duration = 5000; // 5秒

    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";
    void canvas.offsetWidth;

    canvas.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    canvas.style.transform = `rotate(${totalRotationDeg}deg)`;

    setTimeout(() => {
      resultText.textContent = `結果: ${winner.name}`;
      spinButton.disabled = false;

      const finalAngleDeg = totalRotationDeg % 360;
      canvas.style.transition = "none";
      canvas.style.transform = `rotate(${finalAngleDeg}deg)`;
    }, duration);
  }

  /**
   * 1000回の試行シミュレーションを実行します。
   */
  function runSimulation() {
    const TRIAL_COUNT = 1000;
    const items = options.map((opt) => ({
      name: opt.name,
      weight: parseInt(opt.weight, 10) || 1,
    }));

    if (items.length < 2) {
      alert("選択肢を2つ以上入力してください。");
      return;
    }

    const results = {};
    items.forEach((item) => {
      results[item.name] = 0;
    });

    for (let i = 0; i < TRIAL_COUNT; i++) {
      const winner = weightedRandom(items);
      if (winner) {
        results[winner.name]++;
      }
    }

    simulationResultDiv.innerHTML = "<h3>1000回試行結果:</h3>"; // 結果をクリア
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    for (const name in results) {
      const count = results[name];
      const percentage = (count / TRIAL_COUNT) * 100;
      const item = items.find((it) => it.name === name);
      const weightPercentage =
        totalWeight > 0
          ? (item.weight / totalWeight) * 100
          : 100 / items.length;

      const resultP = document.createElement("p");
      resultP.textContent = `${name}: ${count}回 (${percentage.toFixed(
        1
      )}%) (理論値: ${weightPercentage.toFixed(1)}%)`;
      simulationResultDiv.appendChild(resultP);
    }
  }

  // --- イベントリスナー ---

  addOptionButton.addEventListener("click", addOption);

  optionsList.addEventListener("change", (e) => {
    if (e.target.matches("input")) {
      const index = parseInt(e.target.dataset.index, 10);
      const key = e.target.type === "text" ? "name" : "weight";
      const value =
        e.target.type === "number"
          ? parseInt(e.target.value, 10)
          : e.target.value;
      updateOption(index, key, value);
    }
  });

  optionsList.addEventListener("click", (e) => {
    if (e.target.matches(".remove-option")) {
      const index = parseInt(e.target.dataset.index, 10);
      removeOption(index);
    }
  });

  spinButton.addEventListener("click", spin);

  runSimulationButton.addEventListener("click", runSimulation);

  // --- 初期化 ---
  function initialize() {
    options = [
      {name: "選択肢 1", weight: 1},
      {name: "選択肢 2", weight: 1},
    ];
    renderOptions();
    drawRoulette();
  }

  initialize();
});
