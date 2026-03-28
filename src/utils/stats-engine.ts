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
  /**
   * Returns the probability (0 to 1) that the value is <= limit.
   */
  export function getProbabilityOfLimit(dist: Distribution, limit: number): number {
    const first = dist[0] ?? 0;
    const last = dist[RESOLUTION - 1] ?? 0;
    if (limit <= first) return 0;
    if (limit >= last) return 1;

    // Binary search for the first index where dist[i] > limit
    let low = 0;
    let high = RESOLUTION - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const current = dist[mid] ?? 0;
      if (current <= limit) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    // Low is the count of samples <= limit. 
    // Since we have RESOLUTION samples, probability is low / RESOLUTION.
    return low / RESOLUTION;
  }
}
