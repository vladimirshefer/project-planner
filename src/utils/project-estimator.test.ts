import { describe, expect, it } from 'vitest'
import { EstimationsGraph } from './estimations-graph'
import { ProjectEstimator } from './project-estimator'
import { StatsEngine } from './stats-engine'

describe('ProjectEstimator', () => {
  it('computes the root project expected value from YAML input', () => {
    const yaml = `
version: 1
items:
  - name: Project
    contains:
      - name: Discovery
        estimate: 10
        risk: none
      - name: Delivery
        estimate: 35
        risk: none
`

    const { state } = EstimationsGraph.deserializeText(yaml)
    const annotated = ProjectEstimator.annotateState(state)
    const project = getAnnotatedRootNode(state, annotated)

    expect(project?.data.histogram).toBeDefined()
    expect(getExpectedValue(project)).toBe(45)
  })

  it('computes a rounded total estimate from YAML input with risk', () => {
    const yaml = `
version: 1
items:
  - name: Project
    contains:
      - name: Discovery
        estimate: 10
        risk: low
      - name: Delivery
        estimate: 35
        risk: none
`

    const { state } = EstimationsGraph.deserializeText(yaml)
    const annotated = ProjectEstimator.annotateState(state)
    const project = getAnnotatedRootNode(state, annotated)

    expect(project?.data.histogram).toBeDefined()
    expect(getExpectedValue(project)).toBeCloseTo(44.2, 1)
  })

  it('computes project estimates without any React rendering', () => {
    const yaml = `
version: 1
items:
  - name: Project
    contains:
      - name: API
        estimate: 20
      - name: UI
        estimate: 25
`

    const { state } = EstimationsGraph.deserializeText(yaml)
    const annotated = ProjectEstimator.annotateState(state)
    const project = annotated.nodes.find((node) => node.data.label === 'Project')

    expect(project?.data.histogram).toBeDefined()
    expect(project?.data.successProb).toBe(1)
  })
})

function getAnnotatedRootNode(
  state: EstimationsGraph.GraphState,
  annotated: EstimationsGraph.GraphState
): EstimationsGraph.GraphNode | undefined {
  const rootNodeId = ProjectEstimator.getDefaultRootNodeId(state)
  return annotated.nodes.find((node) => node.id === rootNodeId)
}

function getExpectedValue(node: EstimationsGraph.GraphNode | undefined): number {
  return StatsEngine.getMean(node?.data.histogram ?? [])
}
