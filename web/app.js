const STORAGE_KEY = "localCurrencyWalletV1";

const state = loadState();
const app = document.getElementById("app");
const walletIdText = document.getElementById("walletIdText");

walletIdText.textContent = `あなたのID: ${state.walletId}`;

window.addEventListener("hashchange", render);
window.addEventListener("load", () => {
  if (!location.hash) {
    location.hash = "#/home";
    return;
  }
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  const initial = {
    walletId: createWalletId(),
    balance: 10000,
    history: []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createWalletId() {
  return `WALLET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function render() {
  const route = location.hash.replace("#", "") || "/home";

  if (route === "/home") {
    renderHome();
    return;
  }
  if (route === "/send") {
    renderSend();
    return;
  }
  if (route === "/receive") {
    renderReceive();
    return;
  }
  if (route === "/scan") {
    renderScan();
    return;
  }

  location.hash = "#/home";
}

function renderHome() {
  const historyHtml = state.history.length
    ? state.history
        .slice()
        .reverse()
        .map((item) => {
          const cls = item.type === "受取" ? "amount-plus" : "amount-minus";
          const sign = item.type === "受取" ? "+" : "-";
          return `
            <div class="history-item">
              <div><strong>${item.type}</strong> ${item.partnerId} / ${item.memo || "メモなし"}</div>
              <div class="${cls}">${sign}${item.amount} LC</div>
              <div class="help">${new Date(item.createdAt).toLocaleString("ja-JP")}</div>
            </div>
          `;
        })
        .join("")
    : "<div class=\"help\">取引履歴はまだありません。</div>";

  app.innerHTML = `
    <section class="card">
      <div>現在の残高</div>
      <div class="balance">${state.balance} LC</div>
    </section>
    <section class="card">
      <h3>取引履歴</h3>
      ${historyHtml}
    </section>
  `;
}

function renderSend() {
  app.innerHTML = `
    <section class="card">
      <h3>送金QRを表示（相手がスキャンして受取）</h3>
      <div class="form-group">
        <input id="sendAmount" type="number" min="1" placeholder="金額（LC）" />
      </div>
      <div class="form-group">
        <input id="sendMemo" type="text" maxlength="50" placeholder="メモ（任意）" />
      </div>
      <button id="createSendQrBtn">送金QRを生成</button>
      <div class="qr-wrap"><canvas id="sendQrCanvas"></canvas></div>
      <button id="saveSendQrBtn" class="secondary">QR画像を保存</button>
      <div class="help">このQRを相手が読み取ると、相手側で受取処理を行えます。</div>
    </section>
  `;

  document.getElementById("createSendQrBtn").addEventListener("click", async () => {
    const amount = Number(document.getElementById("sendAmount").value);
    const memo = document.getElementById("sendMemo").value.trim();

    if (!isValidAmount(amount)) {
      alert("正しい金額を入力してください。");
      return;
    }

    const payload = {
      kind: "transfer",
      from: state.walletId,
      amount,
      memo,
      createdAt: new Date().toISOString()
    };

    try {
      await renderQrToCanvas("sendQrCanvas", payload);
    } catch (error) {
      alert(`QR生成に失敗しました: ${error.message}`);
    }
  });

  document.getElementById("saveSendQrBtn").addEventListener("click", () => {
    saveCanvasImage("sendQrCanvas", "send-qr.png");
  });
}

function renderReceive() {
  app.innerHTML = `
    <section class="card">
      <h3>受取QRを表示（相手がスキャンして送金）</h3>
      <div class="form-group">
        <input id="receiveAmount" type="number" min="1" placeholder="金額（LC）" />
      </div>
      <div class="form-group">
        <input id="receiveMemo" type="text" maxlength="50" placeholder="メモ（任意）" />
      </div>
      <button id="createReceiveQrBtn">受取QRを生成</button>
      <div class="qr-wrap"><canvas id="receiveQrCanvas"></canvas></div>
      <button id="saveReceiveQrBtn" class="secondary">QR画像を保存</button>
      <div class="help">このQRを相手が読み取ると、相手側で送金処理を行えます。</div>
    </section>
  `;

  document.getElementById("createReceiveQrBtn").addEventListener("click", async () => {
    const amount = Number(document.getElementById("receiveAmount").value);
    const memo = document.getElementById("receiveMemo").value.trim();

    if (!isValidAmount(amount)) {
      alert("正しい金額を入力してください。");
      return;
    }

    const payload = {
      kind: "request",
      to: state.walletId,
      amount,
      memo,
      createdAt: new Date().toISOString()
    };

    try {
      await renderQrToCanvas("receiveQrCanvas", payload);
    } catch (error) {
      alert(`QR生成に失敗しました: ${error.message}`);
    }
  });

  document.getElementById("saveReceiveQrBtn").addEventListener("click", () => {
    saveCanvasImage("receiveQrCanvas", "receive-qr.png");
  });
}

function renderScan() {
  app.innerHTML = `
    <section class="card">
      <h3>QRコードをスキャン</h3>
      <button id="nativeScanBtn">カメラでスキャン</button>
      <div class="help">ネイティブ環境ではML Kitを利用します。ブラウザ時は手動入力も使えます。</div>
      <div class="form-group" style="margin-top: 10px;">
        <textarea id="manualPayload" placeholder="QR内容(JSON)を手動で貼り付け"></textarea>
      </div>
      <button id="manualApplyBtn" class="secondary">手動データを適用</button>
      <div id="scanResult" class="help"></div>
      <div id="errorText"></div>
    </section>
  `;

  document.getElementById("nativeScanBtn").addEventListener("click", startNativeScan);
  document.getElementById("manualApplyBtn").addEventListener("click", () => {
    const raw = document.getElementById("manualPayload").value.trim();
    applyPayload(raw);
  });
}

async function startNativeScan() {
  const resultEl = document.getElementById("scanResult");
  const errorEl = document.getElementById("errorText");
  resultEl.textContent = "スキャンを開始します...";
  errorEl.textContent = "";

  try {
    const plugin = getBarcodePlugin();
    if (!plugin || typeof plugin.scan !== "function") {
      throw new Error("バーコードスキャナープラグインが利用できません。");
    }

    if (typeof plugin.checkPermissions === "function") {
      const status = await plugin.checkPermissions();
      if (status.camera !== "granted" && typeof plugin.requestPermissions === "function") {
        await plugin.requestPermissions();
      }
    }

    const scanResult = await plugin.scan({ formats: ["QR_CODE"] });
    const rawValue =
      scanResult?.rawValue ||
      scanResult?.value ||
      scanResult?.barcodes?.[0]?.rawValue ||
      "";

    if (!rawValue) {
      throw new Error("QRの読み取り結果が空です。");
    }

    applyPayload(rawValue);
  } catch (error) {
    resultEl.textContent = "";
    errorEl.textContent = `スキャン失敗: ${error.message}`;
  }
}

function getBarcodePlugin() {
  const plugins = window.Capacitor?.Plugins;
  if (!plugins) {
    return null;
  }
  return plugins.BarcodeScanner || plugins.BarcodeScanning || null;
}

function applyPayload(raw) {
  const resultEl = document.getElementById("scanResult");
  const errorEl = document.getElementById("errorText");
  errorEl.textContent = "";

  try {
    const data = JSON.parse(raw);

    if (!data.kind || !isValidAmount(Number(data.amount))) {
      throw new Error("QRデータ形式が不正です。");
    }

    if (data.kind === "request") {
      handleRequestPayload(data);
      resultEl.textContent = `送金完了: ${data.to} へ ${data.amount} LC`;
      return;
    }

    if (data.kind === "transfer") {
      handleTransferPayload(data);
      resultEl.textContent = `受取完了: ${data.from} から ${data.amount} LC`;
      return;
    }

    throw new Error("未対応のQR種別です。");
  } catch (error) {
    resultEl.textContent = "";
    errorEl.textContent = `処理失敗: ${error.message}`;
  }
}

function handleRequestPayload(data) {
  const amount = Number(data.amount);

  if (data.to === state.walletId) {
    throw new Error("自分宛の受取QRです。相手側でスキャンしてください。");
  }

  if (state.balance < amount) {
    throw new Error("残高不足のため送金できません。");
  }

  state.balance -= amount;
  state.history.push({
    type: "送金",
    partnerId: data.to,
    amount,
    memo: data.memo || "",
    createdAt: new Date().toISOString()
  });
  saveState();
  renderHome();
  location.hash = "#/home";
}

function handleTransferPayload(data) {
  const amount = Number(data.amount);

  if (data.from === state.walletId) {
    throw new Error("自分が生成した送金QRです。相手側でスキャンしてください。");
  }

  state.balance += amount;
  state.history.push({
    type: "受取",
    partnerId: data.from,
    amount,
    memo: data.memo || "",
    createdAt: new Date().toISOString()
  });
  saveState();
  renderHome();
  location.hash = "#/home";
}

function isValidAmount(amount) {
  return Number.isInteger(amount) && amount > 0;
}

async function renderQrToCanvas(canvasId, payload) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error("QR描画先が見つかりません。");
  }

  const text = JSON.stringify(payload);
  const globalQr = window.QRCode;

  if (globalQr && typeof globalQr.toCanvas === "function") {
    await globalQr.toCanvas(canvas, text, {
      width: 240,
      margin: 1
    });
    return;
  }

  await drawQrByApi(canvas, text);
}

function drawQrByApi(canvas, text) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("描画コンテキストを取得できません。"));
        return;
      }
      canvas.width = 240;
      canvas.height = 240;
      ctx.clearRect(0, 0, 240, 240);
      ctx.drawImage(image, 0, 0, 240, 240);
      resolve();
    };
    image.onerror = () => {
      reject(new Error("QRライブラリとフォールバックAPIの両方で生成に失敗しました。"));
    };
    image.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}`;
  });
}

function saveCanvasImage(canvasId, fileName) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.toDataURL) {
    alert("保存可能なQR画像がありません。");
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
}
