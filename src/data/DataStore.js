/* ======================================================
   DataStore — Central reactive data management
   ====================================================== */

class DataStore {
  constructor() {
    this.datasets = new Map();
    this.activeDataset = null;
    this.listeners = [];
    this.filters = [];
  }

  /* ---- Events ---- */
  on(fn) { this.listeners.push(fn); }
  emit(event, payload) { this.listeners.forEach(fn => fn(event, payload)); }

  /* ---- Add Dataset ---- */
  addDataset(name, rows) {
    const fields = this._inferFields(rows);
    const dataset = { name, rows, fields, originalRows: [...rows], calculatedFields: [] };
    this.datasets.set(name, dataset);
    this.activeDataset = name;
    this.filters = [];
    this.emit('dataset-added', { name, dataset });
    this.emit('active-changed', { name, dataset });
    return dataset;
  }

  /* ---- Calculated Fields ---- */
  addCalculatedField(name, expression) {
    const ds = this.getActive();
    if (!ds) return;

    // Check if name exists
    if (ds.fields.some(f => f.name === name)) {
      throw new Error(`Field name "${name}" already exists.`);
    }

    // Attempt to evaluate for the first row to validate expression
    // Create a safe evaluator
    try {
      this._evaluateExpression(expression, ds.originalRows[0] || {});
    } catch(err) {
      throw new Error(`Invalid expression: ${err.message}`);
    }

    // Apply to all rows
    for (const row of ds.originalRows) {
      row[name] = this._evaluateExpression(expression, row);
    }
    for (const row of ds.rows) {
      row[name] = this._evaluateExpression(expression, row);
    }

    // Add to fields
    ds.fields.push({ name, type: 'number', role: 'measure', isCalculated: true, expression });
    ds.calculatedFields.push({ name, expression });

    this.emit('dataset-updated', { name: this.activeDataset, dataset: ds });
  }

  _evaluateExpression(expr, rowContext) {
    // Replace field names wrapped in brackets [Field Value] with their actual values
    // Using a regex to find all [Field Name]
    let parsedExpr = expr.replace(/\[([^\]]+)\]/g, (match, fieldName) => {
      const val = rowContext[fieldName];
      // If the value is missing or NaN, replace with 0
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });

    try {
      // Evaluate the simplified math string
      // Note: using Function is generally unsafe for arbitrary user input on a server,
      // but in a client-side visualization tool, it's an acceptable way to build a quick formula engine
      // provided we are just evaluating math math
      const result = new Function(`return ${parsedExpr}`)();
      return isFinite(result) ? result : null;
    } catch (e) {
      throw new Error("Syntax Error in formula.");
    }
  }

  /* ---- Get Active Dataset ---- */
  getActive() {
    if (!this.activeDataset) return null;
    return this.datasets.get(this.activeDataset);
  }

  /* ---- Set Active Dataset ---- */
  setActive(name) {
    if (!this.datasets.has(name)) return;
    this.activeDataset = name;
    this.filters = [];
    this.emit('active-changed', { name, dataset: this.datasets.get(name) });
  }

  /* ---- Filtering ---- */
  addFilter(filter) {
    this.filters.push(filter);
    this._applyFilters();
  }

  removeFilter(index) {
    this.filters.splice(index, 1);
    this._applyFilters();
  }

  updateFilter(index, filter) {
    this.filters[index] = filter;
    this._applyFilters();
  }

  _applyFilters() {
    const ds = this.getActive();
    if (!ds) return;
    let rows = [...ds.originalRows];
    for (const f of this.filters) {
      if (f.type === 'range') {
        rows = rows.filter(r => {
          const v = parseFloat(r[f.field]);
          return !isNaN(v) && v >= f.min && v <= f.max;
        });
      } else if (f.type === 'category') {
        rows = rows.filter(r => f.values.includes(String(r[f.field])));
      }
    }
    ds.rows = rows;
    this.emit('data-filtered', { name: this.activeDataset, dataset: ds });
  }

  /* ---- Get filtered rows (with optional aggregation) ---- */
  getAggregatedData(xField, yField, aggFn = 'SUM', colorField = null) {
    const ds = this.getActive();
    if (!ds || !xField || !yField) return null;

    const groups = new Map();
    for (const row of ds.rows) {
      const key = colorField ? `${row[xField]}|||${row[colorField]}` : String(row[xField]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(parseFloat(row[yField]) || 0);
    }

    const labels = [];
    const datasets = new Map();

    for (const [key, vals] of groups) {
      let cat, series;
      if (colorField) {
        const parts = key.split('|||');
        cat = parts[0];
        series = parts[1];
      } else {
        cat = key;
        series = yField;
      }

      if (!labels.includes(cat)) labels.push(cat);
      if (!datasets.has(series)) datasets.set(series, new Map());
      datasets.get(series).set(cat, this._aggregate(vals, aggFn));
    }

    const result = { labels };
    result.datasets = [];
    let i = 0;
    for (const [seriesName, values] of datasets) {
      result.datasets.push({
        label: seriesName,
        data: labels.map(l => values.get(l) ?? 0),
        colorIndex: i++
      });
    }
    return result;
  }

  _aggregate(values, fn) {
    if (!values.length) return 0;
    switch (fn) {
      case 'SUM': return values.reduce((a, b) => a + b, 0);
      case 'AVG': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'COUNT': return values.length;
      case 'MIN': return Math.min(...values);
      case 'MAX': return Math.max(...values);
      case 'MEDIAN': {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      default: return values.reduce((a, b) => a + b, 0);
    }
  }

  /* ---- Scatter/Bubble raw data ---- */
  getScatterData(xField, yField, sizeField = null, colorField = null) {
    const ds = this.getActive();
    if (!ds || !xField || !yField) return null;

    const groups = new Map();
    for (const row of ds.rows) {
      const series = colorField ? String(row[colorField]) : 'All';
      if (!groups.has(series)) groups.set(series, []);
      const point = {
        x: parseFloat(row[xField]) || 0,
        y: parseFloat(row[yField]) || 0,
      };
      if (sizeField) point.r = Math.max(3, Math.min(30, (parseFloat(row[sizeField]) || 1)));
      groups.get(series).push(point);
    }

    const datasets = [];
    let i = 0;
    for (const [label, data] of groups) {
      datasets.push({ label, data, colorIndex: i++ });
    }
    return { datasets };
  }

  /* ---- Infer field metadata ---- */
  _inferFields(rows) {
    if (!rows.length) return [];
    const fields = [];
    const sampleSize = Math.min(rows.length, 50);

    for (const key of Object.keys(rows[0])) {
      let numCount = 0;
      let dateCount = 0;
      for (let i = 0; i < sampleSize; i++) {
        const val = rows[i][key];
        if (val != null && val !== '' && !isNaN(Number(val))) numCount++;
        else if (val != null && !isNaN(Date.parse(val)) && String(val).length > 4) dateCount++;
      }
      const isNumeric = numCount / sampleSize > 0.6;
      const isDate = dateCount / sampleSize > 0.6;
      fields.push({
        name: key,
        type: isNumeric ? 'number' : isDate ? 'date' : 'string',
        role: isNumeric ? 'measure' : 'dimension'
      });
    }
    return fields;
  }

  /* ---- Get unique values for a field ---- */
  getUniqueValues(fieldName) {
    const ds = this.getActive();
    if (!ds) return [];
    const values = new Set();
    for (const row of ds.originalRows) {
      values.add(String(row[fieldName]));
    }
    return [...values].sort();
  }

  /* ---- Get field range for numeric fields ---- */
  getFieldRange(fieldName) {
    const ds = this.getActive();
    if (!ds) return { min: 0, max: 100 };
    let min = Infinity, max = -Infinity;
    for (const row of ds.originalRows) {
      const v = parseFloat(row[fieldName]);
      if (!isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 100 : max };
  }
}

export default new DataStore();
