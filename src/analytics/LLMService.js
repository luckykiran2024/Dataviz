/* ======================================================
   LLMService — Google Gemini Pro integration layer
   Manages API key, sends data context to Gemini,
   handles responses and streaming.
   ====================================================== */
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY_STORAGE = 'dataviz-gemini-api-key';
const MODEL_NAME = 'gemini-1.5-pro';

class LLMService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this._loadKey();
  }

  /* ---- API Key Management ---- */
  _loadKey() {
    const key = localStorage.getItem(API_KEY_STORAGE);
    if (key) this._initClient(key);
  }

  _initClient(apiKey) {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: MODEL_NAME });
    } catch (e) {
      console.error('Failed to init Gemini:', e);
      this.genAI = null;
      this.model = null;
    }
  }

  setApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE, key);
    this._initClient(key);
  }

  getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  hasApiKey() {
    return !!this.model;
  }

  /* ---- Build Data Context ---- */
  buildDataContext(dataset, options = {}) {
    if (!dataset) return 'No data loaded.';

    const { rows, fields, name } = dataset;
    const maxSampleRows = options.maxSamples || 30;
    const sampleRows = rows.slice(0, maxSampleRows);

    // Calculate basic stats for numeric fields
    const stats = {};
    const numericFields = fields.filter(f => f.type === 'number');
    for (const field of numericFields) {
      const values = rows.map(r => parseFloat(r[field.name])).filter(v => !isNaN(v));
      if (values.length === 0) continue;
      stats[field.name] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0).toFixed(2),
      };
    }

    // Unique values for dimensions
    const dimValues = {};
    const dimFields = fields.filter(f => f.role === 'dimension');
    for (const field of dimFields) {
      const uniq = [...new Set(rows.map(r => r[field.name]))];
      dimValues[field.name] = uniq.length > 15 ? uniq.slice(0, 15).concat(['...']) : uniq;
    }

    return `DATASET: "${name}"
TOTAL ROWS: ${rows.length}
FIELDS: ${fields.map(f => `${f.name} (${f.type}, ${f.role})`).join(', ')}

NUMERIC FIELD STATISTICS:
${JSON.stringify(stats, null, 2)}

DIMENSION VALUES:
${JSON.stringify(dimValues, null, 2)}

SAMPLE DATA (first ${sampleRows.length} rows):
${JSON.stringify(sampleRows, null, 2)}`;
  }

  /* ---- Send Prompt ---- */
  async analyze(prompt, dataset, options = {}) {
    if (!this.model) {
      throw new Error('API key not configured. Please add your Google AI API key in Settings.');
    }

    const context = this.buildDataContext(dataset, options);
    const fullPrompt = `You are an expert data analyst. You are analyzing a dataset and providing insights.

${context}

---

${prompt}

IMPORTANT: Respond in well-structured markdown. Use headers, bullet points, bold text, and tables where appropriate. Be specific with numbers from the data. Keep your response focused and actionable.`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
        throw new Error('Invalid API key. Please check your Google AI API key in Settings.');
      }
      throw error;
    }
  }

  /* ---- Chat (for Q&A) ---- */
  async chat(messages, dataset) {
    if (!this.model) {
      throw new Error('API key not configured. Please add your Google AI API key in Settings.');
    }

    const context = this.buildDataContext(dataset);
    const systemInstruction = `You are a helpful data analyst assistant. You have access to the following dataset:

${context}

Answer questions about this data accurately. Use specific numbers. Format responses in clear markdown.`;

    try {
      const chat = this.model.startChat({
        history: messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 2048 },
      });

      // Prepend context to the first user message if no history
      const lastMessage = messages[messages.length - 1];
      const userMsg = messages.length === 1
        ? `${systemInstruction}\n\nUser question: ${lastMessage.content}`
        : lastMessage.content;

      const result = await chat.sendMessage(userMsg);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
        throw new Error('Invalid API key. Please check your Google AI API key in Settings.');
      }
      throw error;
    }
  }
}

export default new LLMService();
