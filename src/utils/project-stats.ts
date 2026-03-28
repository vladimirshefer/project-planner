import { StatsEngine } from './stats-engine';

/**
 * Project-specific logic for mapping human-provided estimates
 * (30/70/95) into StatsEngine Distributions and back.
 */
export namespace ProjectStats {
  
  /**
   * Generates a 100-point distribution based on piecewise linear interpolation
   * of the three user-provided confidence marks.
   */
  export function generateFromMarks(est30: number, est70: number, est95: number): StatsEngine.Distribution {
    const samples = new Array(StatsEngine.RESOLUTION);
    for (let i = 0; i < StatsEngine.RESOLUTION; i++) {
      const p = i; 
      if (p <= 30) {
        const t = p / 30;
        samples[i] = (est30 / 2) * (1 - t) + est30 * t;
      } else if (p <= 70) {
        const t = (p - 30) / (70 - 30);
        samples[i] = est30 * (1 - t) + est70 * t;
      } else if (p <= 95) {
        const t = (p - 70) / (95 - 70);
        samples[i] = est70 * (1 - t) + est95 * t;
      } else {
        const t = (p - 95) / (100 - 95);
        samples[i] = est95 * (1 - t) + (est95 * 3) * t;
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
    p70: number;
    p95: number;
    ev: number;
  }

  /**
   * Extracts the view marks from a distribution array.
   */
  export function extractViewMarks(dist: StatsEngine.Distribution): ViewMarks {
    return {
      p30: StatsEngine.getPercentile(dist, 30),
      p50: StatsEngine.getPercentile(dist, 50),
      p70: StatsEngine.getPercentile(dist, 70),
      p95: StatsEngine.getPercentile(dist, 95),
      ev: StatsEngine.getMean(dist)
    };
  }
}
