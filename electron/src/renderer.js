const electronAPI = window.electronAPI;

let datasets = [];
let lastExperimentId = null;

function qs(sel) {
  return document.querySelector(sel);
}

function renderDatasets() {
  const list = qs("#dataset-list");
  list.innerHTML = "";
  datasets.forEach((file) => {
    const item = document.createElement("div");
    item.className = "dataset-pill";
    item.textContent = file;
    list.appendChild(item);
  });
}

function appendLog(message, type = "log") {
  const logPane = qs("#experiment-logs");
  logPane.textContent += message;
  logPane.scrollTop = logPane.scrollHeight;
  if (type === "error") {
    logPane.classList.add("error");
  }
}

function setStatus(text) {
  const status = qs("#experiment-status");
  status.textContent = text;
}

function updateProgress(percent) {
  qs("#experiment-progress").style.width = `${percent}%`;
}

function getActiveMethod() {
  const active = document.querySelector(".toggle-btn.active");
  return active ? active.dataset.method : "qlora";
}

async function handleSelectDataset() {
  if (!electronAPI) return;
  const files = await electronAPI.selectDataset();
  datasets = files || [];
  renderDatasets();
}

function buildConfig() {
  return {
    training: {
      base_model: qs("#base-model").value,
      peft_method: getActiveMethod(),
      max_seq_length: Number(qs("#context-length").value),
      learning_rate: 0.0002,
      num_epochs: 1,
      batch_size: 1,
    },
    rag: {
      enabled: qs("#rag-enabled").checked,
      retriever: qs("#rag-retriever").value,
    },
    datasets,
    experimentId: `exp-${Date.now()}`,
  };
}

async function launchExperiment() {
  if (!electronAPI) return;
  const config = buildConfig();
  lastExperimentId = config.experimentId;
  setStatus("Starting experiment...");
  updateProgress(10);
  appendLog(`\nLaunching ${config.experimentId}\n`);

  try {
    await electronAPI.launchExperiment(config);
    setStatus("Experiment completed");
    updateProgress(100);
  } catch (err) {
    setStatus("Experiment failed");
    appendLog(`\n${err.message}\n`, "error");
    updateProgress(0);
  }
}

async function syncResults() {
  if (!electronAPI) return;
  setStatus("Syncing results...");
  try {
    const res = await electronAPI.syncResults();
    appendLog(`\n${res.message || "Synced results"}\n`);
    setStatus("Sync complete");
  } catch (err) {
    appendLog(`\n${err.message}\n`, "error");
    setStatus("Sync failed");
  }
}

async function generateInsights() {
  if (!electronAPI) return;
  if (!lastExperimentId) {
    setStatus("Run an experiment first");
    return;
  }
  const insightPane = qs("#insights-output");
  insightPane.textContent = "Generating insights...";
  try {
    const data = await electronAPI.generateInsights(lastExperimentId);
    insightPane.textContent = JSON.stringify(data, null, 2);
    setStatus("Insights ready");
  } catch (err) {
    insightPane.textContent = err.message;
    setStatus("Insights failed");
  }
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.remove("active"));
      btn.classList.add("active");
      const target = qs(`#${btn.dataset.tab}-tab`);
      if (target) target.classList.add("active");
    });
  });
}

function bindToggles() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function bindRagToggle() {
  const ragEnabled = qs("#rag-enabled");
  const ragSelect = qs("#rag-retriever");
  ragEnabled.addEventListener("change", () => {
    ragSelect.disabled = !ragEnabled.checked;
  });
}

function bindControls() {
  qs("#select-dataset-btn").addEventListener("click", handleSelectDataset);
  qs("#launch-experiment").addEventListener("click", launchExperiment);
  qs("#sync-btn").addEventListener("click", syncResults);
  qs("#insights-btn").addEventListener("click", generateInsights);
  qs("#context-length").addEventListener("input", (e) => {
    qs("#context-display").textContent = `${Number(e.target.value).toLocaleString()} tokens`;
  });
}

function bootCharts() {
  const ctx = document.getElementById("loss-chart");
  if (!ctx || typeof Chart === "undefined") return;
  const labels = Array.from({ length: 10 }).map((_, i) => i);
  const data = labels.map((i) => 1.1 - i * 0.08);
  new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label: "Loss", data, borderColor: "#7c3aed" }] },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

function registerLogStreams() {
  if (!electronAPI) return;
  electronAPI.onExperimentLog((msg) => appendLog(msg));
  electronAPI.onExperimentError((msg) => appendLog(msg, "error"));
}

document.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  bindToggles();
  bindRagToggle();
  bindControls();
  bootCharts();
  registerLogStreams();
  setStatus("Ready");
});
