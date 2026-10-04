// Builds an English → Spanish translation table from a live page and its /es
// counterpart. Webflow localization keeps a page's DOM structure in every
// locale, so walking both pages in document order and pairing nodes that sit
// at the same element path yields aligned translations — text nodes plus the
// alt / aria-label / placeholder / title attributes and the SEO head tags.
import { load } from 'cheerio'

const ATTRS = ['alt', 'aria-label', 'placeholder', 'title']
const SKIP = 'script, style, noscript, svg'

const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim()

// Every translatable string on the page, in document order, with the element
// path it sits on (e.g. "div.hero > h1#text").
export function pageStrings(html) {
  const $ = load(html)
  $(SKIP).remove()
  const out = []
  const title = norm($('head > title').text())
  if (title) out.push({ path: 'head>title', text: title })
  const description = norm($('meta[name="description"]').attr('content'))
  if (description) out.push({ path: 'head>meta.description', text: description })

  const walk = (el, path) => {
    for (const node of $(el).contents().toArray()) {
      if (node.type === 'text') {
        const text = norm(node.data)
        if (/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(text)) out.push({ path: `${path}#text`, text })
      } else if (node.type === 'tag') {
        const cls = ($(node).attr('class') ?? '').split(/\s+/).filter(Boolean)[0]
        const p = `${path}>${node.name}${cls ? `.${cls}` : ''}`
        for (const a of ATTRS) {
          const v = norm($(node).attr(a))
          if (v && /[A-Za-z]/.test(v)) out.push({ path: `${p}@${a}`, text: v })
        }
        walk(node, p)
      }
    }
  }
  walk($('body').get(0), 'body')
  return out
}

// Longest-common-subsequence alignment on element paths; returns
// Map<englishText, spanishText> for pairs whose text actually differs.
export function alignPages(enHtml, esHtml) {
  const en = pageStrings(enHtml)
  const es = pageStrings(esHtml)
  const n = en.length
  const m = es.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = en[i].path === es[j].path ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const table = new Map()
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (en[i].path === es[j].path) {
      if (en[i].text !== es[j].text && !table.has(en[i].text)) table.set(en[i].text, es[j].text)
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return table
}

// Merges several page tables; the first translation seen for a string wins.
export function mergeTables(tables) {
  const merged = new Map()
  for (const t of tables) for (const [k, v] of t) if (!merged.has(k)) merged.set(k, v)
  return merged
}

// Translates a value from the table, ignoring whitespace and typographic
// apostrophe differences; undefined when the table has no entry.
export function translate(table, text) {
  if (!text) return undefined
  const key = norm(text)
  if (table.has(key)) return table.get(key)
  const loose = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
  for (const [k, v] of table) if (loose(k) === loose(key)) return v
  return undefined
}
