/* ======================================================
   Dashboard — GridStack-based dashboard manager
   ====================================================== */
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import 'gridstack/dist/gridstack-extra.min.css';
import { renderChart, isScatterType, CHART_TYPES } from '../charts/ChartFactory.js';
import dataStore from '../data/DataStore.js';

let grid = null;
let panels = [];
let nextId = 1;

export function initDashboard() {
  grid = GridStack.init({
    cellHeight: 260,
    margin: 8,
    column: 12,
    animate: true,
    float: false,
    draggable: { handle: '.chart-panel-header' },
    resizable: { handles: 'se, sw' },
  }, '#dashboard-grid');

  grid.on('resizestop', (event, el) => {
    const panelId = el.getAttribute('data-panel-id');
    const panel = panels.find(p => p.id === panelId);
    if (panel) refreshPanel(panel);
  });
}

export function addPanel(config = {}) {
  const id = 'panel-' + nextId++;
  const panel = {
    id,
    chartType: config.chartType || 'bar',
    xField: config.xField || null,
    yField: config.yField || null,
    colorField: config.colorField || null,
    sizeField: config.sizeField || null,
    aggregation: config.aggregation || 'SUM',
    title: config.title || 'New Chart',
  };

  const typeOptions = CHART_TYPES.map(ct =>
    `<option value="${ct.id}" ${ct.id === panel.chartType ? 'selected' : ''}>${ct.name}</option>`
  ).join('');

  const html = `
    <div class="chart-panel" data-panel-id="${id}">
      <div class="chart-panel-header">
        <span class="chart-panel-title">${panel.title}</span>
        <div class="chart-panel-actions">
          <select class="panel-type-select" data-panel-id="${id}" title="Chart Type">
            ${typeOptions}
          </select>
          <button class="chart-panel-btn" data-action="maximize" data-panel-id="${id}" title="Maximize">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h4V2H2v5h1V3zm10 0h-4V2h5v5h-1V3zM3 13h4v1H2v-5h1v4zm10 0h-4v1h5v-5h-1v4z"/></svg>
          </button>
          <button class="chart-panel-btn" data-action="delete" data-panel-id="${id}" title="Remove">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
          </button>
        </div>
      </div>
      <div class="chart-panel-body" id="chart-body-${id}"></div>
    </div>
  `;

  const w = config.w || 6;
  const h = config.h || 1;
  grid.addWidget({ w, h, content: html, id: id });

  // Attach event to type selector
  const el = document.querySelector(`[data-panel-id="${id}"] .panel-type-select`);
  if (el) {
    el.addEventListener('change', (e) => {
      panel.chartType = e.target.value;
      refreshPanel(panel);
    });
  }

  // Delete button
  const delBtn = document.querySelector(`[data-action="delete"][data-panel-id="${id}"]`);
  if (delBtn) {
    delBtn.addEventListener('click', () => removePanel(id));
  }

  // Maximize button
  const maxBtn = document.querySelector(`[data-action="maximize"][data-panel-id="${id}"]`);
  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      const gridEl = document.querySelector(`.grid-stack-item[gs-id="${id}"]`);
      if (!gridEl) return;
      const isMax = gridEl.getAttribute('data-maximized') === 'true';
      if (isMax) {
        grid.update(gridEl, { w: panel._origW || 6, h: panel._origH || 1 });
        gridEl.removeAttribute('data-maximized');
      } else {
        panel._origW = parseInt(gridEl.getAttribute('gs-w')) || 6;
        panel._origH = parseInt(gridEl.getAttribute('gs-h')) || 1;
        grid.update(gridEl, { w: 12, h: 2 });
        gridEl.setAttribute('data-maximized', 'true');
      }
      setTimeout(() => refreshPanel(panel), 300);
    });
  }

  panels.push(panel);
  refreshPanel(panel);
  return panel;
}

export function removePanel(id) {
  const gridItem = document.querySelector(`.grid-stack-item[gs-id="${id}"]`);
  if (gridItem) grid.removeWidget(gridItem);
  panels = panels.filter(p => p.id !== id);
}

export function refreshPanel(panel) {
  const container = document.getElementById(`chart-body-${panel.id}`);
  if (!container) return;

  let data;
  if (isScatterType(panel.chartType)) {
    data = dataStore.getScatterData(panel.xField, panel.yField, panel.sizeField, panel.colorField);
  } else {
    data = dataStore.getAggregatedData(panel.xField, panel.yField, panel.aggregation, panel.colorField);
  }

  renderChart(container, panel.chartType, data);
}

export function refreshAll() {
  panels.forEach(p => refreshPanel(p));
}

export function getSelectedPanel() {
  return panels.length ? panels[panels.length - 1] : null;
}

export function getPanels() {
  return panels;
}

export function updatePanelField(panelId, shelf, fieldName) {
  const panel = panels.find(p => p.id === panelId);
  if (!panel) return;
  if (shelf === 'x') panel.xField = fieldName;
  else if (shelf === 'y') panel.yField = fieldName;
  else if (shelf === 'color') panel.colorField = fieldName;
  else if (shelf === 'size') panel.sizeField = fieldName;

  // Auto-title
  if (panel.xField && panel.yField) {
    panel.title = `${panel.yField} by ${panel.xField}`;
    const titleEl = document.querySelector(`[data-panel-id="${panel.id}"] .chart-panel-title`);
    if (titleEl) titleEl.textContent = panel.title;
  }

  refreshPanel(panel);
}

export function updatePanelAggregation(panelId, aggFn) {
  const panel = panels.find(p => p.id === panelId);
  if (!panel) return;
  panel.aggregation = aggFn;
  refreshPanel(panel);
}

export function setSelectedPanelType(type) {
  const panel = getSelectedPanel();
  if (!panel) return;
  panel.chartType = type;
  // Update the dropdown too
  const sel = document.querySelector(`[data-panel-id="${panel.id}"] .panel-type-select`);
  if (sel) sel.value = type;
  refreshPanel(panel);
}

export function exportDashboardJSON() {
  return JSON.stringify({
    panels: panels.map(p => ({
      chartType: p.chartType,
      xField: p.xField,
      yField: p.yField,
      colorField: p.colorField,
      sizeField: p.sizeField,
      aggregation: p.aggregation,
      title: p.title,
    })),
    dataset: dataStore.activeDataset,
  }, null, 2);
}
