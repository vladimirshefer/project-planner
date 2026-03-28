export namespace StatsEngine {
  export const RESOLUTION = 100;

  /**
   * A Distribution is an array of size RESOLUTION representing the quantile function.
   * index 0 = 0th percentile, index 99 = 99th percentile.
   */
  export type Distribution = number[];

  /**
   * Numerically conjoins two distributions (sum of random variables).
   */
  export function convolve(distA: Distribution, distB: Distribution): Distribution {
    const combined = new Float64Array(RESOLUTION * RESOLUTION);
    let k = 0;
    for (let i = 0; i < RESOLUTION; i++) {
      const valA = distA[i] ?? 0;
      for (let j = 0; j < RESOLUTION; j++) {
        const valB = distB[j] ?? 0;
        combined[k++] = valA + valB;
      }
    }
    combined.sort();
    
    const result = new Array(RESOLUTION);
    for (let i = 0; i < RESOLUTION; i++) {
      result[i] = combined[i * RESOLUTION + Math.floor(RESOLUTION / 2)] ?? 0;
    }
    return result;
  }

  /**
   * Applies a probability gate to a distribution.
   */
  export function applyProbability(dist: Distribution, prob: number): Distribution {
    const result = new Array(RESOLUTION);
    const zeroCount = Math.round(RESOLUTION * (1 - prob));
    for (let i = 0; i < zeroCount; i++) result[i] = 0;
    for (let i = zeroCount; i < RESOLUTION; i++) {
      const originalIdx = Math.floor(((i - zeroCount) / (RESOLUTION - zeroCount)) * RESOLUTION);
      result[i] = dist[Math.min(originalIdx, RESOLUTION - 1)] ?? 0;
    }
    return result;
  }

  /**
   * Returns the value at a specific percentile (0-100).
   */
  export function getPercentile(dist: Distribution, percentile: number): number {
    const idx = Math.min(Math.max(0, Math.floor(percentile)), RESOLUTION - 1);
    return dist[idx] ?? 0;
  }

  /**
   * Calculates the Expected Value (Mean) of the distribution.
   */
  export function getMean(dist: Distribution): number {
    return dist.reduce((a, b) => a + (b ?? 0), 0) / RESOLUTION;
  }

  /**
   * Creates a distribution where all percentiles have the same value.
   */
  export function createConstant(value: number): Distribution {
    return new Array(RESOLUTION).fill(value);
  }

  /**
   * Creates a distribution from a list of sorted samples.
   */
  export function fromSamples(samples: number[]): Distribution {
    const sorted = [...samples].sort((a, b) => a - b);
    const result = new Array(RESOLUTION);
    for (let i = 0; i < RESOLUTION; i++) {
      const idx = Math.floor((i / RESOLUTION) * sorted.length);
      result[i] = sorted[idx] ?? 0;
    }
    return result;
  }
}
