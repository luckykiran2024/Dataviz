/* ======================================================
   Chart Renderers — Chart.js + D3 based renderers
   for all supported chart types
   ====================================================== */
import {
  Chart,
  BarController, LineController, PieController, DoughnutController,
  ScatterController, RadarController, BubbleController,
  CategoryScale, LinearScale, RadialLinearScale,
  BarElement, LineElement, PointElement, ArcElement, Filler,
  Tooltip, Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as d3 from 'd3';
import { getColor, getColorLight, getColors, chartDefaults, createGradient } from './themes.js';

// Register Chart.js components
Chart.register(
  BarController, LineController, PieController, DoughnutController,
  ScatterController, RadarController, BubbleController,
  CategoryScale, LinearScale, RadialLinearScale,
  BarElement, LineElement, PointElement, ArcElement, Filler,
  Tooltip, Legend, ChartDataLabels
);

/* ---------- Utility ---------- */
function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/* ---------- Destroy helpers ---------- */
function destroyPrevious(container) {
  // Destroy Chart.js chart
  const canvas = container.querySelector('canvas');
  if (canvas && canvas.__chart) {
    canvas.__chart.destroy();
    canvas.__chart = null;
  }
  container.innerHTML = '';
}

/* ---------- Chart.js-based renderers ---------- */

function createChartCanvas(container) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  return canvas;
}

export function renderBar(container, data, options = {}) {
  destroyPrevious(container);
  if (!data) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: getColor(ds.colorIndex ?? i),
        borderColor: getColor(ds.colorIndex ?? i),
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 50,
      }))
    },
    options: deepMerge(chartDefaults, {
      indexAxis: options.horizontal ? 'y' : 'x',
      plugins: { datalabels: { display: false } }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderColumn(container, data) {
  return renderBar(container, data, { horizontal: false });
}

export function renderLine(container, data) {
  destroyPrevious(container);
  if (!data) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: getColor(ds.colorIndex ?? i),
        backgroundColor: getColorLight(ds.colorIndex ?? i),
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: getColor(ds.colorIndex ?? i),
        pointBorderColor: '#16162a',
        pointBorderWidth: 2,
        tension: 0.35,
        fill: false,
      }))
    },
    options: deepMerge(chartDefaults, {
      plugins: { datalabels: { display: false } },
      interaction: { mode: 'index', intersect: false }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderArea(container, data) {
  destroyPrevious(container);
  if (!data) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: getColor(ds.colorIndex ?? i),
        backgroundColor: getColorLight(ds.colorIndex ?? i),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
      }))
    },
    options: deepMerge(chartDefaults, {
      plugins: { datalabels: { display: false } },
      interaction: { mode: 'index', intersect: false }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderPie(container, data) {
  destroyPrevious(container);
  if (!data || !data.datasets[0]) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const values = data.datasets[0].data;
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [{
        data: values,
        backgroundColor: getColors(values.length),
        borderColor: '#16162a',
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: deepMerge(chartDefaults, {
      scales: { x: { display: false }, y: { display: false } },
      plugins: {
        datalabels: {
          display: true,
          color: '#fff',
          font: { family: 'Inter', size: 11, weight: 600 },
          formatter: (value, ctx2) => {
            const total = ctx2.dataset.data.reduce((a, b) => a + b, 0);
            return total > 0 ? Math.round(value / total * 100) + '%' : '';
          }
        }
      }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderDonut(container, data) {
  destroyPrevious(container);
  if (!data || !data.datasets[0]) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const values = data.datasets[0].data;
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: values,
        backgroundColor: getColors(values.length),
        borderColor: '#16162a',
        borderWidth: 2,
        hoverOffset: 8,
        cutout: '60%',
      }]
    },
    options: deepMerge(chartDefaults, {
      scales: { x: { display: false }, y: { display: false } },
      plugins: {
        datalabels: {
          display: true,
          color: '#fff',
          font: { family: 'Inter', size: 11, weight: 600 },
          formatter: (value, ctx2) => {
            const total = ctx2.dataset.data.reduce((a, b) => a + b, 0);
            return total > 0 ? Math.round(value / total * 100) + '%' : '';
          }
        }
      }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderScatter(container, data) {
  destroyPrevious(container);
  if (!data) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: getColor(ds.colorIndex ?? i) + 'aa',
        borderColor: getColor(ds.colorIndex ?? i),
        borderWidth: 1.5,
        pointRadius: 5,
        pointHoverRadius: 8,
      }))
    },
    options: deepMerge(chartDefaults, {
      plugins: { datalabels: { display: false } }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderBubble(container, data) {
  destroyPrevious(container);
  if (!data) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: getColor(ds.colorIndex ?? i) + '88',
        borderColor: getColor(ds.colorIndex ?? i),
        borderWidth: 1.5,
        hoverRadius: 2,
      }))
    },
    options: deepMerge(chartDefaults, {
      plugins: { datalabels: { display: false } }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderRadar(container, data) {
  destroyPrevious(container);
  if (!data) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: getColor(ds.colorIndex ?? i),
        backgroundColor: getColor(ds.colorIndex ?? i) + '22',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: getColor(ds.colorIndex ?? i),
      }))
    },
    options: deepMerge(chartDefaults, {
      scales: {
        x: { display: false },
        y: { display: false },
        r: {
          grid: { color: 'rgba(255,255,255,.06)' },
          angleLines: { color: 'rgba(255,255,255,.06)' },
          pointLabels: { color: '#9d9db8', font: { family: 'Inter', size: 11 } },
          ticks: { display: false },
          beginAtZero: true
        }
      },
      plugins: { datalabels: { display: false } }
    })
  });
  canvas.__chart = chart;
  return chart;
}

export function renderGauge(container, data) {
  destroyPrevious(container);
  if (!data || !data.datasets[0]) return;
  const canvas = createChartCanvas(container);
  const ctx = canvas.getContext('2d');
  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
  const firstVal = data.datasets[0].data[0] || 0;
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [data.labels[0] || 'Value', 'Remaining'],
      datasets: [{
        data: [firstVal, Math.max(0, total - firstVal)],
        backgroundColor: [getColor(0), 'rgba(255,255,255,.05)'],
        borderWidth: 0,
        cutout: '75%',
        circumference: 270,
        rotation: -135,
      }]
    },
    options: deepMerge(chartDefaults, {
      scales: { x: { display: false }, y: { display: false } },
      plugins: {
        legend: { display: false },
        datalabels: {
          display: false,
        },
        tooltip: { enabled: false }
      }
    }),
    plugins: [{
      id: 'gaugeText',
      afterDraw: (chart) => {
        const { ctx: c, chartArea: { width, height, left, top } } = chart;
        c.save();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const cx = left + width / 2;
        const cy = top + height / 2 + 10;
        c.font = 'bold 28px Inter';
        c.fillStyle = '#e8e8f0';
        c.fillText(firstVal.toLocaleString(), cx, cy);
        c.font = '12px Inter';
        c.fillStyle = '#6b6b8a';
        c.fillText(data.labels[0] || '', cx, cy + 24);
        c.restore();
      }
    }]
  });
  canvas.__chart = chart;
  return chart;
}

/* ---------- D3-based renderers ---------- */

export function renderTreemap(container, data) {
  destroyPrevious(container);
  if (!data || !data.datasets[0]) return;

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;

  const root = {
    name: 'root',
    children: data.labels.map((label, i) => ({
      name: label,
      value: data.datasets[0].data[i] || 0,
    }))
  };

  const hierarchy = d3.hierarchy(root)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([width, height])
    .padding(3)
    .round(true)(hierarchy);

  const svg = d3.select(container).append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  const nodes = svg.selectAll('g')
    .data(hierarchy.leaves())
    .enter().append('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  nodes.append('rect')
    .attr('width', d => Math.max(0, d.x1 - d.x0))
    .attr('height', d => Math.max(0, d.y1 - d.y0))
    .attr('rx', 4)
    .attr('fill', (d, i) => getColor(i))
    .attr('opacity', 0.85)
    .style('transition', 'opacity 0.2s')
    .on('mouseover', function() { d3.select(this).attr('opacity', 1); })
    .on('mouseout', function() { d3.select(this).attr('opacity', 0.85); });

  nodes.append('text')
    .attr('x', 6).attr('y', 18)
    .text(d => {
      const w = d.x1 - d.x0;
      if (w < 40) return '';
      return d.data.name.length > w / 7 ? d.data.name.slice(0, Math.floor(w / 7)) + '…' : d.data.name;
    })
    .attr('fill', '#fff')
    .attr('font-size', '11px')
    .attr('font-family', 'Inter')
    .attr('font-weight', '600');

  nodes.append('text')
    .attr('x', 6).attr('y', 34)
    .text(d => {
      const w = d.x1 - d.x0;
      if (w < 40) return '';
      return d.data.value.toLocaleString();
    })
    .attr('fill', 'rgba(255,255,255,.7)')
    .attr('font-size', '10px')
    .attr('font-family', 'Inter');

  // Tooltip
  nodes.append('title')
    .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);
}

export function renderHeatmap(container, data) {
  destroyPrevious(container);
  if (!data || !data.datasets[0]) return;

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;
  const margin = { top: 30, right: 10, bottom: 40, left: 80 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Build matrix from data
  const xLabels = data.labels;
  const series = data.datasets.map(ds => ds.label);
  const allValues = [];
  const cells = [];

  data.datasets.forEach((ds, si) => {
    ds.data.forEach((val, xi) => {
      cells.push({ x: xi, y: si, value: val });
      allValues.push(val);
    });
  });

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  const colorScale = d3.scaleSequential()
    .domain([minVal, maxVal])
    .interpolator(d3.interpolateRgbBasis(['#1e1e38', '#6366f1', '#a855f7', '#ec4899', '#f59e0b']));

  const svg = d3.select(container).append('svg')
    .attr('width', width).attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const cellW = innerW / xLabels.length;
  const cellH = innerH / series.length;

  g.selectAll('rect')
    .data(cells)
    .enter().append('rect')
    .attr('x', d => d.x * cellW)
    .attr('y', d => d.y * cellH)
    .attr('width', cellW - 2)
    .attr('height', cellH - 2)
    .attr('rx', 3)
    .attr('fill', d => colorScale(d.value))
    .style('transition', 'opacity 0.2s')
    .on('mouseover', function() { d3.select(this).attr('opacity', 0.75); })
    .on('mouseout', function() { d3.select(this).attr('opacity', 1); })
    .append('title')
    .text(d => `${series[d.y]} × ${xLabels[d.x]}: ${d.value.toLocaleString()}`);

  // Cell text
  g.selectAll('.cell-text')
    .data(cells)
    .enter().append('text')
    .attr('x', d => d.x * cellW + cellW / 2)
    .attr('y', d => d.y * cellH + cellH / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', d => d.value > (maxVal - minVal) * 0.5 + minVal ? '#fff' : '#9d9db8')
    .attr('font-size', Math.min(11, cellH * 0.4) + 'px')
    .attr('font-family', 'Inter')
    .text(d => cellW > 35 && cellH > 20 ? d.value.toLocaleString() : '');

  // X axis labels
  g.selectAll('.x-label')
    .data(xLabels)
    .enter().append('text')
    .attr('x', (d, i) => i * cellW + cellW / 2)
    .attr('y', innerH + 14)
    .attr('text-anchor', 'middle')
    .attr('fill', '#6b6b8a')
    .attr('font-size', '10px')
    .attr('font-family', 'Inter')
    .text(d => d.length > 8 ? d.slice(0, 8) + '…' : d);

  // Y axis labels
  g.selectAll('.y-label')
    .data(series)
    .enter().append('text')
    .attr('x', -8)
    .attr('y', (d, i) => i * cellH + cellH / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#6b6b8a')
    .attr('font-size', '10px')
    .attr('font-family', 'Inter')
    .text(d => d.length > 10 ? d.slice(0, 10) + '…' : d);
}

export function renderPivotTable(container, data) {
  destroyPrevious(container);
  if (!data || !data.datasets || data.datasets.length === 0) return;

  // The labels are our Row Groups (X Axis)
  const rows = data.labels || [];
  
  // The datasets represent our Columns/Values
  const columns = data.datasets;

  const table = document.createElement('table');
  table.className = 'pivot-table';

  // Build Header
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  
  // Empty top-left cell if we have row labels
  if (rows.length > 0) {
    const thCorner = document.createElement('th');
    thCorner.textContent = 'Group / Category';
    trHead.appendChild(thCorner);
  }

  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label || 'Value';
    th.style.textAlign = 'right';
    trHead.appendChild(th);
  });
  
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Build Body
  const tbody = document.createElement('tbody');
  
  // Get maximum number of data points
  const rowCount = Math.max(rows.length, ...columns.map(c => c.data.length));

  for (let i = 0; i < rowCount; i++) {
    const tr = document.createElement('tr');
    
    if (rows.length > 0) {
      const tdRowLabel = document.createElement('td');
      tdRowLabel.className = 'pivot-row-header';
      tdRowLabel.textContent = rows[i] || '';
      tr.appendChild(tdRowLabel);
    }
    
    columns.forEach(col => {
      const td = document.createElement('td');
      const val = col.data[i];
      // Format numbering nicely
      td.textContent = typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (val ?? '-');
      td.style.textAlign = 'right';
      tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
  }
  
  table.appendChild(tbody);

  // Wrap in scrollable container
  const wrapper = document.createElement('div');
  wrapper.className = 'pivot-table-container';
  wrapper.appendChild(table);

  // Export Button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary btn-sm';
  exportBtn.style.position = 'absolute';
  exportBtn.style.top = '12px';
  exportBtn.style.right = '12px';
  exportBtn.style.zIndex = '10';
  exportBtn.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg> Export CSV';
  
  exportBtn.addEventListener('click', () => {
    // Build CSV Data structure
    const csvData = [];
    const headers = [];
    if (rows.length > 0) headers.push('Group / Category');
    columns.forEach(c => headers.push(c.label || 'Value'));
    csvData.push(headers);

    for (let i = 0; i < rowCount; i++) {
      const rowArr = [];
      if (rows.length > 0) rowArr.push(rows[i] || '');
      columns.forEach(c => rowArr.push(c.data[i] ?? ''));
      csvData.push(rowArr);
    }

    import('papaparse').then(Papa => {
      const csvString = Papa.default.unparse(csvData);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pivot_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });

  container.style.position = 'relative'; // Ensure button positions correctly
  container.appendChild(exportBtn);
  container.appendChild(wrapper);
}

/* ---------- Renderer Map ---------- */
export const renderers = {
  bar: renderBar,
  column: renderColumn,
  line: renderLine,
  area: renderArea,
  pie: renderPie,
  donut: renderDonut,
  scatter: renderScatter,
  bubble: renderBubble,
  radar: renderRadar,
  gauge: renderGauge,
  treemap: renderTreemap,
  heatmap: renderHeatmap,
  pivot: renderPivotTable,
};
