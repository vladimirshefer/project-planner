import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProjectCodeEditor } from './ProjectCodeEditor'

describe('ProjectCodeEditor', () => {
  it('renders as a height-filling editor with pinned action row', () => {
    const html = renderToStaticMarkup(
      <ProjectCodeEditor
        modalText="version: 1"
        importError=""
        onModalTextChange={() => {}}
        onApply={() => {}}
      />
    )

    expect(html).toContain('flex h-full min-h-0 flex-col')
    expect(html).toContain('h-full min-h-0 w-full flex-1')
    expect(html).toContain('flex shrink-0 justify-end')
    expect(html).toContain('>Apply<')
  })

  it('renders inline parse error text', () => {
    const html = renderToStaticMarkup(
      <ProjectCodeEditor
        modalText="bad"
        importError="Invalid YAML"
        onModalTextChange={() => {}}
        onApply={() => {}}
      />
    )

    expect(html).toContain('Invalid YAML')
  })
})

