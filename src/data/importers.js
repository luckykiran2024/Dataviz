/* ======================================================
   Data Importers — CSV & JSON with auto-type detection
   ====================================================== */
import Papa from 'papaparse';

export function parseCSV(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        if (result.errors.length && !result.data.length) {
          reject(new Error(result.errors[0].message));
        } else {
          resolve(result.data);
        }
      },
      error: (err) => reject(err)
    });
  });
}

export function parseJSON(text) {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        resolve(data);
      } else if (data && typeof data === 'object') {
        // Try to find an array inside the object
        const firstArray = Object.values(data).find(v => Array.isArray(v));
        if (firstArray) {
          resolve(firstArray);
        } else {
          reject(new Error('JSON must contain an array of objects'));
        }
      } else {
        reject(new Error('Invalid JSON format'));
      }
    } catch (e) {
      reject(e);
    }
  });
}

export async function importFile(file) {
  const text = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'json') {
    return parseJSON(text);
  } else {
    // Default to CSV/TSV parsing
    return parseCSV(text);
  }
}

export async function importText(text) {
  text = text.trim();
  // Try JSON first
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      return await parseJSON(text);
    } catch (_) { /* fall through to CSV */ }
  }
  return parseCSV(text);
}
