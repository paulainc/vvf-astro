import { describe, expect, it } from 'vitest'
import { alignPages, mergeTables, pageStrings, translate } from './align.mjs'

const en = `<html><head><title>Ways to Give | VVF</title><meta name="description" content="Give today."></head>
<body><div class="hero"><h1>Make a gift today</h1><img alt="A smiling girl" src="a.jpg"><a class="button">Donate</a></div>
<div class="list"><p>$25</p><p>Every gift counts.</p></div><script>var x = "ignored"</script></body></html>`

const es = `<html><head><title>Formas de ayudar | VVF</title><meta name="description" content="Dona hoy."></head>
<body><div class="hero"><h1>Haz una donación hoy</h1><img alt="Una niña sonriente" src="a.jpg"><a class="button">Donar</a></div>
<div class="extra"><p>Solo en español</p></div>
<div class="list"><p>$25</p><p>Cada donación cuenta.</p></div></body></html>`

describe('alignPages', () => {
  it('pairs strings at the same element path, skipping extra nodes and unchanged text', () => {
    const table = alignPages(en, es)
    expect(Object.fromEntries(table)).toEqual({
      'Ways to Give | VVF': 'Formas de ayudar | VVF',
      'Give today.': 'Dona hoy.',
      'Make a gift today': 'Haz una donación hoy',
      'A smiling girl': 'Una niña sonriente',
      Donate: 'Donar',
      'Every gift counts.': 'Cada donación cuenta.',
    })
  })

  it('ignores scripts', () => {
    expect(pageStrings(en).some((s) => s.text.includes('ignored'))).toBe(false)
  })
})

describe('translate / mergeTables', () => {
  it('looks up loosely (whitespace, typographic quotes) and merges first-wins', () => {
    const table = mergeTables([new Map([["Child's life", 'Vida del niño']]), new Map([["Child's life", 'otra'], ['Hi', 'Hola']])])
    expect(translate(table, 'Child’s   life')).toBe('Vida del niño')
    expect(translate(table, 'Hi')).toBe('Hola')
    expect(translate(table, 'Missing')).toBeUndefined()
  })
})
