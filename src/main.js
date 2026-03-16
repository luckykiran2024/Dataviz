/* ======================================================
   DataViz Pro — Main Application Entry Point
   Bootstraps all modules, wires events, manages UI state.
   ====================================================== */
import './styles/index.css';
import dataStore from './data/DataStore.js';
import { importFile, importText } from './data/importers.js';
import { sampleDatasets } from './data/sampleData.js';
import { CHART_TYPES } from './charts/ChartFactory.js';
import {
  initDashboard, addPanel, refreshAll, getSelectedPanel,
  updatePanelField, updatePanelAggregation, setSelectedPanelType,
  exportDashboardJSON, getPanels,
} from './dashboard/Dashboard.js';
import llmService from './analytics/LLMService.js';
import { runTrendForecast, runAnomalyDetection, runDataOverview, askQuestion } from './analytics/PredictiveEngine.js';
import { generateRecommendations, runWhatIfAnalysis, runOptimizationAnalysis } from './analytics/PrescriptiveEngine.js';
import { renderMarkdown } from './analytics/markdownRenderer.js';

/* ===== State ===== */
let selectedChartType = 'bar';
let currentTheme = 'dark';
let chatHistory = [];
let activeTab = 'dashboard';

/* ===== DOM References ===== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupToolbar();
  setupSidebar();
  setupImportModal();
  setupSampleDataModal();
  setupExportModal();
  setupFilterPanel();
  setupTheme();
  setupDataStoreListeners();
  setupAnalyticsTabs();
  setupSettingsModal();
  setupPredictivePanel();
  setupPrescriptivePanel();
  setupCalcFieldModal();
});

/* ============================================================
   TOOLBAR
   ============================================================ */
function setupToolbar() {
  $('#btn-import').addEventListener('click', () => showModal('modal-import'));
  $('#btn-sample-data').addEventListener('click', () => showModal('modal-sample'));
  $('#btn-add-chart').addEventListener('click', () => {
    if (!dataStore.getActive()) {
      toast('Load data first', 'info');
      return;
    }
    addPanel({ chartType: selectedChartType });
    syncShelvesToPanel();
  });
  $('#btn-filters').addEventListener('click', toggleFilterPanel);
  $('#btn-export').addEventListener('click', () => showModal('modal-export'));
  $('#btn-settings').addEventListener('click', () => showModal('modal-settings'));
  $('#btn-theme').addEventListener('click', toggleTheme);
}

/* ============================================================
   CALCULATED FIELDS MODAL
   ============================================================ */
function setupCalcFieldModal() {
  $('#btn-add-calc-field').addEventListener('click', () => {
    if (!dataStore.getActive()) {
      toast('Load data first', 'info');
      return;
    }
    $('#calc-field-name').value = '';
    $('#calc-field-expr').value = '';
    $('#calc-field-error').textContent = '';
    showModal('modal-calc-field');
  });

  $('#btn-save-calc-field').addEventListener('click', () => {
    const name = $('#calc-field-name').value.trim();
    const expr = $('#calc-field-expr').value.trim();
    const errorEl = $('#calc-field-error');
    errorEl.textContent = '';

    if (!name || !expr) {
      errorEl.textContent = 'Both name and expression are required.';
      return;
    }

    try {
      dataStore.addCalculatedField(name, expr);
      hideModal('modal-calc-field');
      toast(`Created calculated field: ${name}`, 'success');
      // Force a UI refresh of the field list since dataset mutated
      populateFieldLists(dataStore.getActive().fields);
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

/* ============================================================
   SIDEBAR — Fields, Shelves, Chart Types
   ============================================================ */
function setupSidebar() {
  // Populate chart type grid
  const grid = $('#chart-type-grid');
  for (const ct of CHART_TYPES) {
    const btn = document.createElement('button');
    btn.className = 'chart-type-btn' + (ct.id === selectedChartType ? ' active' : '');
    btn.dataset.type = ct.id;
    btn.innerHTML = `${ct.icon}<span>${ct.name}</span>`;
    btn.addEventListener('click', () => {
      $$('.chart-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedChartType = ct.id;
      setSelectedPanelType(ct.id);
    });
    grid.appendChild(btn);
  }

  // Dataset selector
  $('#dataset-select').addEventListener('change', (e) => {
    if (e.target.value) dataStore.setActive(e.target.value);
  });

  // Aggregation selector
  $('#aggregation-select').addEventListener('change', (e) => {
    const panel = getSelectedPanel();
    if (panel) updatePanelAggregation(panel.id, e.target.value);
  });

  // Shelf drop zones
  for (const shelf of ['x', 'y', 'color', 'size']) {
    const el = $(`#shelf-${shelf}`);
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      const fieldName = e.dataTransfer.getData('text/plain');
      if (!fieldName) return;
      setShelfField(shelf, fieldName);
    });
  }

  // Welcome buttons
  $('#welcome-import')?.addEventListener('click', () => showModal('modal-import'));
  $('#welcome-sample')?.addEventListener('click', () => showModal('modal-sample'));
}

function setShelfField(shelf, fieldName) {
  const el = $(`#shelf-${shelf}`);
  el.innerHTML = `
    <span class="shelf-chip">
      ${fieldName}
      <span class="shelf-chip-remove" data-shelf="${shelf}">&times;</span>
    </span>
  `;
  el.querySelector('.shelf-chip-remove').addEventListener('click', (ev) => {
    ev.stopPropagation();
    clearShelf(shelf);
  });

  const panel = getSelectedPanel();
  if (panel) updatePanelField(panel.id, shelf, fieldName);
}

function clearShelf(shelf) {
  const el = $(`#shelf-${shelf}`);
  el.innerHTML = '<span class="shelf-placeholder">Drag a field here</span>';
  const panel = getSelectedPanel();
  if (panel) updatePanelField(panel.id, shelf, null);
}

function syncShelvesToPanel() {
  const panel = getSelectedPanel();
  if (!panel) return;
  for (const shelf of ['x', 'y', 'color', 'size']) {
    const field = panel[shelf + 'Field'] || (shelf === 'x' ? panel.xField : shelf === 'y' ? panel.yField : shelf === 'color' ? panel.colorField : panel.sizeField);
    const el = $(`#shelf-${shelf}`);
    if (field) {
      el.innerHTML = `<span class="shelf-chip">${field}<span class="shelf-chip-remove" data-shelf="${shelf}">&times;</span></span>`;
      el.querySelector('.shelf-chip-remove').addEventListener('click', (ev) => {
        ev.stopPropagation(); clearShelf(shelf);
      });
    } else {
      el.innerHTML = '<span class="shelf-placeholder">Drag a field here</span>';
    }
  }
}

function populateFieldLists(fields) {
  const dimList = $('#dimension-list');
  const mesList = $('#measure-list');
  dimList.innerHTML = '';
  mesList.innerHTML = '';

  for (const f of fields) {
    const item = document.createElement('div');
    item.className = 'field-item';
    item.draggable = true;
    item.innerHTML = `
      <span class="field-icon ${f.role}">
        ${f.role === 'dimension' ? 'Aa' : '#'}
      </span>
      <span>${f.name}</span>
    `;
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', f.name);
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));

    // Double-click to auto-assign
    item.addEventListener('dblclick', () => {
      if (f.role === 'dimension') {
        setShelfField('x', f.name);
      } else {
        setShelfField('y', f.name);
      }
    });

    if (f.role === 'dimension') dimList.appendChild(item);
    else mesList.appendChild(item);
  }
}

/* ============================================================
   IMPORT MODAL
   ============================================================ */
function setupImportModal() {
  // Tab switching
  $$('.import-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.import-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      $('#tab-file').style.display = tabId === 'file' ? '' : 'none';
      $('#tab-paste').style.display = tabId === 'paste' ? '' : 'none';
    });
  });

  // File browse
  $('#btn-browse-file').addEventListener('click', () => $('#file-input').click());
  $('#file-input').addEventListener('change', handleFileSelect);

  // Drag & drop
  const dropZone = $('#file-drop-zone');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  });

  // Paste
  $('#btn-parse-paste').addEventListener('click', async () => {
    const text = $('#paste-data').value;
    if (!text.trim()) { toast('Please paste some data', 'error'); return; }
    try {
      const rows = await importText(text);
      showPreview(rows, 'Pasted Data');
    } catch (err) {
      toast('Failed to parse: ' + err.message, 'error');
    }
  });

  // Confirm import
  $('#btn-confirm-import').addEventListener('click', () => {
    if (window._pendingImport) {
      const { name, rows } = window._pendingImport;
      dataStore.addDataset(name, rows);
      hideModal('modal-import');
      toast(`Imported ${rows.length} rows as "${name}"`, 'success');
      window._pendingImport = null;
    }
  });

  // Close modals
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal || btn.closest('.modal-overlay')?.id || btn.closest('.filter-panel')?.id;
      if (modalId === 'filter-panel') {
        $('#filter-panel').style.display = 'none';
      } else if (modalId) {
        hideModal(modalId);
      }
    });
  });

  // Close on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideModal(overlay.id);
    });
  });
}

async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) await handleFile(file);
}

async function handleFile(file) {
  try {
    const rows = await importFile(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    showPreview(rows, name);
  } catch (err) {
    toast('Import failed: ' + err.message, 'error');
  }
}

function showPreview(rows, name) {
  if (!rows.length) { toast('No data found', 'error'); return; }
  window._pendingImport = { name, rows };

  const table = $('#preview-table');
  const keys = Object.keys(rows[0]);
  const previewRows = rows.slice(0, 10);

  table.innerHTML = `
    <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
    <tbody>${previewRows.map(r => `<tr>${keys.map(k => `<td>${r[k] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
  `;

  $('#import-preview').style.display = '';
}

/* ============================================================
   SAMPLE DATA MODAL
   ============================================================ */
function setupSampleDataModal() {
  const grid = $('#sample-grid');
  for (const ds of sampleDatasets) {
    const card = document.createElement('div');
    card.className = 'sample-card';
    card.innerHTML = `
      <div class="sample-card-icon">${ds.icon}</div>
      <div class="sample-card-name">${ds.name}</div>
      <div class="sample-card-desc">${ds.description}</div>
    `;
    card.addEventListener('click', () => {
      const rows = ds.generator();
      dataStore.addDataset(ds.name, rows);
      hideModal('modal-sample');
      toast(`Loaded "${ds.name}" (${rows.length} rows)`, 'success');
    });
    grid.appendChild(card);
  }
}

/* ============================================================
   EXPORT MODAL
   ============================================================ */
function setupExportModal() {
  $('#btn-export-json').addEventListener('click', () => {
    const json = exportDashboardJSON();
    downloadFile(json, 'dashboard.json', 'application/json');
    hideModal('modal-export');
    toast('Dashboard exported as JSON', 'success');
  });

  $('#btn-export-png').addEventListener('click', async () => {
    const dashGrid = $('#dashboard-grid');
    try {
      // Use canvas-based screenshot approach for chart panels
      const panels = dashGrid.querySelectorAll('.chart-panel-body canvas');
      if (panels.length === 0) {
        toast('No charts to export', 'info');
        return;
      }
      // Export first chart's canvas
      const canvas = panels[0];
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chart.png';
      a.click();
      hideModal('modal-export');
      toast('Chart exported as PNG', 'success');
    } catch (err) {
      toast('Export failed: ' + err.message, 'error');
    }
  });
}

/* ============================================================
   FILTER PANEL
   ============================================================ */
function setupFilterPanel() {
  $('#btn-close-filters').addEventListener('click', () => {
    $('#filter-panel').style.display = 'none';
  });

  $('#btn-add-filter').addEventListener('click', () => {
    const ds = dataStore.getActive();
    if (!ds) { toast('Load data first', 'info'); return; }
    showAddFilterUI(ds.fields);
  });
}

function toggleFilterPanel() {
  const panel = $('#filter-panel');
  panel.style.display = panel.style.display === 'none' ? '' : 'none';
  if (panel.style.display !== 'none') renderFilterList();
}

function renderFilterList() {
  const list = $('#filter-list');
  list.innerHTML = '';

  dataStore.filters.forEach((filter, idx) => {
    const item = document.createElement('div');
    item.className = 'filter-item';

    if (filter.type === 'range') {
      item.innerHTML = `
        <div class="filter-item-header">
          <span class="filter-item-label">${filter.field}</span>
          <button class="filter-item-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="filter-range">
          <input type="range" min="${filter.absMin}" max="${filter.absMax}" value="${filter.min}" step="any" data-side="min" data-idx="${idx}" />
          <input type="range" min="${filter.absMin}" max="${filter.absMax}" value="${filter.max}" step="any" data-side="max" data-idx="${idx}" />
          <div class="filter-range-labels">
            <span>${Number(filter.min).toLocaleString()}</span>
            <span>${Number(filter.max).toLocaleString()}</span>
          </div>
        </div>
      `;
    } else {
      const checks = filter.allValues.map(v =>
        `<label class="filter-checkbox-item">
          <input type="checkbox" value="${v}" ${filter.values.includes(v) ? 'checked' : ''} data-idx="${idx}" />
          ${v}
        </label>`
      ).join('');
      item.innerHTML = `
        <div class="filter-item-header">
          <span class="filter-item-label">${filter.field}</span>
          <button class="filter-item-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="filter-checkboxes">${checks}</div>
      `;
    }

    list.appendChild(item);

    // Remove
    item.querySelector('.filter-item-remove').addEventListener('click', () => {
      dataStore.removeFilter(idx);
      renderFilterList();
    });

    // Range inputs
    item.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', () => {
        const i = parseInt(input.dataset.idx);
        const side = input.dataset.side;
        const f = { ...dataStore.filters[i] };
        f[side] = parseFloat(input.value);
        dataStore.updateFilter(i, f);
        renderFilterList();
      });
    });

    // Checkbox inputs
    item.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        const i = parseInt(input.dataset.idx);
        const f = { ...dataStore.filters[i] };
        if (input.checked) {
          f.values = [...f.values, input.value];
        } else {
          f.values = f.values.filter(v => v !== input.value);
        }
        dataStore.updateFilter(i, f);
      });
    });
  });
}

function showAddFilterUI(fields) {
  const list = $('#filter-list');

  // Remove any existing filter selector to prevent duplicate IDs
  const existing = list.querySelector('.filter-selector-ui');
  if (existing) existing.remove();

  // Create field selector at the bottom
  const selector = document.createElement('div');
  selector.className = 'filter-item filter-selector-ui';
  selector.innerHTML = `
    <div class="filter-item-header">
      <span class="filter-item-label">Select Field</span>
      <button class="filter-item-remove filter-selector-cancel">&times;</button>
    </div>
    <select class="select-input filter-field-select">
      ${fields.map(f => `<option value="${f.name}" data-type="${f.type}">${f.name} (${f.type})</option>`).join('')}
    </select>
    <button class="btn btn-primary btn-sm" style="margin-top:8px;" data-role="confirm-filter">Add</button>
  `;
  list.appendChild(selector);

  // Scroll selector into view
  selector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Cancel button
  selector.querySelector('.filter-selector-cancel').addEventListener('click', () => {
    selector.remove();
  });

  selector.querySelector('[data-role="confirm-filter"]').addEventListener('click', () => {
    const sel = selector.querySelector('.filter-field-select');
    const fieldName = sel.value;
    const fieldType = sel.selectedOptions[0].dataset.type;

    if (fieldType === 'number') {
      const range = dataStore.getFieldRange(fieldName);
      dataStore.addFilter({
        field: fieldName,
        type: 'range',
        min: range.min,
        max: range.max,
        absMin: range.min,
        absMax: range.max,
      });
    } else {
      const values = dataStore.getUniqueValues(fieldName);
      dataStore.addFilter({
        field: fieldName,
        type: 'category',
        values: [...values],
        allValues: values,
      });
    }
    renderFilterList();
  });
}

/* ============================================================
   THEME
   ============================================================ */
function setupTheme() {
  const saved = localStorage.getItem('dataviz-theme') || 'dark';
  applyTheme(saved);
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dataviz-theme', theme);
  const icon = $('#icon-theme');
  if (theme === 'light') {
    icon.innerHTML = '<circle cx="10" cy="10" r="4"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"/>';
  } else {
    icon.innerHTML = '<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>';
  }
}

/* ============================================================
   DATA STORE LISTENERS
   ============================================================ */
function setupDataStoreListeners() {
  dataStore.on((event, payload) => {
    if (event === 'dataset-added' || event === 'active-changed') {
      onDatasetChanged(payload);
    }
    if (event === 'data-filtered') {
      refreshAll();
    }
  });
}

function onDatasetChanged({ name, dataset }) {
  // Update dataset select
  const select = $('#dataset-select');
  // Ensure option exists
  if (![...select.options].find(o => o.value === name)) {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    select.appendChild(opt);
  }
  select.value = name;

  // Update info
  const info = $('#dataset-info');
  info.style.display = '';
  $('#dataset-rows').textContent = dataset.rows.length + ' rows';
  $('#dataset-cols').textContent = dataset.fields.length + ' columns';

  // Populate fields
  populateFieldLists(dataset.fields);

  // Show dashboard, hide welcome, show analytics tabs
  $('#welcome-screen').style.display = 'none';
  $('#dashboard-grid').style.display = 'block';
  $('#analytics-tabs').style.display = 'flex';

  // Reset to dashboard tab
  switchTab('dashboard');

  // Reset chat history
  chatHistory = [];

  // Clear shelves
  for (const shelf of ['x', 'y', 'color', 'size']) clearShelf(shelf);

  // Auto-create a chart if none exist
  if (getPanels().length === 0) {
    // Find first dimension and measure
    const dim = dataset.fields.find(f => f.role === 'dimension');
    const mes = dataset.fields.find(f => f.role === 'measure');

    if (dim && mes) {
      const panel = addPanel({
        chartType: 'bar',
        xField: dim.name,
        yField: mes.name,
        aggregation: 'SUM',
        title: `${mes.name} by ${dim.name}`,
      });
      setShelfField('x', dim.name);
      setShelfField('y', mes.name);

      // Also add a second chart for variety
      const mes2 = dataset.fields.filter(f => f.role === 'measure')[1];
      if (mes2) {
        addPanel({
          chartType: 'line',
          xField: dim.name,
          yField: mes2.name,
          aggregation: 'SUM',
          title: `${mes2.name} by ${dim.name}`,
          w: 6,
        });
      }
    }
  }
}

/* ============================================================
   UTILITIES
   ============================================================ */
function showModal(id) {
  const el = $(`#${id}`);
  if (el) {
    el.style.display = '';
    // Reset import preview
    if (id === 'modal-import') {
      $('#import-preview').style.display = 'none';
      window._pendingImport = null;
    }
  }
}

function hideModal(id) {
  const el = $(`#${id}`);
  if (el) el.style.display = 'none';
}

function toast(message, type = 'info') {
  const container = $('#toast-container');
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   ANALYTICS TABS
   ============================================================ */
function setupAnalyticsTabs() {
  $$('.analytics-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  $$('.analytics-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  $('#dashboard-grid').style.display = tabId === 'dashboard' ? 'block' : 'none';
  $('#panel-predictive').style.display = tabId === 'predictive' ? 'block' : 'none';
  $('#panel-prescriptive').style.display = tabId === 'prescriptive' ? 'block' : 'none';
}

/* ============================================================
   SETTINGS MODAL
   ============================================================ */
function setupSettingsModal() {
  const keyInput = $('#settings-api-key');
  const status = $('#key-status');

  // Load existing key
  keyInput.value = llmService.getApiKey();
  if (llmService.hasApiKey()) {
    status.className = 'settings-key-status success';
    status.textContent = '✓ API key saved';
  }

  // Toggle visibility
  $('#btn-toggle-key').addEventListener('click', () => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
  });

  // Save key
  $('#btn-save-key').addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (!key) {
      status.className = 'settings-key-status error';
      status.textContent = '✕ Please enter an API key';
      return;
    }
    llmService.setApiKey(key);
    status.className = 'settings-key-status success';
    status.textContent = '✓ API key saved successfully';
    toast('API key saved', 'success');
  });
}

/* ============================================================
   PREDICTIVE ANALYTICS
   ============================================================ */
function setupPredictivePanel() {
  $('#btn-trend-forecast').addEventListener('click', () => {
    runAnalyticsAction('predictive-result', runTrendForecast, 'Analyzing trends...');
  });
  $('#btn-anomaly-detect').addEventListener('click', () => {
    runAnalyticsAction('predictive-result', runAnomalyDetection, 'Detecting anomalies...');
  });
  $('#btn-data-overview').addEventListener('click', () => {
    runAnalyticsAction('predictive-result', runDataOverview, 'Analyzing data...');
  });

  // Chat Q&A
  const chatInput = $('#chat-input');
  const sendBtn = $('#btn-chat-send');
  const messagesEl = $('#chat-messages');

  // Init with empty state
  messagesEl.innerHTML = '<div class="chat-empty-state">Ask any question about your dataset...</div>';

  const sendChat = async () => {
    const question = chatInput.value.trim();
    if (!question) return;
    if (!llmService.hasApiKey()) {
      toast('Please add your API key in Settings first', 'info');
      showModal('modal-settings');
      return;
    }
    if (!dataStore.getActive()) {
      toast('Load data first', 'info');
      return;
    }

    // Clear empty state
    const emptyState = messagesEl.querySelector('.chat-empty-state');
    if (emptyState) emptyState.remove();

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = question;
    messagesEl.appendChild(userMsg);
    chatInput.value = '';

    // Add loading
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-msg assistant';
    loadingMsg.innerHTML = '<div class="analytics-loading"><div class="spinner"></div><div class="analytics-loading-text">Thinking...</div></div>';
    messagesEl.appendChild(loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      chatHistory.push({ role: 'user', content: question });
      const response = await askQuestion(question, chatHistory);
      chatHistory.push({ role: 'assistant', content: response });
      loadingMsg.innerHTML = renderMarkdown(response);
    } catch (err) {
      loadingMsg.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  sendBtn.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
}

/* ============================================================
   PRESCRIPTIVE ANALYTICS
   ============================================================ */
function setupPrescriptivePanel() {
  $('#btn-recommendations').addEventListener('click', () => {
    runAnalyticsAction('prescriptive-result', generateRecommendations, 'Generating recommendations...');
  });
  $('#btn-optimization').addEventListener('click', () => {
    runAnalyticsAction('prescriptive-result', runOptimizationAnalysis, 'Analyzing optimization opportunities...');
  });

  // What-If
  $('#btn-whatif').addEventListener('click', () => {
    const scenario = $('#whatif-input').value.trim();
    if (!scenario) {
      toast('Please describe a scenario', 'info');
      return;
    }
    runAnalyticsAction('whatif-result', () => runWhatIfAnalysis(scenario), 'Analyzing scenario...');
  });
}

/* ============================================================
   ANALYTICS HELPERS
   ============================================================ */
async function runAnalyticsAction(resultContainerId, actionFn, loadingText) {
  const container = $(`#${resultContainerId}`);
  if (!llmService.hasApiKey()) {
    toast('Please add your API key in Settings first', 'info');
    showModal('modal-settings');
    return;
  }
  if (!dataStore.getActive()) {
    toast('Load data first', 'info');
    return;
  }

  container.innerHTML = `
    <div class="analytics-loading">
      <div class="spinner"></div>
      <div class="analytics-loading-text">${loadingText}</div>
    </div>`;

  try {
    const result = await actionFn();
    container.innerHTML = renderMarkdown(result);
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);padding:20px;">Error: ${err.message}</p>`;
  }
}

