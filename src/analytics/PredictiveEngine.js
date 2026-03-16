/* ======================================================
   PredictiveEngine — Trend Forecasting, Anomaly Detection,
   Natural Language Q&A
   ====================================================== */
import llmService from './LLMService.js';
import dataStore from '../data/DataStore.js';

const PROMPTS = {
  trendForecast: `Analyze the trends in this dataset and provide predictions for the next period(s).

Please provide:
1. **Key Trends Identified** — What patterns do you see? (growth, decline, seasonality, cycles)
2. **Forecasted Values** — For each key measure, predict the next 2-3 periods. Present as a markdown table with columns: Field, Current Trend, Predicted Next Value, Confidence Level.
3. **Driving Factors** — What dimensions/categories are driving these trends?
4. **Risk Factors** — What could cause these trends to change?

Be specific with numbers. Use the actual field names and values from the data.`,

  anomalyDetection: `Analyze this dataset for anomalies, outliers, and unusual patterns.

Please provide:
1. **Anomalies Found** — List each anomaly with the specific row/record details. Present as a table with: Record, Field, Value, Expected Range, Severity (🔴 High / 🟡 Medium / 🟢 Low).
2. **Statistical Outliers** — Which values fall outside 2 standard deviations from the mean?
3. **Pattern Breaks** — Any unexpected breaks in otherwise consistent patterns?
4. **Possible Explanations** — For each anomaly, suggest what might have caused it.
5. **Recommended Actions** — What should be investigated further?

Be specific with actual values and records from the data.`,

  dataOverview: `Provide a comprehensive overview and analysis of this dataset.

Please provide:
1. **Dataset Summary** — What does this data represent? Key statistics.
2. **Key Insights** — Top 5 most interesting findings in the data.
3. **Correlations** — Any apparent relationships between fields?
4. **Data Quality** — Any concerns about completeness, consistency, or accuracy?
5. **Suggested Visualizations** — What chart types would best represent this data?`,
};

export async function runTrendForecast() {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');
  return llmService.analyze(PROMPTS.trendForecast, ds);
}

export async function runAnomalyDetection() {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');
  return llmService.analyze(PROMPTS.anomalyDetection, ds);
}

export async function runDataOverview() {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');
  return llmService.analyze(PROMPTS.dataOverview, ds);
}

export async function askQuestion(question, chatHistory = []) {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');

  const messages = [
    ...chatHistory,
    { role: 'user', content: question },
  ];

  return llmService.chat(messages, ds);
}
