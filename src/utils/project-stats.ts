import { StatsEngine } from './stats-engine';

/**
 * Project-specific logic for mapping human-provided estimates
 * (Median + Risk Multiplier) into StatsEngine Distributions and back.
 */
export namespace ProjectStats {
  
  export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'extreme';

  export const RISK_MULTIPLIERS: Record<RiskLevel, number> = {
    none: 1,
    low: 1.2,
    medium: 2,
    high: 5,
    extreme: 20,
  };

  /**
   * Generates a 100-point distribution based on:
   * 0% = estimate * 0.5
   * 50% = estimate * 1.0
   * 100% = estimate * riskMultiplier
   */
  export function generateFromMedianAndRisk(estimate: number, risk: RiskLevel): StatsEngine.Distribution {
    if (risk === 'none') {
      return StatsEngine.createConstant(estimate);
    }

    const multiplier = RISK_MULTIPLIERS[risk] || 2;
    const min = estimate * 0.5;
    const median = estimate;
    const max = estimate * multiplier;

    const samples = new Array(StatsEngine.RESOLUTION);
    for (let i = 0; i < StatsEngine.RESOLUTION; i++) {
      const p = i; 
      if (p <= 50) {
        // Linear interpolation from 0 to 50
        const t = p / 50;
        samples[i] = min * (1 - t) + median * t;
      } else {
        // Linear interpolation from 50 to 100
        const t = (p - 50) / (100 - 50);
        samples[i] = median * (1 - t) + max * t;
      }
    }
    return samples;
  }

  /**
   * The structure we use to show the final results to the user.
   */
  export interface ViewMarks {
    p30: number;
    p50: number;
    p80: number;
    p95: number;
    p99: number;
    ev: number;
    successProb: number;
  }

  /**
   * Extracts the view marks from a distribution array.
   */
  export function extractViewMarks(dist: StatsEngine.Distribution, successProb: number): ViewMarks {
    return {
      p30: StatsEngine.getPercentile(dist, 30),
      p50: StatsEngine.getPercentile(dist, 50),
      p80: StatsEngine.getPercentile(dist, 80),
      p95: StatsEngine.getPercentile(dist, 95),
      p99: StatsEngine.getPercentile(dist, 99),
      ev: StatsEngine.getMean(dist),
      successProb
    };
  }
}
