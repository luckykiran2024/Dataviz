/* ======================================================
   PrescriptiveEngine — AI Recommendations + What-If Analysis
   ====================================================== */
import llmService from './LLMService.js';
import dataStore from '../data/DataStore.js';

const PROMPTS = {
  recommendations: `Based on this dataset, provide actionable business recommendations.

Please provide:
1. **Top Priority Actions** — 3 immediate actions to take, each with:
   - 📌 **Action**: What to do
   - 📊 **Evidence**: Specific data points supporting this
   - 🎯 **Expected Impact**: Quantified expected outcome
   - ⏰ **Timeline**: When to implement

2. **Strategic Recommendations** — 3 longer-term strategic moves based on the data patterns.

3. **Areas to Monitor** — Key metrics that should be tracked closely and why.

4. **Quick Wins** — 2-3 easy improvements visible in the data.

Use specific numbers and field values from the dataset. Make recommendations actionable and specific.`,

  whatIf: (scenario) => `Perform a what-if analysis based on this scenario:

SCENARIO: ${scenario}

Please provide:
1. **Scenario Analysis** — How would this change affect the key measures in the dataset?
2. **Projected Outcomes** — Present a before/after comparison table showing:
   | Metric | Current Value | Projected Value | Change (%) |
3. **Ripple Effects** — What secondary effects might this have across other dimensions?
4. **Risk Assessment** — What risks does this scenario introduce?
5. **Mitigation Strategies** — How to manage the risks while maximizing benefit?
6. **Recommendation** — Should this scenario be pursued? Why or why not?

Use actual numbers from the data for the "Current Value" column and calculate realistic projections.`,

  optimize: `Analyze this dataset to find optimization opportunities.

Please provide:
1. **Performance Gaps** — Where are the biggest gaps between best and worst performers?
2. **Optimization Targets** — Which specific areas have the most room for improvement?
3. **Resource Allocation** — Based on the data, where should resources be focused?
4. **Benchmarks** — What should the target values be for key metrics?
5. **Implementation Roadmap** — Prioritized list of optimization steps.

Use specific values and comparisons from the dataset.`,
};

export async function generateRecommendations() {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');
  return llmService.analyze(PROMPTS.recommendations, ds);
}

export async function runWhatIfAnalysis(scenario) {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');
  if (!scenario || !scenario.trim()) throw new Error('Please describe a scenario');
  return llmService.analyze(PROMPTS.whatIf(scenario), ds);
}

export async function runOptimizationAnalysis() {
  const ds = dataStore.getActive();
  if (!ds) throw new Error('No dataset loaded');
  return llmService.analyze(PROMPTS.optimize, ds);
}
