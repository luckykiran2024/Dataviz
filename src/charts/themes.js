/* ======================================================
   Chart Themes — Color palettes, gradients, animations
   ====================================================== */

const PALETTE = [
  '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b',
  '#3b82f6', '#22c55e', '#f97316', '#06b6d4', '#e879f9',
  '#84cc16', '#fb7185',
];

const PALETTE_LIGHT = [
  'rgba(99,102,241,.18)', 'rgba(168,85,247,.18)', 'rgba(236,72,153,.18)',
  'rgba(20,184,166,.18)', 'rgba(245,158,11,.18)', 'rgba(59,130,246,.18)',
  'rgba(34,197,94,.18)', 'rgba(249,115,22,.18)', 'rgba(6,182,212,.18)',
  'rgba(232,121,249,.18)', 'rgba(132,204,22,.18)', 'rgba(251,113,133,.18)',
];

export function getColor(index) {
  return PALETTE[index % PALETTE.length];
}

export function getColorLight(index) {
  return PALETTE_LIGHT[index % PALETTE_LIGHT.length];
}

export function getColors(count) {
  return Array.from({ length: count }, (_, i) => getColor(i));
}

export function getColorsLight(count) {
  return Array.from({ length: count }, (_, i) => getColorLight(i));
}

export function createGradient(ctx, colorIndex, vertical = true) {
  const color = PALETTE[colorIndex % PALETTE.length];
  const canvas = ctx.canvas || ctx.chart?.canvas;
  if (!canvas) return color;
  const gradient = vertical
    ? ctx.createLinearGradient(0, 0, 0, canvas.height)
    : ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + '22');
  return gradient;
}

export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 700,
    easing: 'easeOutQuart',
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { family: 'Inter', size: 11 },
        color: '#9d9db8',
      }
    },
    tooltip: {
      backgroundColor: 'rgba(22,22,42,.92)',
      titleFont: { family: 'Inter', size: 12, weight: 600 },
      bodyFont: { family: 'Inter', size: 11 },
      padding: 12,
      cornerRadius: 8,
      borderColor: 'rgba(255,255,255,.08)',
      borderWidth: 1,
      displayColors: true,
      boxPadding: 4,
    },
    datalabels: {
      display: false,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,.04)', drawBorder: false },
      ticks: { color: '#6b6b8a', font: { family: 'Inter', size: 11 }, maxRotation: 45 },
      border: { display: false }
    },
    y: {
      grid: { color: 'rgba(255,255,255,.04)', drawBorder: false },
      ticks: { color: '#6b6b8a', font: { family: 'Inter', size: 11 } },
      border: { display: false },
      beginAtZero: true
    }
  }
};

export function getLightThemeOverrides() {
  return {
    plugins: {
      legend: { labels: { color: '#5a5a7a' } },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,.95)',
        titleColor: '#1a1a2e',
        bodyColor: '#5a5a7a',
        borderColor: 'rgba(0,0,0,.08)',
      }
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#5a5a7a' } },
      y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#5a5a7a' } },
    }
  };
}
