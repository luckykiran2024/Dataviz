/* ======================================================
   ChartFactory — Creates chart instances by type
   ====================================================== */
import { renderers } from './renderers.js';

const SCATTER_TYPES = new Set(['scatter', 'bubble']);
const NO_AXIS_TYPES = new Set(['pie', 'donut', 'gauge', 'treemap']);

export function isScatterType(type) {
  return SCATTER_TYPES.has(type);
}

export function needsAxes(type) {
  return !NO_AXIS_TYPES.has(type);
}

export function renderChart(container, type, data) {
  const renderer = renderers[type];
  if (!renderer) {
    container.innerHTML = `<div class="chart-empty"><p>Unknown chart type: ${type}</p></div>`;
    return;
  }
  if (!data) {
    container.innerHTML = `
      <div class="chart-empty">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="6" y="6" width="36" height="36" rx="4"/>
          <path d="M14 34V22M22 34V14M30 34V26M38 34V18"/>
        </svg>
        <p>Configure fields to render chart</p>
      </div>`;
    return;
  }
  renderer(container, data);
}

export const CHART_TYPES = [
  { id: 'bar', name: 'Bar', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><rect x="17" y="9" width="4" height="12" rx="1"/></svg>' },
  { id: 'column', name: 'Column', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>' },
  { id: 'line', name: 'Line', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18L8 11 13 14 21 5"/><circle cx="8" cy="11" r="1.5" fill="currentColor"/><circle cx="13" cy="14" r="1.5" fill="currentColor"/></svg>' },
  { id: 'area', name: 'Area', icon: '<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.5"><path d="M3 21L3 18L8 11L13 14L21 5V21Z"/></svg>' },
  { id: 'pie', name: 'Pie', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 017.75 6H12V4z" opacity="0.7"/><path d="M12 2v10h10A10 10 0 0012 2z"/></svg>' },
  { id: 'donut', name: 'Donut', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 015.66 13.66" stroke-linecap="round"/></svg>' },
  { id: 'scatter', name: 'Scatter', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="16" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="15" cy="14" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="18" r="1.5"/></svg>' },
  { id: 'bubble', name: 'Bubble', icon: '<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.65"><circle cx="8" cy="14" r="4"/><circle cx="16" cy="10" r="3"/><circle cx="14" cy="17" r="2"/><circle cx="18" cy="16" r="1.5"/></svg>' },
  { id: 'radar', name: 'Radar', icon: '<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.25" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 22,9 19,20 5,20 2,9"/></svg>' },
  { id: 'gauge', name: 'Gauge', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 16a8 8 0 1116 0"/><path d="M12 16V10" stroke-width="2"/></svg>' },
  { id: 'treemap', name: 'Treemap', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="9" height="12" rx="1" opacity="0.8"/><rect x="13" y="2" width="9" height="7" rx="1" opacity="0.6"/><rect x="13" y="11" width="9" height="3" rx="1" opacity="0.4"/><rect x="2" y="16" width="5" height="6" rx="1" opacity="0.5"/><rect x="9" y="16" width="13" height="6" rx="1" opacity="0.3"/></svg>' },
  { id: 'heatmap', name: 'Heatmap', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="6" height="6" rx="1" opacity="0.3"/><rect x="9" y="2" width="6" height="6" rx="1" opacity="0.8"/><rect x="16" y="2" width="6" height="6" rx="1" opacity="0.5"/><rect x="2" y="9" width="6" height="6" rx="1" opacity="0.9"/><rect x="9" y="9" width="6" height="6" rx="1" opacity="0.4"/><rect x="16" y="9" width="6" height="6" rx="1" opacity="0.7"/><rect x="2" y="16" width="6" height="6" rx="1" opacity="0.6"/><rect x="9" y="16" width="6" height="6" rx="1" opacity="0.2"/><rect x="16" y="16" width="6" height="6" rx="1" opacity="1"/></svg>' },
];
