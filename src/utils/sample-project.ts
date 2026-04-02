import { MarkerType } from '@xyflow/react'
import { EstimationsGraph } from './estimations-graph'

export namespace SampleProject {
  export function createState(): EstimationsGraph.GraphState {
    return {
      nodes: [
        {
          id: 'sample-root',
          position: { x: 420, y: 40 },
          data: { label: 'Q3 Launch Plan', estimate: 0, risk: 'none', priority: 'major' },
          type: 'editable',
        },
        {
          id: 'sample-discovery',
          position: { x: 100, y: 240 },
          data: { label: 'Shape rollout scope', estimate: 4, risk: 'low', priority: 'major', assigneeIds: ['worker-pm'] },
          type: 'editable',
        },
        {
          id: 'sample-design',
          position: { x: 360, y: 240 },
          data: {
            label: 'Design landing page',
            estimate: 5,
            risk: 'medium',
            priority: 'major',
            assigneeIds: ['worker-designer'],
          },
          type: 'editable',
        },
        {
          id: 'sample-build',
          position: { x: 620, y: 240 },
          data: {
            label: 'Build onboarding flow',
            estimate: 8,
            risk: 'high',
            priority: 'critical',
            assigneeIds: ['worker-frontend'],
            requiredSkills: ['react', 'ux'],
          },
          type: 'editable',
        },
        {
          id: 'sample-content',
          position: { x: 260, y: 460 },
          data: {
            label: 'Write intro copy',
            estimate: 2,
            risk: 'none',
            priority: 'medium',
            assigneeIds: ['worker-pm'],
          },
          type: 'editable',
        },
        {
          id: 'sample-qa',
          position: { x: 520, y: 460 },
          data: {
            label: 'QA and launch checks',
            estimate: 3,
            risk: 'medium',
            priority: 'major',
            assigneeIds: ['worker-frontend'],
          },
          type: 'editable',
        },
      ],
      edges: [
        {
          id: 'sample-root-discovery',
          source: 'sample-root',
          target: 'sample-discovery',
          type: 'editable',
          data: { kind: 'contains', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        {
          id: 'sample-root-design',
          source: 'sample-root',
          target: 'sample-design',
          type: 'editable',
          data: { kind: 'contains', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        {
          id: 'sample-root-build',
          source: 'sample-root',
          target: 'sample-build',
          type: 'editable',
          data: { kind: 'contains', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        {
          id: 'sample-design-content',
          source: 'sample-design',
          target: 'sample-content',
          type: 'editable',
          data: { kind: 'contains', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        {
          id: 'sample-build-qa',
          source: 'sample-build',
          target: 'sample-qa',
          type: 'editable',
          data: { kind: 'contains', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        {
          id: 'sample-discovery-design',
          source: 'sample-discovery',
          target: 'sample-design',
          type: 'editable',
          data: { kind: 'after', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.Arrow },
        },
        {
          id: 'sample-content-build',
          source: 'sample-content',
          target: 'sample-build',
          type: 'editable',
          data: { kind: 'after', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.Arrow },
        },
        {
          id: 'sample-design-qa',
          source: 'sample-design',
          target: 'sample-qa',
          type: 'editable',
          data: { kind: 'after', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.Arrow },
        },
      ],
      workers: [
        {
          id: 'worker-pm',
          name: 'Nina',
          skills: ['product', 'copy'],
          availabilityPercent: 60,
        },
        {
          id: 'worker-designer',
          name: 'Ilya',
          skills: ['design', 'ux'],
          availabilityPercent: 50,
        },
        {
          id: 'worker-frontend',
          name: 'Marta',
          skills: ['react', 'qa', 'ux'],
          availabilityPercent: 100,
        },
      ],
    }
  }
}
