import { EstimationsGraph } from './estimations-graph'

const COLOR_CLASSES = [
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
] as const

export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function uniqueSkills(skills: string[]): string[] {
  const unique = new Set<string>()
  for (const skill of skills) {
    const normalized = normalizeSkill(skill)
    if (normalized) unique.add(normalized)
  }
  return Array.from(unique)
}

export function collectKnownSkills(state: Pick<EstimationsGraph.GraphState, 'workers' | 'nodes'>): string[] {
  const bag: string[] = []
  state.workers.forEach((worker) => {
    bag.push(...(worker.skills ?? []))
  })
  state.nodes.forEach((node) => {
    bag.push(...(node.data.requiredSkills ?? []))
  })
  return uniqueSkills(bag)
}

export function skillColorClass(skill: string): string {
  const normalized = normalizeSkill(skill)
  let hash = 0
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }
  return COLOR_CLASSES[hash % COLOR_CLASSES.length] ?? COLOR_CLASSES[0]
}
