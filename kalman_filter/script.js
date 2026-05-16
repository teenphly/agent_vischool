const canvas = document.getElementById("kalmanCanvas");
const ctx = canvas.getContext("2d");
const playToggle = document.getElementById("playToggle");
const resetButton = document.getElementById("resetButton");
const speedSlider = document.getElementById("speedSlider");
const noiseSlider = document.getElementById("noiseSlider");
const modelSlider = document.getElementById("modelSlider");
const outlierSwitch = document.getElementById("outlierSwitch");

const truthReadout = document.getElementById("truthReadout");
const measurementReadout = document.getElementById("measurementReadout");
const estimateReadout = document.getElementById("estimateReadout");
const gainReadout = document.getElementById("gainReadout");
const predictionErrorReadout = document.getElementById("predictionErrorReadout");
const measurementErrorReadout = document.getElementById("measurementErrorReadout");
const estimateErrorReadout = document.getElementById("estimateErrorReadout");
const trustReadout = document.getElementById("trustReadout");

const stepTabs = [...document.querySelectorAll(".step-tab")];
const stepKicker = document.getElementById("stepKicker");
const stepTitle = document.getElementById("stepTitle");
const stepBody = document.getElementById("stepBody");
const memoryLine = document.getElementById("memoryLine");
const formulaPanel = document.getElementById("formulaPanel");
const mathDetails = document.getElementById("mathDetails");
const liveMathLine = document.getElementById("liveMathLine");
const quizQuestion = document.getElementById("quizQuestion");
const quizActions = document.getElementById("quizActions");
const quizFeedback = document.getElementById("quizFeedback");

const colors = {
  ink: "#17212b",
  muted: "#5c6875",
  line: "#d8e0e7",
  truth: "#1f9d78",
  measurement: "#d46b2a",
  prediction: "#78848f",
  estimate: "#2268b5",
  uncertainty: "rgba(34, 104, 181, 0.18)",
  red: "#bd3d45",
  violet: "#6f5ab8",
  panel: "rgba(255, 255, 255, 0.86)",
};

const lessons = [
  {
    kicker: "第一层：别急着算",
    title: "先看见问题：测量会抖，但目标不会乱跳",
    body:
      "橙色点是传感器读数，它围着绿色真实位置上下乱抖。卡尔曼滤波的出发点很朴素：不要完全相信单次测量，也不要死守自己的旧猜测。",
    memory: "一句话：在“我预测的”和“我测到的”之间，按可信度取一个聪明的折中。",
    formula: `
      <math display="block">
        <mi>z</mi><mo>=</mo><mi>x</mi><mo>+</mo><mtext>测量噪声</mtext>
      </math>
      <math display="block">
        <mover><mi>x</mi><mo>^</mo></mover><mo>=</mo><mtext>对真实位置的估计</mtext>
      </math>
    `,
    math: `
      <p>先把问题压成一维：目标只有一个位置。我们看不到真实位置 <code>x</code>，只能看到带噪声的测量 <code>z</code>。</p>
      <div class="math-equation">
        <math display="block">
          <mi>z</mi><mo>=</mo><mi>x</mi><mo>+</mo><mtext>测量噪声</mtext>
        </math>
      </div>
      <dl class="symbol-list">
        <div><dt>x</dt><dd>真实位置，动画里的绿色点</dd></div>
        <div><dt>z</dt><dd>传感器读数，动画里的橙色点</dd></div>
        <div><dt>x̂</dt><dd>滤波器估计的真实位置，动画里的蓝色点</dd></div>
        <div><dt>R</dt><dd>测量噪声方差，越大表示传感器越不靠谱</dd></div>
      </dl>
    `,
    quiz: "如果传感器噪声 R 变大，滤波器应该更相信测量，还是更相信自己的预测？",
    choices: [
      ["a", "更相信测量"],
      ["b", "更相信预测"],
    ],
    answer: "b",
    feedback:
      "对。K 是“蓝色估计点被橙色测量点拉过去多少”的比例。R 越大表示测量越吵，K 越小，蓝点就越少被橙点拉动。",
  },
  {
    kicker: "第二层：先猜一步",
    title: "预测不是玄学，只是沿着速度往前走",
    body:
      "速度不是传感器直接告诉我们的。滤波器会同时维护“位置估计”和“速度估计”：如果连续几次位置都在往右变，它就把速度估大；如果位置变化变慢，它就把速度估小。",
    memory: "预测阶段只回答一个问题：根据刚刚估出来的速度，如果暂时闭上眼睛，目标会去哪里？",
    formula: `
      <math display="block">
        <mover><mi>v</mi><mo>^</mo></mover><mo>=</mo><mtext>从连续位置变化估出的速度</mtext>
      </math>
      <math display="block">
        <msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
        <mo>=</mo>
        <mover><mi>x</mi><mo>^</mo></mover>
        <mo>+</mo>
        <mover><mi>v</mi><mo>^</mo></mover><mo>·</mo><mi>Δt</mi>
      </math>
      <math display="block">
        <msup><mi>P</mi><mo>-</mo></msup><mo>=</mo><mi>P</mi><mo>+</mo><mi>Q</mi>
      </math>
    `,
    math: `
      <p>上标减号 <code>⁻</code> 表示“还没看这次测量之前”。预测阶段只用上一刻的估计和运动模型。</p>
      <div class="math-equation">
        <math display="block">
          <msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
          <mo>=</mo>
          <mover><mi>x</mi><mo>^</mo></mover>
          <mo>+</mo>
          <mover><mi>v</mi><mo>^</mo></mover><mo>·</mo><mi>Δt</mi>
        </math>
        <math display="block">
          <msup><mi>P</mi><mo>-</mo></msup><mo>=</mo><mi>P</mi><mo>+</mo><mi>Q</mi>
        </math>
      </div>
      <dl class="symbol-list">
        <div><dt>v̂</dt><dd>估计速度，由连续几次位置变化推出来</dd></div>
        <div><dt>Δt</dt><dd>两次采样之间的时间间隔</dd></div>
        <div><dt>P</dt><dd>估计的不确定度，越大代表越没把握</dd></div>
        <div><dt>Q</dt><dd>模型噪声，表示“匀速运动”这个假设本身可能错多少</dd></div>
      </dl>
    `,
    quiz: "Q 代表模型自己的不确定。Q 调大时，滤波器会更愿意修正，还是更固执？",
    choices: [
      ["a", "更愿意修正"],
      ["b", "更固执"],
    ],
    answer: "a",
    feedback:
      "对。Q 越大，预测后的不确定度 P⁻ 越大，滤波器会觉得“我可能猜错了”，于是更愿意听测量。",
  },
  {
    kicker: "第三层：测量把预测拉回来",
    title: "校正就是把预测点朝测量点拉一段",
    body:
      "蓝色估计点不是橙色测量点，也不是灰色预测点。它从预测点出发，沿着预测误差的方向移动一部分，这一部分由 K 控制。",
    memory: "校正阶段只做一件事：预测错了多少，就按比例补回来多少。",
    formula: `
      <math display="block">
        <mi>y</mi><mo>=</mo><mi>z</mi><mo>-</mo><msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
      </math>
      <math display="block">
        <mover><mi>x</mi><mo>^</mo></mover>
        <mo>=</mo>
        <msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
        <mo>+</mo><mi>K</mi><mo>·</mo><mi>y</mi>
      </math>
    `,
    math: `
      <p>残差也叫创新量，它衡量“这次测量和我刚才预测差了多少”。校正就是把预测朝残差方向移动一部分。</p>
      <div class="math-equation">
        <math display="block">
          <mi>y</mi><mo>=</mo><mi>z</mi><mo>-</mo><msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
        </math>
        <math display="block">
          <mover><mi>x</mi><mo>^</mo></mover>
          <mo>=</mo>
          <msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
          <mo>+</mo><mi>K</mi><mo>·</mo><mi>y</mi>
        </math>
        <math display="block">
          <mi>P</mi><mo>=</mo><mo>(</mo><mn>1</mn><mo>-</mo><mi>K</mi><mo>)</mo><mo>·</mo><msup><mi>P</mi><mo>-</mo></msup>
        </math>
      </div>
      <dl class="symbol-list">
        <div><dt>y</dt><dd>残差，测量值减预测值</dd></div>
        <div><dt>K</dt><dd>卡尔曼增益，决定蓝点被橙点拉过去多少</dd></div>
        <div><dt>P</dt><dd>校正后的不确定度，通常会比预测时更小</dd></div>
      </dl>
    `,
    quiz: "当橙色测量点离预测很远时，残差 z - x̂⁻ 会怎样？",
    choices: [
      ["a", "变大"],
      ["b", "变小"],
    ],
    answer: "a",
    feedback:
      "对。残差就是“测量和预测差多少”。它大，不代表测量一定对，只代表这次冲突更明显。",
  },
  {
    kicker: "第四层：卡尔曼增益",
    title: "K 是信任比例，不是神秘参数",
    body:
      "K 接近 1，蓝点会贴近测量；K 接近 0，蓝点会留在预测附近。拖动 R 和 Q，观察右上角 K 的变化。",
    memory: "R 是“传感器有多吵”，P⁻ 是“我自己有多没把握”。K 比较的就是这两件事。",
    formula: `
      <math display="block">
        <mi>K</mi><mo>=</mo>
        <mfrac>
          <msup><mi>P</mi><mo>-</mo></msup>
          <mrow><msup><mi>P</mi><mo>-</mo></msup><mo>+</mo><mi>R</mi></mrow>
        </mfrac>
      </math>
      <p class="formula-note">R 大：少信测量。P⁻ 大：多信测量。</p>
    `,
    math: `
      <p>在一维情况下，K 的公式特别直观：分子是“我对预测有多没把握”，分母是“预测没把握 + 测量没把握”。</p>
      <div class="math-equation">
        <math display="block">
          <mi>K</mi><mo>=</mo>
          <mfrac>
            <msup><mi>P</mi><mo>-</mo></msup>
            <mrow><msup><mi>P</mi><mo>-</mo></msup><mo>+</mo><mi>R</mi></mrow>
          </mfrac>
        </math>
        <math display="block">
          <mn>0</mn><mo>≤</mo><mi>K</mi><mo>≤</mo><mn>1</mn>
        </math>
      </div>
      <dl class="symbol-list">
        <div><dt>K≈0</dt><dd>预测更可信，蓝点几乎不动</dd></div>
        <div><dt>K≈1</dt><dd>测量更可信，蓝点贴近橙点</dd></div>
        <div><dt>R↑</dt><dd>传感器更吵，所以 K 变小</dd></div>
        <div><dt>P⁻↑</dt><dd>自己更没把握，所以 K 变大</dd></div>
      </dl>
    `,
    quiz: "如果预测很没把握 P⁻ 很大，而传感器还不错 R 较小，K 会偏大还是偏小？",
    choices: [
      ["a", "偏大"],
      ["b", "偏小"],
    ],
    answer: "a",
    feedback:
      "对。K 偏大时，蓝色估计会明显靠近橙色测量。",
  },
  {
    kicker: "第五层：线性代数降噪版",
    title: "向量只是把位置和速度打包成两行数字",
    body:
      "真正常用的卡尔曼滤波会同时估计位置和速度。你可以把向量理解成一张很窄的表：第一行是位置，第二行是速度。矩阵只是说明这两行怎样互相更新。",
    memory: "先别怕矩阵。这里的核心仍然是预测一次，再用测量校正一次。",
    formula: `
      <math display="block">
        <mi>X</mi><mo>=</mo>
        <mo>[</mo><mtable><mtr><mtd><mtext>位置</mtext></mtd></mtr><mtr><mtd><mtext>速度</mtext></mtd></mtr></mtable><mo>]</mo>
      </math>
      <math display="block">
        <msup><mi>X</mi><mo>-</mo></msup><mo>=</mo><mi>F</mi><mi>X</mi>
      </math>
      <math display="block">
        <mi>H</mi><mo>=</mo><mo>[</mo><mn>1</mn><mspace width="0.5em"></mspace><mn>0</mn><mo>]</mo>
      </math>
    `,
    math: `
      <p>二维状态只是把两个未知数打包：第一行位置，第二行速度。矩阵 <code>F</code> 只是“位置受速度影响，速度暂时保持”。</p>
      <div class="math-equation">
        <math display="block">
          <mi>X</mi><mo>=</mo>
          <mo>[</mo><mtable><mtr><mtd><mi>p</mi></mtd></mtr><mtr><mtd><mi>v</mi></mtd></mtr></mtable><mo>]</mo>
        </math>
        <math display="block">
          <msup><mi>X</mi><mo>-</mo></msup><mo>=</mo><mi>F</mi><mi>X</mi>
        </math>
        <math display="block">
          <mi>F</mi><mo>=</mo>
          <mo>[</mo><mtable>
            <mtr><mtd><mn>1</mn></mtd><mtd><mi>Δt</mi></mtd></mtr>
            <mtr><mtd><mn>0</mn></mtd><mtd><mn>1</mn></mtd></mtr>
          </mtable><mo>]</mo>
        </math>
        <math display="block">
          <mi>z</mi><mo>=</mo><mi>H</mi><mi>X</mi><mo>+</mo><mi>r</mi>
        </math>
        <math display="block">
          <mi>H</mi><mo>=</mo><mo>[</mo><mn>1</mn><mspace width="0.5em"></mspace><mn>0</mn><mo>]</mo>
        </math>
      </div>
      <p><code>H = [1, 0]</code> 的意思是：传感器只直接看位置，不直接看速度。速度是滤波器从多次位置变化里估出来的。</p>
    `,
    quiz: "如果状态向量是 [位置, 速度]，传感器只测位置，那么它直接看得到速度吗？",
    choices: [
      ["a", "看得到"],
      ["b", "看不到"],
    ],
    answer: "b",
    feedback:
      "对。速度是滤波器从连续的位置变化里推出来的：这次位置比上次更靠右，就说明速度可能为正；变化越快，估计速度越大。",
  },
];

const state = {
  running: true,
  step: 0,
  lastTime: performance.now(),
  elapsed: 0,
  trueX: 20,
  trueV: 9,
  x: [16, 0],
  p: [
    [140, 0],
    [0, 30],
  ],
  predictedX: 16,
  predictedV: 0,
  predictedVariance: 140,
  measurementVariance: 0,
  measurement: 16,
  gain: [0, 0],
  residual: 0,
  lastOutlierAt: 0,
  sampleAccumulator: 0,
  width: 1280,
  height: 820,
  history: [],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function gaussianRandom() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function measurementStd() {
  return Number(noiseSlider.value) * 0.32;
}

function measurementVariance() {
  const std = measurementStd();
  return std * std;
}

function modelVariance() {
  const q = Number(modelSlider.value);
  return q * 0.18;
}

function speedRatio() {
  const t = Number(speedSlider.value) / 100;
  return t;
}

function animationSpeed() {
  const t = speedRatio();
  return 0.01 + t * t * 0.84;
}

function sampleInterval() {
  const t = speedRatio();
  return 1.9 - Math.pow(t, 0.72) * 1.72;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = Math.max(1, Math.floor(rect.width));
  state.height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resetSimulation() {
  state.elapsed = 0;
  state.trueX = 20;
  state.trueV = 9;
  state.x = [16, 0];
  state.p = [
    [140, 0],
    [0, 30],
  ];
  state.predictedX = 16;
  state.predictedV = 0;
  state.predictedVariance = 140;
  state.measurementVariance = measurementVariance();
  state.measurement = 16;
  state.gain = [0, 0];
  state.residual = 0;
  state.lastOutlierAt = 0;
  state.sampleAccumulator = 0;
  state.history = [];
  quizFeedback.textContent = "";
  [...quizActions.querySelectorAll(".choice-button")].forEach((button) => {
    button.classList.remove("is-correct", "is-wrong");
  });
}

function stepTruth(dt) {
  const acceleration = Math.sin(state.elapsed * 0.9) * 5.2 + Math.sin(state.elapsed * 0.27) * 2.4;
  state.trueV += acceleration * dt;
  state.trueV = clamp(state.trueV, -18, 18);
  state.trueX += state.trueV * dt;

  if (state.trueX > 94) {
    state.trueX = 94;
    state.trueV *= -0.72;
  }

  if (state.trueX < 6) {
    state.trueX = 6;
    state.trueV *= -0.72;
  }
}

function makeMeasurement() {
  const std = measurementStd();
  let z = state.trueX + gaussianRandom() * std;
  const outlierReady = state.elapsed - state.lastOutlierAt > 4.2;
  if (outlierSwitch.checked && outlierReady && Math.random() < 0.018) {
    z += (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 16);
    state.lastOutlierAt = state.elapsed;
  }
  return clamp(z, 0, 100);
}

function kalmanStep(dt, z) {
  const q = modelVariance();
  const r = measurementVariance();
  const x0 = state.x[0];
  const x1 = state.x[1];
  const p00 = state.p[0][0];
  const p01 = state.p[0][1];
  const p10 = state.p[1][0];
  const p11 = state.p[1][1];

  const predX0 = x0 + x1 * dt;
  const predX1 = x1;

  const pp00 = p00 + dt * (p10 + p01) + dt * dt * p11 + q * dt * 8;
  const pp01 = p01 + dt * p11;
  const pp10 = p10 + dt * p11;
  const pp11 = p11 + q * dt * 7;

  const innovation = z - predX0;
  const s = pp00 + r;
  const k0 = pp00 / s;
  const k1 = pp10 / s;

  const newX0 = predX0 + k0 * innovation;
  const newX1 = predX1 + k1 * innovation;

  const newP00 = (1 - k0) * pp00;
  const newP01 = (1 - k0) * pp01;
  const newP10 = pp10 - k1 * pp00;
  const newP11 = pp11 - k1 * pp01;

  state.predictedX = predX0;
  state.predictedV = predX1;
  state.predictedVariance = pp00;
  state.measurementVariance = r;
  state.residual = innovation;
  state.gain = [k0, k1];
  state.x = [clamp(newX0, 0, 100), clamp(newX1, -28, 28)];
  state.p = [
    [Math.max(1, newP00), newP01],
    [newP10, Math.max(0.2, newP11)],
  ];
}

function updateSimulation(dt) {
  state.elapsed += dt;
  stepTruth(dt);
  const z = makeMeasurement();
  kalmanStep(dt, z);
  state.measurement = z;

  state.history.push({
    truth: state.trueX,
    measurement: state.measurement,
    prediction: state.predictedX,
    estimate: state.x[0],
    sigma: Math.sqrt(Math.max(1, state.p[0][0])),
    gain: state.gain[0],
  });

  const maxPoints = Math.max(120, Math.floor(state.width / 5));
  if (state.history.length > maxPoints) {
    state.history.splice(0, state.history.length - maxPoints);
  }
}

function xToScreen(value, left, width) {
  return left + (value / 100) * width;
}

function yToGraph(value, top, height) {
  return top + height - (value / 100) * height;
}

function drawRoundedRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawText(text, x, y, options = {}) {
  ctx.save();
  ctx.fillStyle = options.color || colors.ink;
  ctx.font = `${options.weight || 700} ${options.size || 15}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "middle";
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawArrow(x1, y1, x2, y2, color, alpha = 1) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.55) * 11, y2 - Math.sin(angle - 0.55) * 11);
  ctx.lineTo(x2 - Math.cos(angle + 0.55) * 11, y2 - Math.sin(angle + 0.55) * 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAxis(left, top, width, y, label) {
  ctx.save();
  ctx.strokeStyle = "#cbd5dd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left + width, y);
  ctx.stroke();
  for (let i = 0; i <= 10; i += 1) {
    const x = left + (i / 10) * width;
    ctx.strokeStyle = i % 5 === 0 ? "#aebac4" : "#dce3e9";
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    if (i % 5 === 0) {
      drawText(String(i * 10), x, y + 24, { color: colors.muted, size: 12, align: "center", weight: 700 });
    }
  }
  drawText(label, left, top, { color: colors.muted, size: 13, weight: 800 });
  ctx.restore();
}

function drawMarker(x, y, radius, color, label, alpha = 1, stroke = "#ffffff") {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(20, 30, 40, 0.16)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();

  if (label) {
    drawText(label, x, y - radius - 16, {
      color,
      size: 13,
      align: "center",
      weight: 850,
      alpha,
    });
  }
}

function drawStage() {
  const { width, height } = state;
  const pad = Math.max(22, Math.min(48, width * 0.04));
  const trackLeft = pad + 16;
  const trackWidth = width - pad * 2 - 32;
  const trackTop = Math.max(74, height * 0.12);
  const trackY = trackTop + Math.min(125, height * 0.16);
  const graphTop = Math.max(trackY + 120, height * 0.48);
  const graphHeight = Math.max(175, height - graphTop - 78);
  const graphLeft = pad + 18;
  const graphWidth = width - pad * 2 - 36;

  ctx.clearRect(0, 0, width, height);

  drawRoundedRect(pad, 24, width - pad * 2, height - 54, 8, "rgba(255,255,255,0.58)", "rgba(157,171,183,0.28)");

  drawAxis(trackLeft, trackTop, trackWidth, trackY, "上方：一维位置轴，想象一辆小车在直线上运动");

  const trueX = xToScreen(state.trueX, trackLeft, trackWidth);
  const measurementX = xToScreen(state.measurement, trackLeft, trackWidth);
  const predictionX = xToScreen(state.predictedX, trackLeft, trackWidth);
  const estimateX = xToScreen(state.x[0], trackLeft, trackWidth);
  const sigmaPx = (Math.sqrt(Math.max(1, state.p[0][0])) / 100) * trackWidth;

  ctx.save();
  ctx.fillStyle = "rgba(34, 104, 181, 0.14)";
  ctx.beginPath();
  ctx.roundRect(estimateX - sigmaPx * 2, trackY - 26, sigmaPx * 4, 52, 8);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(120, 132, 143, 0.44)";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(predictionX, trackY - 58);
  ctx.lineTo(predictionX, trackY + 58);
  ctx.stroke();
  ctx.restore();

  const measurementAlpha = state.step === 1 ? 0.46 : 1;
  drawMarker(measurementX, trackY - 42, 8, colors.measurement, "z 测量", measurementAlpha);
  drawMarker(predictionX, trackY + 42, 8, colors.prediction, "x̂⁻ 预测", state.step === 0 ? 0.55 : 1);
  drawMarker(trueX, trackY, 12, colors.truth, "真实", 1);
  drawMarker(estimateX, trackY, 10, colors.estimate, "x̂ 估计", 1);

  if (state.step >= 1) {
    drawArrow(xToScreen(state.x[0] - state.x[1] * 0.18, trackLeft, trackWidth), trackY + 73, predictionX, trackY + 73, colors.prediction, 0.78);
    drawText("预测：沿速度先走一步", predictionX, trackY + 96, {
      color: colors.prediction,
      size: 13,
      align: "center",
      weight: 850,
    });
  }

  if (state.step >= 2) {
    drawArrow(predictionX, trackY - 76, estimateX, trackY - 76, colors.estimate, 0.92);
    drawText("校正：朝测量方向拉一段", lerp(predictionX, estimateX, 0.5), trackY - 99, {
      color: colors.estimate,
      size: 13,
      align: "center",
      weight: 850,
    });
  }

  if (state.step >= 3) {
    drawGainGauge(width - pad - 230, 42, 196, 82);
  }

  if (state.step >= 4) {
    drawVectorPanel(pad + 18, 42);
  }

  drawGraph(graphLeft, graphTop, graphWidth, graphHeight);
}

function drawGainGauge(x, y, w, h) {
  drawRoundedRect(x, y, w, h, 8, colors.panel, "rgba(120,132,143,0.28)");
  drawText("K 决定拉向测量的比例", x + 14, y + 20, { color: colors.ink, size: 13, weight: 850 });
  const barX = x + 14;
  const barY = y + 44;
  const barW = w - 28;
  drawRoundedRect(barX, barY, barW, 13, 7, "#e6edf2");
  drawRoundedRect(barX, barY, barW * clamp(state.gain[0], 0, 1), 13, 7, colors.estimate);
  drawText("0", barX, barY + 29, { color: colors.muted, size: 11, align: "center", weight: 750 });
  drawText("1", barX + barW, barY + 29, { color: colors.muted, size: 11, align: "center", weight: 750 });
  drawText(state.gain[0].toFixed(2), barX + barW * clamp(state.gain[0], 0, 1), barY + 29, {
    color: colors.estimate,
    size: 12,
    align: "center",
    weight: 900,
  });
}

function drawVectorPanel(x, y) {
  const w = 220;
  const h = 118;
  drawRoundedRect(x, y, w, h, 8, colors.panel, "rgba(120,132,143,0.28)");
  drawText("状态向量", x + 14, y + 19, { color: colors.ink, size: 13, weight: 850 });
  drawText("[ 位置  x̂ ]", x + 20, y + 51, { color: colors.estimate, size: 16, weight: 900 });
  drawText(state.x[0].toFixed(1), x + w - 24, y + 51, { color: colors.estimate, size: 16, align: "right", weight: 900 });
  drawText("[ 速度  v̂ ]", x + 20, y + 82, { color: colors.violet, size: 16, weight: 900 });
  drawText(state.x[1].toFixed(1), x + w - 24, y + 82, { color: colors.violet, size: 16, align: "right", weight: 900 });
}

function drawGraph(left, top, width, height) {
  drawRoundedRect(left - 12, top - 18, width + 24, height + 42, 8, "rgba(255,255,255,0.72)", "rgba(157,171,183,0.28)");
  drawText("下方：时间轨迹，蓝线越平稳说明滤波越有效", left, top - 2, {
    color: colors.muted,
    size: 13,
    weight: 850,
  });

  ctx.save();
  ctx.strokeStyle = "#dce3e9";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (i / 4) * height;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
  }
  ctx.restore();

  if (state.history.length < 2) return;

  const points = state.history;
  const stepX = width / Math.max(1, points.length - 1);

  ctx.save();
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = left + index * stepX;
    const y = yToGraph(clamp(point.estimate + point.sigma * 2, 0, 100), top, height);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    const x = left + index * stepX;
    const y = yToGraph(clamp(point.estimate - point.sigma * 2, 0, 100), top, height);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = colors.uncertainty;
  ctx.fill();
  ctx.restore();

  drawSeries(points, left, top, width, height, "truth", colors.truth, 3, 1);
  drawSeries(points, left, top, width, height, "prediction", colors.prediction, 2, state.step >= 1 ? 0.8 : 0.28, [6, 6]);
  drawSeries(points, left, top, width, height, "estimate", colors.estimate, 3, 1);
  drawMeasurements(points, left, top, width, height);
}

function drawSeries(points, left, top, width, height, key, color, lineWidth, alpha, dash = []) {
  const stepX = width / Math.max(1, points.length - 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = left + index * stepX;
    const y = yToGraph(point[key], top, height);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawMeasurements(points, left, top, width, height) {
  const stepX = width / Math.max(1, points.length - 1);
  ctx.save();
  ctx.fillStyle = colors.measurement;
  ctx.globalAlpha = state.step === 1 ? 0.42 : 0.72;
  const stride = Math.max(1, Math.floor(points.length / 95));
  points.forEach((point, index) => {
    if (index % stride !== 0) return;
    const x = left + index * stepX;
    const y = yToGraph(point.measurement, top, height);
    ctx.beginPath();
    ctx.arc(x, y, 2.7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function updateReadouts() {
  const predictionError = Math.abs(state.predictedX - state.trueX);
  const measurementError = Math.abs(state.measurement - state.trueX);
  const estimateError = Math.abs(state.x[0] - state.trueX);

  truthReadout.textContent = state.trueX.toFixed(1);
  measurementReadout.textContent = state.measurement.toFixed(1);
  estimateReadout.textContent = state.x[0].toFixed(1);
  gainReadout.textContent = state.gain[0].toFixed(2);
  predictionErrorReadout.textContent = predictionError.toFixed(1);
  measurementErrorReadout.textContent = measurementError.toFixed(1);
  estimateErrorReadout.textContent = estimateError.toFixed(1);

  if (state.gain[0] < 0.28) {
    trustReadout.textContent = "偏信预测";
  } else if (state.gain[0] > 0.66) {
    trustReadout.textContent = "偏信测量";
  } else {
    trustReadout.textContent = "折中";
  }

  liveMathLine.innerHTML = `
    <span>当前代入</span>
    <math display="block">
      <mi>y</mi><mo>=</mo><mi>z</mi><mo>-</mo><msup><mover><mi>x</mi><mo>^</mo></mover><mo>-</mo></msup>
      <mo>=</mo><mn>${state.residual.toFixed(1)}</mn>
    </math>
    <math display="block">
      <mi>K</mi><mo>≈</mo>
      <mfrac>
        <mn>${state.predictedVariance.toFixed(1)}</mn>
        <mrow><mn>${state.predictedVariance.toFixed(1)}</mn><mo>+</mo><mn>${state.measurementVariance.toFixed(1)}</mn></mrow>
      </mfrac>
      <mo>=</mo><mn>${state.gain[0].toFixed(2)}</mn>
    </math>
  `;
}

function setRunning(running) {
  state.running = running;
  playToggle.setAttribute("aria-label", running ? "暂停动画" : "播放动画");
  const first = document.getElementById("playIconA");
  const second = document.getElementById("playIconB");
  if (running) {
    first.setAttribute("d", "M8 5h3v14H8z");
    second.setAttribute("d", "M14 5h3v14h-3z");
  } else {
    first.setAttribute("d", "M8 5v14l11-7z");
    second.setAttribute("d", "");
  }
}

function setStep(index) {
  state.step = index;
  const lesson = lessons[index];
  stepKicker.textContent = lesson.kicker;
  stepTitle.textContent = lesson.title;
  stepBody.textContent = lesson.body;
  memoryLine.textContent = lesson.memory;
  formulaPanel.innerHTML = lesson.formula;
  mathDetails.innerHTML = lesson.math;
  quizQuestion.textContent = lesson.quiz;
  quizFeedback.textContent = "";
  quizActions.innerHTML = lesson.choices
    .map(([choice, label]) => `<button type="button" class="choice-button" data-choice="${choice}">${label}</button>`)
    .join("");

  stepTabs.forEach((tab) => {
    tab.classList.toggle("is-active", Number(tab.dataset.step) === index);
  });
}

function answerQuiz(button) {
  const lesson = lessons[state.step];
  const correct = button.dataset.choice === lesson.answer;
  [...quizActions.querySelectorAll(".choice-button")].forEach((choice) => {
    choice.classList.remove("is-correct", "is-wrong");
  });
  button.classList.add(correct ? "is-correct" : "is-wrong");
  quizFeedback.textContent = correct
    ? lesson.feedback
    : "再看一下动画里的蓝点：它的位置由预测和测量共同决定，谁更可信，蓝点就更靠近谁。";
}

function animate(now) {
  const rawDt = Math.min(70, now - state.lastTime) / 1000;
  state.lastTime = now;

  if (state.running) {
    state.sampleAccumulator += rawDt;
    const interval = sampleInterval();
    if (state.sampleAccumulator >= interval) {
      const sampleCount = Math.min(3, Math.floor(state.sampleAccumulator / interval));
      for (let i = 0; i < sampleCount; i += 1) {
        updateSimulation(Math.min(interval * animationSpeed(), 0.12));
      }
      state.sampleAccumulator %= interval;
    }
  }

  drawStage();
  updateReadouts();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);
playToggle.addEventListener("click", () => setRunning(!state.running));
resetButton.addEventListener("click", resetSimulation);
noiseSlider.addEventListener("input", () => {
  quizFeedback.textContent = "";
});
modelSlider.addEventListener("input", () => {
  quizFeedback.textContent = "";
});
outlierSwitch.addEventListener("change", () => {
  quizFeedback.textContent = "";
});
stepTabs.forEach((tab) => {
  tab.addEventListener("click", () => setStep(Number(tab.dataset.step)));
});
quizActions.addEventListener("click", (event) => {
  const button = event.target.closest(".choice-button");
  if (button) answerQuiz(button);
});

resizeCanvas();
setStep(0);
setRunning(true);
for (let i = 0; i < 40; i += 1) {
  updateSimulation(1 / 30);
}
requestAnimationFrame(animate);
