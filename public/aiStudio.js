/**
 * LabCore ELIS - AI Studio Frontend Engine
 * Drives all 9 AI Studio sub-modules with interactive visualizations,
 * live model execution, training animations, and audit telemetry.
 */

const AiStudio = {
  currentTab: 'overview',
  baseUrl: '/api/v1/ai-studio',
  state: {
    overview: null,
    classicalModels: [],
    datasets: [],
    experiments: [],
    anomalies: null,
    forecasting: null,
    evaluation: null,
    registry: [],
    auditLogs: [],
    selectedEvalModel: 'ML-XGB-002',
    isTraining: false
  },

  // Initialize AI Studio
  async init() {
    console.log("⚡ LabCore AI Studio Engine Initialized.");
    await this.fetchOverview();
  },

  // Navigation Switcher for AI Sub-Modules
  switchTab(tabName) {
    this.currentTab = tabName;

    // Update Subnav active states
    const subnavItems = document.querySelectorAll('.ai-subnav-item');
    subnavItems.forEach(item => item.classList.remove('active'));
    const activeSub = document.getElementById(`subnav-ai-${tabName}`);
    if (activeSub) activeSub.classList.add('active');

    // Update Toolbar active button states
    const tabBtns = document.querySelectorAll('.ai-tab-btn');
    tabBtns.forEach(btn => {
      btn.className = "ai-tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5";
    });
    const activeBtn = document.getElementById(`ai-tab-btn-${tabName}`);
    if (activeBtn) {
      activeBtn.className = "ai-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow transition flex items-center gap-1.5";
    }

    // Hide all tab panels
    const panels = document.querySelectorAll('.ai-tab-panel');
    panels.forEach(p => p.classList.add('hidden'));

    // Show selected panel
    const targetPanel = document.getElementById(`aiTabPanel-${tabName}`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }

    // Lazy load data for the active tab
    switch (tabName) {
      case 'overview':
        this.fetchOverview();
        break;
      case 'classical-ml':
        this.fetchClassicalMl();
        break;
      case 'deep-learning':
        this.fetchDeepLearning();
        break;
      case 'nlp':
        this.initNlp();
        break;
      case 'anomalies':
        this.fetchAnomalies();
        break;
      case 'forecasting':
        this.fetchForecasting();
        break;
      case 'evaluation':
        this.fetchEvaluation();
        break;
      case 'registry':
        this.fetchRegistry();
        break;
      case 'audit':
        this.fetchAuditLogs();
        break;
    }
  },

  // 1. AI OVERVIEW
  async fetchOverview() {
    try {
      const res = await fetch(`${this.baseUrl}/overview`);
      const json = await res.json();
      if (json.success) {
        this.state.overview = json;
        this.renderOverview();
      }
    } catch (e) {
      console.error("Failed to load AI overview", e);
    }
  },

  renderOverview() {
    const data = this.state.overview;
    if (!data) return;

    const kpis = data.kpis;
    document.getElementById('aiKpiAuc').innerText = kpis.meanDiagnosticAuc;
    document.getElementById('aiKpiInferences').innerText = kpis.totalInferencesLogged.toLocaleString();
    document.getElementById('aiKpiModels').innerText = `${kpis.productionModels} Active (${kpis.totalModelsRegistered} Total)`;
    document.getElementById('aiKpiCompliance').innerText = kpis.safetyComplianceScore;

    // Render Recent Alerts
    const alertsContainer = document.getElementById('aiRecentAlertsList');
    if (alertsContainer) {
      alertsContainer.innerHTML = data.recentAlerts.map(alt => `
        <div class="p-3 rounded-xl ${alt.type.includes('PANIC') ? 'bg-rose-950/40 border border-rose-500/40' : 'bg-amber-950/30 border border-amber-500/30'} flex items-start gap-3">
          <i class="fa-solid ${alt.type.includes('PANIC') ? 'fa-triangle-exclamation text-rose-400' : 'fa-bell text-amber-400'} text-sm mt-0.5"></i>
          <div class="flex-1">
            <div class="text-xs font-bold ${alt.type.includes('PANIC') ? 'text-rose-200' : 'text-amber-200'}">${alt.message}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${new Date(alt.timestamp).toLocaleTimeString()} • Real-Time AI Telemetry</div>
          </div>
        </div>
      `).join('');
    }

    // Render Active Models Mini Grid
    const modelsGrid = document.getElementById('aiOverviewModelsGrid');
    if (modelsGrid) {
      modelsGrid.innerHTML = data.models.map(m => `
        <div class="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-purple-500/40 transition">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">${m.version}</span>
            <span class="text-[9px] font-bold ${m.deploymentStatus === 'PRODUCTION' ? 'text-emerald-400' : 'text-amber-400'}">
              <i class="fa-solid fa-circle text-[7px] mr-1"></i>${m.deploymentStatus}
            </span>
          </div>
          <div class="my-2">
            <div class="text-xs font-bold text-slate-100">${m.name}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${m.targetTask}</div>
          </div>
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span class="font-mono text-purple-300">${m.primaryMetric}</span>
            <span class="font-mono">${m.averageLatencyMs}ms</span>
          </div>
        </div>
      `).join('');
    }
  },

  // 2. CLASSICAL MACHINE LEARNING
  async fetchClassicalMl() {
    try {
      const [resModels, resDatasets] = await Promise.all([
        fetch(`${this.baseUrl}/classical-ml/models`),
        fetch(`${this.baseUrl}/classical-ml/datasets`)
      ]);
      const jsonModels = await resModels.json();
      const jsonDatasets = await resDatasets.json();

      if (jsonModels.success) this.state.classicalModels = jsonModels.data;
      if (jsonDatasets.success) this.state.datasets = jsonDatasets.data;

      this.renderClassicalMl();
    } catch (e) {
      console.error("Failed to load Classical ML data", e);
    }
  },

  renderClassicalMl() {
    // Populate Datasets Dropdown
    const dsSelect = document.getElementById('cmlDatasetSelect');
    if (dsSelect && this.state.datasets.length > 0) {
      dsSelect.innerHTML = this.state.datasets.map(d => `
        <option value="${d.key}">${d.name} (${d.features.length} features, ${d.classes.length} classes)</option>
      `).join('');
    }

    // Populate Models for Sandbox
    const modelSelect = document.getElementById('cmlInferenceModelSelect');
    if (modelSelect && this.state.classicalModels.length > 0) {
      modelSelect.innerHTML = this.state.classicalModels.map(m => `
        <option value="${m.id}">${m.name} [${m.algorithm}]</option>
      `).join('');
    }

    // Render Models Roster Table
    const tableBody = document.getElementById('cmlModelsTableBody');
    if (tableBody) {
      tableBody.innerHTML = this.state.classicalModels.map((m, idx) => `
        <tr class="hover:bg-slate-800/30 transition">
          <td class="font-mono text-slate-500 text-[11px]">${idx + 1}</td>
          <td>
            <div class="font-bold text-slate-100">${m.name}</div>
            <div class="text-[10px] font-mono text-purple-400">${m.id}</div>
          </td>
          <td>
            <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
              ${m.algorithm}
            </span>
          </td>
          <td class="font-mono text-slate-300">${(m.metrics.accuracy * 100).toFixed(1)}%</td>
          <td class="font-mono text-emerald-400 font-bold">${m.metrics.rocauc.toFixed(3)}</td>
          <td class="font-mono text-slate-300">${(m.metrics.f1Score * 100).toFixed(1)}%</td>
          <td>
            <span class="text-[10px] px-2 py-0.5 rounded-full badge-ai-prod font-bold">
              ${m.status}
            </span>
          </td>
          <td class="text-right">
            <button onclick="AiStudio.selectModelForInference('${m.id}')" class="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-[10px] font-bold transition">
              <i class="fa-solid fa-play text-[9px] mr-1"></i> Predict
            </button>
          </td>
        </tr>
      `).join('');
    }
  },

  async handleTrainClassicalModel(e) {
    e.preventDefault();
    const name = document.getElementById('cmlModelName').value;
    const algo = document.getElementById('cmlAlgoSelect').value;
    const datasetKey = document.getElementById('cmlDatasetSelect').value;
    const nEst = Number(document.getElementById('cmlEstimators').value) || 50;
    const maxD = Number(document.getElementById('cmlMaxDepth').value) || 6;
    const lr = Number(document.getElementById('cmlLearningRate').value) || 0.1;

    const progressBox = document.getElementById('cmlTrainProgress');
    if (progressBox) progressBox.classList.remove('hidden');

    try {
      const res = await fetch(`${this.baseUrl}/classical-ml/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: name,
          algorithm: algo,
          datasetKey,
          hyperparameters: { nEstimators: nEst, maxDepth: maxD, learningRate: lr }
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Model '${json.data.name}' trained! ROC-AUC: ${json.data.metrics.rocauc}`, 'success');
        if (progressBox) progressBox.classList.add('hidden');
        await this.fetchClassicalMl();
      } else {
        showToast(json.message, 'warning');
      }
    } catch (err) {
      showToast("Training failed", 'warning');
    }
  },

  async handleRunClassicalInference() {
    const modelId = document.getElementById('cmlInferenceModelSelect').value;
    const hba1c = Number(document.getElementById('cmlInputHba1c')?.value) || 8.6;
    const fbs = Number(document.getElementById('cmlInputFbs')?.value) || 182;
    const creatinine = Number(document.getElementById('cmlInputCreatinine')?.value) || 2.3;
    const microalbumin = Number(document.getElementById('cmlInputMicroalbumin')?.value) || 120;
    const troponin = Number(document.getElementById('cmlInputTroponin')?.value) || 1.84;
    const potassium = Number(document.getElementById('cmlInputPotassium')?.value) || 6.4;

    try {
      const res = await fetch(`${this.baseUrl}/classical-ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          inputFeatures: { hba1c, fbs, creatinine, microalbumin, troponin, potassium, sbp: 138, age: 58 }
        })
      });
      const json = await res.json();
      if (json.success) {
        this.renderInferenceResult('cmlInferenceOutput', json.data);
      }
    } catch (e) {
      showToast("Inference error", 'warning');
    }
  },

  selectModelForInference(id) {
    const sel = document.getElementById('cmlInferenceModelSelect');
    if (sel) {
      sel.value = id;
      document.getElementById('cmlInferenceSection')?.scrollIntoView({ behavior: 'smooth' });
    }
  },

  // 3. DEEP LEARNING (PyTorch)
  async fetchDeepLearning() {
    try {
      const res = await fetch(`${this.baseUrl}/deep-learning/experiments`);
      const json = await res.json();
      if (json.success) {
        this.state.experiments = json.data;
        this.renderDeepLearning();
      }
    } catch (e) {
      console.error("Failed to load deep learning experiments", e);
    }
  },

  renderDeepLearning() {
    const expList = document.getElementById('dlExperimentsList');
    if (expList && this.state.experiments.length > 0) {
      expList.innerHTML = this.state.experiments.map(exp => `
        <div class="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-purple-500/40 transition shadow-lg">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                ${exp.framework}
              </span>
              <span class="text-[10px] text-emerald-400 font-bold font-mono">
                Val Acc: ${(exp.metrics.finalValAccuracy * 100).toFixed(1)}%
              </span>
            </div>
            <h4 class="font-extrabold text-sm text-slate-100 mt-2">${exp.modelName}</h4>
            <p class="text-[11px] text-slate-400 font-mono mt-1">${exp.architecture}</p>
          </div>

          <div class="my-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div>
              <span class="text-slate-500 block">Train Loss</span>
              <strong class="text-slate-200 font-mono">${exp.metrics.finalTrainLoss}</strong>
            </div>
            <div>
              <span class="text-slate-500 block">Val Loss</span>
              <strong class="text-slate-200 font-mono">${exp.metrics.finalValLoss}</strong>
            </div>
            <div>
              <span class="text-slate-500 block">ROC-AUC</span>
              <strong class="text-purple-300 font-mono">${exp.metrics.rocAuc}</strong>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
            <span class="text-slate-500 font-mono">${exp.experimentId}</span>
            <button onclick="AiStudio.plotExperimentCurve('${exp.experimentId}')" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition">
              <i class="fa-solid fa-chart-line mr-1"></i> View Curves
            </button>
          </div>
        </div>
      `).join('');

      // Plot first experiment by default
      if (this.state.experiments[0]) {
        this.plotExperimentCurve(this.state.experiments[0].experimentId);
      }
    }
  },

  plotExperimentCurve(expId) {
    const exp = this.state.experiments.find(e => e.experimentId === expId);
    if (!exp) return;

    document.getElementById('dlCurrentPlotName').innerText = `${exp.modelName} (Epochs: ${exp.hyperparameters.epochs}, Opt: ${exp.hyperparameters.optimizer})`;
    const canvas = document.getElementById('dlTrainingCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const history = exp.trainingHistory;
    const w = canvas.width;
    const h = canvas.height;
    const pad = 35;

    // Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = pad; y <= h - pad; y += 30) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    // Draw Train Loss (Rose)
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = pad + (i / (history.length - 1)) * (w - 2 * pad);
      const y = h - pad - (pt.trainLoss / 1.0) * (h - 2 * pad);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Val Accuracy (Emerald)
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = pad + (i / (history.length - 1)) * (w - 2 * pad);
      const y = h - pad - pt.valAccuracy * (h - 2 * pad);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('Epoch 0', pad, h - 10);
    ctx.fillText(`Epoch ${exp.hyperparameters.epochs}`, w - pad - 45, h - 10);
    ctx.fillText('Loss: 1.0 / Acc: 100%', 5, pad - 5);
  },

  async handleLaunchDeepTraining(e) {
    e.preventDefault();
    const name = document.getElementById('dlModelName').value;
    const arch = document.getElementById('dlArchSelect').value;
    const epochs = document.getElementById('dlEpochs').value;
    const batch = document.getElementById('dlBatchSize').value;
    const lr = document.getElementById('dlLearningRate').value;
    const opt = document.getElementById('dlOptimizer').value;

    try {
      const res = await fetch(`${this.baseUrl}/deep-learning/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: name, architectureType: arch, epochs, batchSize: batch, learningRate: lr, optimizer: opt })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`PyTorch Experiment '${json.data.modelName}' Completed! Val Acc: ${(json.data.metrics.finalValAccuracy * 100).toFixed(1)}%`, 'success');
        await this.fetchDeepLearning();
      }
    } catch (err) {
      showToast("Deep learning run failed", 'warning');
    }
  },

  // 4. CLINICAL NLP & MEDICAL INTELLIGENCE
  initNlp() {
    const textInput = document.getElementById('nlpTextInput') || document.getElementById('nlpInputText');
    if (textInput && !textInput.value) {
      textInput.value = `CHIEF COMPLAINT:
Severe retrosternal crushing chest pain radiating to left jaw for 45 minutes with acute diaphoresis.

LABORATORY & PATHOLOGY FINDINGS:
- High Sensitivity Cardiac Troponin I (hs-cTnI): elevated at 1.84 ng/mL (reference < 0.04 ng/mL) with severe delta surge.
- Serum Potassium (K+): critical elevation at 6.4 mEq/L (reference 3.5 - 5.1 mEq/L) — peaked T-waves on ECG.
- Serum Creatinine: elevated at 2.3 mg/dL (reference 0.7 - 1.3 mg/dL).

CURRENT MEDICATIONS:
Tab Metformin 500mg BD, Tab Atorvastatin 20mg OD, Tab Telmisartan 40mg OD.

IMPRESSION:
Acute ST-Elevation Myocardial Infarction (Anterior Wall STEMI) complicated by acute hyperkalemia and acute kidney injury. Denies gastrointestinal bleeding.`;
    }
  },

  setNlpSample(sampleType) {
    const textInput = document.getElementById('nlpTextInput') || document.getElementById('nlpInputText');
    if (!textInput) return;

    if (sampleType === 'cardiac') {
      textInput.value = `CHIEF COMPLAINT:
Severe retrosternal crushing chest pain radiating to left jaw for 45 minutes with acute diaphoresis.

LABORATORY & PATHOLOGY FINDINGS:
- High Sensitivity Cardiac Troponin I (hs-cTnI): elevated at 1.84 ng/mL (reference < 0.04 ng/mL) with severe delta surge.
- Serum Potassium (K+): critical elevation at 6.4 mEq/L (reference 3.5 - 5.1 mEq/L) — peaked T-waves on ECG.
- Serum Creatinine: elevated at 2.3 mg/dL (reference 0.7 - 1.3 mg/dL).

CURRENT MEDICATIONS:
Tab Metformin 500mg BD, Tab Atorvastatin 20mg OD, Tab Telmisartan 40mg OD.

IMPRESSION:
Acute ST-Elevation Myocardial Infarction (Anterior Wall STEMI) complicated by acute hyperkalemia and acute kidney injury. Denies gastrointestinal bleeding.`;
    } else if (sampleType === 'sepsis') {
      textInput.value = `CHIEF COMPLAINT:
Altered sensorium, high-grade spiking fevers, and refractory hypotension admitted to ICU.

INVESTIGATIONS:
- Serum Procalcitonin (PCT): marked surge at 6.2 ng/mL (reference < 0.05 ng/mL).
- Blood Lactic Acid: critical elevation at 4.6 mmol/L (reference 0.5 - 2.0 mmol/L).
- Total Leukocytes (WBC): severe leukocytosis at 24.8 x10^3/uL.
- Platelet Count: consumptive thrombocytopenia at 64 x10^3/uL.
- Serum Creatinine: acute azotemia at 3.1 mg/dL.

MEDICATIONS:
IV Norepinephrine infusion, IV Piperacillin-Tazobactam 4.5g Q6H.

ASSESSMENT:
Urosepsis progressing to Septic Shock with Multi-Organ Dysfunction Syndrome (MODS). SOFA score 9.`;
    } else if (sampleType === 'diabetic') {
      textInput.value = `CHIEF COMPLAINT:
71yo male with 18-year history of Type 2 Diabetes Mellitus presenting with bilateral lower extremity pitting edema and burning neuropathic feet sensations.

LABORATORY FINDINGS:
- Glycated Hemoglobin (HbA1c): elevated at 8.9% (reference < 5.7%).
- Serum Creatinine: baseline progression to 3.2 mg/dL (eGFR 22 mL/min/1.73m2, Stage 4 CKD).
- Urine Microalbumin: macroalbuminuria at 420 mg/L.
- Serum Potassium: borderline high at 5.2 mEq/L.

MEDICATIONS:
Active prescriptions include Tab Metformin 1000mg BD, Tab Atorvastatin 20mg OD, Tab Ramipril 5mg OD.

WARNING:
High-dose Metformin contraindicated due to eGFR < 30 mL/min (MALA lactic acidosis risk). Discontinue Metformin immediately.`;
    }
    this.handleRunNlpAnalysis();
  },

  handleNlpParse() {
    this.handleRunNlpAnalysis();
  },

  async handleRunNlpAnalysis() {
    const textInput = document.getElementById('nlpTextInput') || document.getElementById('nlpInputText');
    const text = textInput ? textInput.value : '';
    if (!text) {
      showToast("Please enter clinical narrative text", 'warning');
      return;
    }

    try {
      const res = await fetch(`${this.baseUrl}/nlp/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicalText: text })
      });
      const json = await res.json();
      if (json.success) {
        this.state.lastNlpResult = json.data;
        this.renderNlpResults(json.data);
        showToast("Clinical NLP Analysis completed with international coding!", 'success');
      }
    } catch (e) {
      showToast("Clinical NLP analysis failed", 'warning');
    }
  },

  downloadFhirJson() {
    if (!this.state.lastNlpResult?.fhirR4Bundle) {
      showToast("Please run analysis first to generate FHIR R4 bundle", 'warning');
      return;
    }
    const blob = new Blob([JSON.stringify(this.state.lastNlpResult.fhirR4Bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HL7_FHIR_R4_ClinicalBundle_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("HL7 FHIR R4 bundle exported successfully!", 'success');
  },

  renderNlpResults(data) {
    // 1. Entities Cloud with pastel badges
    const entitiesBox = document.getElementById('nlpEntitiesOutput');
    if (entitiesBox && data.entities) {
      entitiesBox.innerHTML = data.entities.map(ent => {
        let style = 'background:#F0F9FF; color:#0369A1; border:1px solid #BAE6FD;';
        if (ent.type === 'MEDICATION_PHARMA') style = 'background:#ECFDF5; color:#047857; border:1px solid #A7F3D0;';
        if (ent.type === 'CLINICAL_SEVERITY') style = 'background:#FFF1F2; color:#BE123C; border:1px solid #FECDD3;';
        if (ent.type === 'ANATOMICAL_SITE') style = 'background:#F5F3FF; color:#6D28D9; border:1px solid #DDD6FE;';
        if (ent.assertion === 'NEGATED') style = 'background:#F8FAFC; color:#64748B; border:1px solid #CBD5E1; text-decoration:line-through;';

        return `
          <span style="font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; ${style}">
            <strong>${ent.entity}</strong>
            <span style="font-size:0.6rem; opacity:0.75; font-family:monospace; text-transform:uppercase;">${(ent.type || '').replace(/_/g, ' ')}</span>
            ${ent.assertion === 'NEGATED' ? '<span style="font-size:0.55rem; background:#E2E8F0; padding:1px 4px; border-radius:4px;">NEGATED</span>' : ''}
          </span>
        `;
      }).join('') || '<div style="font-size:0.74rem; color:#94A3B8;">No clinical entities detected.</div>';
    }

    // 2. LOINC Laboratory Analytes Table
    const loincBox = document.getElementById('nlpLoincOutput');
    if (loincBox && data.loincCodes) {
      loincBox.innerHTML = data.loincCodes.map(loinc => `
        <div style="background:#FFFFFF; border:1px solid ${loinc.isPanic ? '#FECDD3' : '#E2E8F0'}; border-radius:8px; padding:6px 10px; display:flex; align-items:center; justify-content:between;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:monospace; font-size:0.65rem; font-weight:800; color:#0284C7; background:#F0F9FF; padding:1px 5px; border-radius:4px; border:1px solid #BAE6FD;">LOINC ${loinc.code}</span>
              <strong style="font-size:0.74rem; color:#0F172A;">${loinc.name.split('[')[0]}</strong>
              ${loinc.isPanic ? '<span style="font-size:0.6rem; font-weight:800; background:#BE123C; color:white; padding:1px 5px; border-radius:4px;">PANIC</span>' : ''}
            </div>
          </div>
          <div style="text-align:right; font-family:monospace;">
            <strong style="font-size:0.78rem; color:${loinc.isPanic ? '#BE123C' : '#0F172A'};">${loinc.extractedValue !== null ? loinc.extractedValue + ' ' + loinc.unit : 'Present'}</strong>
            <div style="font-size:0.65rem; color:#64748B;">Ref: ${loinc.normalRange}</div>
          </div>
        </div>
      `).join('') || '<div style="font-size:0.74rem; color:#94A3B8;">No LOINC analytes matched.</div>';
    }

    // 3. ICD-10-CM / ICD-11 & SNOMED CT suggestions
    const icdBox = document.getElementById('nlpIcd10Output');
    if (icdBox && data.suggestedICD10) {
      icdBox.innerHTML = data.suggestedICD10.map(icd => `
        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:6px 10px; display:flex; align-items:center; justify-content:between;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:monospace; font-size:0.68rem; font-weight:800; color:#7C3AED; background:#F5F3FF; padding:1px 5px; border-radius:4px; border:1px solid #DDD6FE;">${icd.code}</span>
              ${icd.icd11 ? `<span style="font-family:monospace; font-size:0.62rem; color:#64748B;">ICD-11: ${icd.icd11}</span>` : ''}
            </div>
            <div style="font-size:0.72rem; color:#334155; font-weight:600; margin-top:2px;">${icd.description}</div>
          </div>
          <span style="font-family:monospace; font-size:0.68rem; font-weight:800; color:#047857; background:#ECFDF5; padding:2px 6px; border-radius:4px; border:1px solid #A7F3D0;">
            ${(icd.confidence * 100).toFixed(0)}% Conf
          </span>
        </div>
      `).join('') || '<div style="font-size:0.74rem; color:#94A3B8;">No ICD-10 diagnostic codes mapped.</div>';
    }

    // 4. Urgency Meter & Impression Card
    const urgencyCard = document.getElementById('nlpUrgencyCard');
    const urgencyBadge = document.getElementById('nlpUrgencyBadge');
    const impressionText = document.getElementById('nlpImpressionText');
    const actionText = document.getElementById('nlpActionText');

    if (urgencyCard && data.urgency) {
      urgencyCard.style.display = 'block';
      const isPanic = data.urgency.level === 'CRITICAL_PANIC';
      urgencyCard.style.background = isPanic ? '#FFF1F2' : '#F0FDF4';
      urgencyCard.style.borderColor = isPanic ? '#FECDD3' : '#BBF7D0';

      if (urgencyBadge) {
        urgencyBadge.innerText = (data.urgency.level || 'ROUTINE').replace(/_/g, ' ');
        urgencyBadge.style.background = isPanic ? '#BE123C' : '#059669';
        urgencyBadge.style.color = 'white';
      }

      if (impressionText) {
        impressionText.innerText = data.clinicalImpression || data.structuredSummary?.clinicalImpression || '';
      }

      if (actionText) {
        actionText.innerText = data.recommendedAction || data.structuredSummary?.recommendedAction || '';
      }
    }
  },

  // 5. ANOMALY DETECTION
  async fetchAnomalies() {
    try {
      const res = await fetch(`${this.baseUrl}/anomalies`);
      const json = await res.json();
      if (json.success) {
        this.state.anomalies = json;
        this.renderAnomalies();
      }
    } catch (e) {
      console.error("Failed to load anomalies", e);
    }
  },

  renderAnomalies() {
    const data = this.state.anomalies;
    if (!data) return;

    // Analyzer QC Drift
    const qcContainer = document.getElementById('anomAnalyzerQcList');
    if (qcContainer) {
      qcContainer.innerHTML = data.analyzerQC.map(a => {
        const isOk = a.qcStatus === 'IN_CONTROL';
        return `
          <div class="p-4 bg-slate-900/90 border ${isOk ? 'border-slate-800' : 'border-rose-500/40'} rounded-2xl">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-xs text-slate-100">${a.analyzerName}</h4>
                <div class="text-[10px] text-slate-400 font-mono">${a.analyte} • Target: ${a.targetMean} ± ${a.targetSD} ${a.unit}</div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isOk ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'badge-panic'}">
                ${isOk ? 'IN CONTROL' : 'QC VIOLATION'}
              </span>
            </div>

            <div class="mt-3 p-2 bg-slate-950 rounded-lg font-mono text-[10px] text-slate-400 flex items-center justify-between">
              <span>Latest Z-Score: <strong class="${Math.abs(a.lastZScore) > 2 ? 'text-rose-400' : 'text-slate-200'}">${a.lastZScore} SD</strong></span>
              <span>Control Runs Evaluated: ${a.controlRuns.length}</span>
            </div>

            ${a.violations.length > 0 ? `
              <div class="mt-2 space-y-1">
                ${a.violations.map(v => `
                  <div class="text-[11px] text-rose-300 flex items-center gap-1.5 font-medium">
                    <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
                    <span>Westgard <strong>${v.rule}</strong>: ${v.description}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    // Operational Outliers
    const opsContainer = document.getElementById('anomOpsList');
    if (opsContainer) {
      opsContainer.innerHTML = data.operational.map(op => `
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-flask-vial"></i>
          </div>
          <div class="flex-1">
            <div class="text-xs font-bold text-slate-200">${op.title}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${op.recommendation}</div>
            <div class="text-[9px] font-mono text-purple-400 mt-1">Accession: ${op.sampleAccession} • Dept: ${op.department}</div>
          </div>
        </div>
      `).join('');
    }
  },

  async handleTestDeltaAnomaly() {
    const param = document.getElementById('anomParamCode').value;
    const cur = Number(document.getElementById('anomCurVal').value);
    const prev = Number(document.getElementById('anomPrevVal').value);

    try {
      const res = await fetch(`${this.baseUrl}/anomalies/detect-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paramCode: param,
          paramName: param,
          currentValue: cur,
          previousValue: prev,
          normalMin: 0.0,
          normalMax: 0.04
        })
      });
      const json = await res.json();
      if (json.success) {
        const outBox = document.getElementById('anomDeltaResultOutput');
        if (outBox) {
          outBox.innerHTML = `
            <div class="p-3 rounded-xl ${json.data.requiresDeltaAlert ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200' : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'} space-y-1">
              <div class="font-bold flex items-center justify-between">
                <span>Anomaly Status: ${json.data.anomalySeverity}</span>
                <span class="font-mono">Score: ${(json.data.anomalyScore * 100).toFixed(0)}%</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">${json.data.explanation}</p>
            </div>
          `;
        }
      }
    } catch (e) {
      showToast("Delta check error", 'warning');
    }
  },

  // 6. FORECASTING & PREDICTION
  async fetchForecasting() {
    try {
      const [resVol, resReagents] = await Promise.all([
        fetch(`${this.baseUrl}/forecasting/volume`),
        fetch(`${this.baseUrl}/forecasting/reagents`)
      ]);
      const jsonVol = await resVol.json();
      const jsonReagents = await resReagents.json();

      if (jsonVol.success) {
        this.state.forecasting = { volume: jsonVol.data, reagents: jsonReagents.data };
        this.renderForecasting();
      }
    } catch (e) {
      console.error("Failed to load forecasting data", e);
    }
  },

  renderForecasting() {
    const data = this.state.forecasting;
    if (!data) return;

    document.getElementById('fcTotal7Days').innerText = data.volume.totalProjectedNext7Days.toLocaleString();
    document.getElementById('fcMapeAccuracy').innerText = data.volume.mapeAccuracy;

    // Draw Volume Canvas Chart
    const canvas = document.getElementById('fcVolumeCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const pad = 35;
      const history = data.volume.historical;
      const forecast = data.volume.forecast;
      const allPoints = [...history.map(h => ({ val: h.actualCount, isFc: false })), ...forecast.map(f => ({ val: f.predictedCount, isFc: true }))];

      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      for (let y = pad; y <= h - pad; y += 30) {
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }

      // Draw Historical (Sky blue)
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      history.forEach((pt, i) => {
        const x = pad + (i / (allPoints.length - 1)) * (w - 2 * pad);
        const y = h - pad - ((pt.actualCount - 50) / 400) * (h - 2 * pad);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Forecast (Purple dashed)
      ctx.strokeStyle = '#C084FC';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const startIdx = history.length - 1;
      const startPt = history[startIdx];
      const startX = pad + (startIdx / (allPoints.length - 1)) * (w - 2 * pad);
      const startY = h - pad - ((startPt.actualCount - 50) / 400) * (h - 2 * pad);
      ctx.moveTo(startX, startY);

      forecast.forEach((pt, i) => {
        const idx = startIdx + 1 + i;
        const x = pad + (idx / (allPoints.length - 1)) * (w - 2 * pad);
        const y = h - pad - ((pt.predictedCount - 50) / 400) * (h - 2 * pad);
        ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Reagents Table
    const rTable = document.getElementById('fcReagentsTableBody');
    if (rTable && data.reagents) {
      rTable.innerHTML = data.reagents.map(r => `
        <tr class="hover:bg-slate-800/30">
          <td class="font-semibold text-slate-100">${r.reagentKit}</td>
          <td class="font-mono text-purple-300">${r.remainingTests} tests</td>
          <td class="font-mono text-slate-400">${r.dailyConsumptionRate}/day</td>
          <td class="font-mono font-bold ${r.projectedDaysRemaining < 3 ? 'text-rose-400' : 'text-emerald-400'}">
            ${r.projectedDaysRemaining} days
          </td>
          <td>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${r.status.includes('CRITICAL') ? 'badge-panic' : 'badge-ai-prod'} font-bold">
              ${r.status}
            </span>
          </td>
        </tr>
      `).join('');
    }
  },

  async handlePredictTat() {
    const dept = document.getElementById('fcTatDept').value;
    const comp = Number(document.getElementById('fcTatComp').value);
    const stat = document.getElementById('fcTatStat').checked;
    const queue = Number(document.getElementById('fcTatQueue').value);
    const techs = Number(document.getElementById('fcTatTechs').value);

    try {
      const res = await fetch(`${this.baseUrl}/forecasting/tat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: dept,
          panelComplexity: comp,
          isStatUrgent: stat,
          analyzerQueueLength: queue,
          activeTechnicians: techs
        })
      });
      const json = await res.json();
      if (json.success) {
        const outBox = document.getElementById('fcTatOutput');
        if (outBox) {
          outBox.innerHTML = `
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Predicted Turnaround Time:</span>
                <strong class="text-lg font-mono text-purple-300">${json.data.predictedTatMinutes} mins</strong>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">SLA Target: ${json.data.slaTargetMinutes} mins</span>
                <span class="text-emerald-400 font-bold">${json.data.slaComplianceProbability}% SLA Probability</span>
              </div>
              <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-800">${json.data.recommendation}</div>
            </div>
          `;
        }
      }
    } catch (e) {
      showToast("TAT calculation failed", 'warning');
    }
  },

  // 7. MODEL EVALUATION
  async fetchEvaluation() {
    try {
      const res = await fetch(`${this.baseUrl}/evaluation/${this.state.selectedEvalModel}`);
      const json = await res.json();
      if (json.success) {
        this.state.evaluation = json.data;
        this.renderEvaluation();
      }
    } catch (e) {
      console.error("Failed to load evaluation data", e);
    }
  },

  renderEvaluation() {
    const data = this.state.evaluation;
    if (!data) return;

    // Draw ROC Curve on Canvas
    const canvas = document.getElementById('evalRocCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const pad = 35;

      // Draw Diagonal Baseline (Random Classifier)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad, h - pad);
      ctx.lineTo(w - pad, pad);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw ROC Curve (Purple/Cyan)
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      data.rocPoints.forEach((pt, i) => {
        const x = pad + pt.fpr * (w - 2 * pad);
        const y = h - pad - pt.tpr * (h - 2 * pad);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#64748B';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText('0.0 (FPR)', pad, h - 10);
      ctx.fillText('1.0 (FPR)', w - pad - 35, h - 10);
      ctx.fillText('1.0 (TPR)', 5, pad + 10);
    }

    // Confusion Matrix
    const cm = data.confusionMatrix;
    const cmContainer = document.getElementById('evalConfusionMatrixGrid');
    if (cmContainer) {
      cmContainer.innerHTML = `
        <table class="w-full text-center text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
          <thead class="bg-slate-950 text-slate-400">
            <tr>
              <th class="p-2 text-left">True \\ Pred</th>
              ${cm.labels.map(l => `<th class="p-2">${l.substring(0, 8)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${cm.matrix.map((row, rIdx) => `
              <tr class="border-t border-slate-800/80">
                <td class="p-2 font-bold text-left text-slate-300">${cm.labels[rIdx].substring(0, 8)}</td>
                ${row.map((val, cIdx) => `
                  <td class="p-2 ${rIdx === cIdx ? 'bg-purple-900/30 text-purple-200 font-bold' : 'text-slate-500'}">
                    ${val}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // SHAP Explainability
    const shapList = document.getElementById('evalShapList');
    if (shapList) {
      shapList.innerHTML = data.shapAttributionSummary.map(s => `
        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div class="font-bold text-slate-200">${s.feature}</div>
            <div class="text-[10px] text-slate-400">${s.direction}</div>
          </div>
          <span class="font-mono text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            |SHAP|: ${s.meanAbsShap}
          </span>
        </div>
      `).join('');
    }
  },

  // 8. MODEL REGISTRY
  async fetchRegistry() {
    try {
      const res = await fetch(`${this.baseUrl}/registry`);
      const json = await res.json();
      if (json.success) {
        this.state.registry = json.data;
        this.renderRegistry();
      }
    } catch (e) {
      console.error("Failed to load registry", e);
    }
  },

  renderRegistry() {
    const tableBody = document.getElementById('regModelsTableBody');
    if (tableBody) {
      tableBody.innerHTML = this.state.registry.map((m, idx) => `
        <tr class="hover:bg-slate-800/30 transition">
          <td class="font-mono text-slate-500 text-[11px]">${idx + 1}</td>
          <td>
            <div class="font-bold text-slate-100">${m.name}</div>
            <div class="text-[10px] text-slate-400">${m.targetTask}</div>
          </td>
          <td>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-bold">
              ${m.version}
            </span>
          </td>
          <td class="font-mono text-[11px] text-slate-300">${m.framework}</td>
          <td class="font-mono text-emerald-400 text-[11px]">${m.primaryMetric}</td>
          <td>
            <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
              m.deploymentStatus === 'PRODUCTION' ? 'badge-ai-prod' : m.deploymentStatus === 'STAGING' ? 'badge-ai-staging' : 'badge-ai-archived'
            }">
              ${m.deploymentStatus}
            </span>
          </td>
          <td class="text-right">
            <select onchange="AiStudio.handleDeployChange('${m.registryId}', this.value)" class="bg-slate-900 border border-slate-700 text-[10px] rounded px-2 py-1 text-slate-300">
              <option value="PRODUCTION" ${m.deploymentStatus === 'PRODUCTION' ? 'selected' : ''}>Production</option>
              <option value="STAGING" ${m.deploymentStatus === 'STAGING' ? 'selected' : ''}>Staging</option>
              <option value="ARCHIVED" ${m.deploymentStatus === 'ARCHIVED' ? 'selected' : ''}>Archived</option>
            </select>
          </td>
        </tr>
      `).join('');
    }
  },

  async handleDeployChange(regId, newStatus) {
    try {
      const res = await fetch(`${this.baseUrl}/registry/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registryId: regId, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        await this.fetchRegistry();
      }
    } catch (e) {
      showToast("Status update failed", 'warning');
    }
  },

  // 9. AI AUDIT & MONITORING
  async fetchAuditLogs() {
    try {
      const [resLogs, resDrift] = await Promise.all([
        fetch(`${this.baseUrl}/audit-logs?limit=30`),
        fetch(`${this.baseUrl}/drift-metrics`)
      ]);
      const jsonLogs = await resLogs.json();
      const jsonDrift = await resDrift.json();

      if (jsonLogs.success) this.state.auditLogs = jsonLogs.data;
      this.renderAudit(jsonDrift.data);
    } catch (e) {
      console.error("Failed to load audit logs", e);
    }
  },

  renderAudit(driftData) {
    // Audit Stream Table
    const tableBody = document.getElementById('auditLogsTableBody');
    if (tableBody) {
      tableBody.innerHTML = this.state.auditLogs.map((log, idx) => `
        <tr class="hover:bg-slate-800/30 transition text-[11px]">
          <td class="font-mono text-slate-500">${new Date(log.timestamp).toLocaleTimeString()}</td>
          <td class="font-bold text-slate-200">${log.modelName}</td>
          <td class="font-mono text-purple-300">${log.patientUhid}</td>
          <td class="text-slate-300">${log.outputClass}</td>
          <td class="font-mono text-emerald-400 font-bold">${(log.confidenceScore * 100).toFixed(1)}%</td>
          <td class="font-mono text-slate-400">${log.latencyMs}ms</td>
          <td>
            <span class="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              <i class="fa-solid fa-shield-check mr-1"></i>Decision Support Only
            </span>
          </td>
        </tr>
      `).join('');
    }

    // Drift Telemetry Grid
    const driftContainer = document.getElementById('auditDriftGrid');
    if (driftContainer && driftData) {
      driftContainer.innerHTML = driftData.driftMetricsByAnalyte.map(d => `
        <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div class="font-bold text-slate-200">${d.analyte}</div>
            <div class="text-[10px] text-slate-400 font-mono">Baseline: ${d.baselineMean} vs Current: ${d.currentBatchMean}</div>
          </div>
          <div class="text-right">
            <span class="font-mono text-purple-300 font-bold block">PSI: ${d.psiScore}</span>
            <span class="text-[9px] text-emerald-400 font-semibold">${d.driftStatus}</span>
          </div>
        </div>
      `).join('');
    }
  },

  // Helper renderer for live inference output card
  renderInferenceResult(targetElementId, pred) {
    const el = document.getElementById(targetElementId);
    if (!el) return;

    let tierBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (pred.urgencyLevel.includes('CRITICAL')) tierBadge = 'badge-panic text-rose-300';
    else if (pred.urgencyLevel.includes('HIGH')) tierBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

    el.innerHTML = `
      <div class="p-4 bg-slate-950 border border-purple-500/40 rounded-2xl space-y-3 shadow-xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-300">Model: ${pred.modelName}</span>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${tierBadge}">
            ${pred.predictedClass} (${pred.confidencePercentage}%)
          </span>
        </div>

        <div class="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs">
          <strong class="text-purple-200 block mb-1">Clinical Decision Support Recommendation:</strong>
          <p class="text-slate-300">${pred.recommendation}</p>
        </div>

        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Feature Attribution Breakdown (SHAP Approximations):</span>
          <div class="space-y-1">
            ${pred.featureAttributions.map(fa => `
              <div class="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                <span class="text-slate-300">${fa.feature} (Observed: <strong>${fa.value} ${fa.unit}</strong>)</span>
                <div class="flex items-center gap-2">
                  <div class="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-purple-500 h-full rounded-full" style="width: ${Math.min(100, fa.impactScore)}%"></div>
                  </div>
                  <span class="font-mono text-purple-300 text-[11px]">${fa.impactScore}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="text-[10px] text-amber-400/90 pt-2 border-t border-slate-900 italic">
          ⚠️ ${pred.disclaimer}
        </div>
      </div>
    `;
  }
};

window.AiStudio = AiStudio;
