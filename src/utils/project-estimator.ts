import { EstimationsGraph } from './estimations-graph'
import { ProjectStats } from './project-stats'
import { StatsEngine } from './stats-engine'

export namespace ProjectEstimator {
  /**
   * Computes estimate distributions for every node and attaches the results
   * back onto the graph state for rendering and downstream analysis.
   */
  export function annotateState(state: EstimationsGraph.GraphState): EstimationsGraph.GraphState {
    const estimates = computeAllNodeEstimates(state)
    return {
      ...state,
      nodes: state.nodes.map((node) => {
        const result = estimates.get(node.id)
        if (!result) return node
        return {
          ...node,
          data: {
            ...node.data,
            histogram: result.dist,
            successProb: result.successProb,
          },
        }
      }),
    }
  }

  /**
   * Returns the first node with no incoming `contains` edge, which is treated
   * as the top-level project for aggregate assertions and UI display.
   */
  export function getDefaultRootNodeId(state: EstimationsGraph.GraphState): string | null {
    const incomingContains = new Set(
      state.edges
        .filter((edge) => (edge.data?.kind ?? 'contains') === 'contains')
        .map((edge) => edge.target)
    )

    const root = [...state.nodes]
      .filter((node) => !incomingContains.has(node.id))
      .sort((a, b) => a.id.localeCompare(b.id))[0]

    return root?.id ?? state.nodes[0]?.id ?? null
  }

  type EstimateResult = {
    dist: StatsEngine.Distribution
    // Probability that this node still succeeds after multiplying local limit checks
    // and each child edge's optionality / recovery contribution into one value.
    successProb: number
  }

  function computeAllNodeEstimates(state: EstimationsGraph.GraphState): Map<string, EstimateResult> {
    const adj = new Map<string, Array<{ to: string; prob: number; recovery: number }>>()
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]))

    state.edges.forEach((edge) => {
      const kind = edge.data?.kind ?? 'contains'
      if (kind !== 'contains') return
      const current = adj.get(edge.source) ?? []
      current.push({
        to: edge.target,
        prob: (edge.data?.probability ?? 100) / 100,
        recovery: (edge.data?.recovery ?? 0) / 100,
      })
      adj.set(edge.source, current)
    })

    const memo = new Map<string, EstimateResult>()
    const processing = new Set<string>()

    function computeNodeEstimate(nodeId: string): EstimateResult {
      const existing = memo.get(nodeId)
      if (existing) return existing
      if (processing.has(nodeId)) return createResult(StatsEngine.createConstant(0), 1)

      processing.add(nodeId)
      const node = nodeById.get(nodeId)
      if (!node) {
        processing.delete(nodeId)
        return createResult(StatsEngine.createConstant(0), 1)
      }

      let currentDist = ProjectStats.generateFromMedianAndRisk(node.data.estimate ?? 0, node.data.risk ?? 'none')
      let successProb = 1

      ;(adj.get(nodeId) ?? []).forEach((child) => {
        const childResult = computeNodeEstimate(child.to)
        const childEffectiveDist = StatsEngine.applyProbability(childResult.dist, child.prob)
        const childEffectiveSuccess = childResult.successProb + (1 - childResult.successProb) * child.recovery
        const childContributionToSuccess = (1 - child.prob) + child.prob * childEffectiveSuccess

        successProb *= childContributionToSuccess
        currentDist = StatsEngine.convolve(currentDist, childEffectiveDist)
      })

      if (node.data.limit !== undefined && node.data.limit !== null) {
        successProb *= StatsEngine.getProbabilityOfLimit(currentDist, node.data.limit)
      }

      const result = createResult(currentDist, successProb)
      memo.set(nodeId, result)
      processing.delete(nodeId)
      return result
    }

    state.nodes.forEach((node) => {
      computeNodeEstimate(node.id)
    })

    return memo
  }

  function createResult(dist: StatsEngine.Distribution, successProb: number): EstimateResult {
    return {
      dist,
      successProb,
    }
  }
}
