#!/usr/bin/env node
/*
 Scrapes menu data from the provided sources, merges items, resolves price
 mismatches (lower price wins), downloads images, and writes src/data/menu.json.
 Sources:
 - https://aliifishmarket.orderexperience.net/6841c5a82d11936c7206e2c3/menu/6855923368d0dd87d0095171
 - https://www.aliifishmarket.com/
*/

const fs = require('fs')
const path = require('path')
const axios = require('axios').default
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const { URL } = require('url')
const slugify = require('slugify')

const ORDER_URL = 'https://aliifishmarket.orderexperience.net/6841c5a82d11936c7206e2c3/menu/6855923368d0dd87d0095171'
const SITE_URL = 'https://www.aliifishmarket.com/'

const rootDir = path.join(__dirname, '..')
const dataOutPath = path.join(rootDir, 'src', 'data', 'menu.json')
const imagesDir = path.join(rootDir, 'public', 'images', 'menu')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

function parsePrice(text) {
  const m = (text || '').replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d{1,2})?)/)
  return m ? parseFloat(m[1]) : undefined
}

function normalizeCategory(raw) {
  if (!raw) return 'menu'
  const s = raw.toLowerCase()
  if (s.includes('poke bowls')) return 'Poke Bowls'
  if (s === 'poke' || s.includes('poke ')) return 'Poke'
  if (s.includes('special')) return 'Specialties'
  if (s.includes('smoked')) return 'Smoked Meats'
  if (s.includes('dessert') || s.includes('pie')) return 'Desserts'
  return raw.replace(/\b\w/g, c => c.toUpperCase())
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function fetchHtml(url) {
  // Try static fetch first
  try {
    const res = await axios.get(url, { timeout: 20000, headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' } })
    if (res.data && typeof res.data === 'string' && res.data.length > 1000) return res.data
  } catch {}
  // Fallback to headless browser for dynamic pages
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setUserAgent(UA)
    await page.setViewport({ width: 1366, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    // Wait for any price or image to appear
    try { await page.waitForSelector('img, .price, [class*=price], .sqs-money-native', { timeout: 8000 }) } catch {}
    await page.waitForTimeout(1500)
    const html = await page.content()
    return html
  } finally {
    await browser.close()
  }
}

async function fetchJsonCandidates(url) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const results = []
  try {
    const page = await browser.newPage()
    await page.setUserAgent(UA)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    // Capture network JSON
    const jsonBodies = []
    page.on('response', async (resp) => {
      try {
        const ct = resp.headers()['content-type'] || ''
        if (ct.includes('application/json')) {
          const body = await resp.text()
          if (body && body.length > 100) jsonBodies.push(body)
        }
      } catch {}
    })
    await page.waitForTimeout(3000)
    // Collect JSON from common places
    const scripts = await page.$$eval('script', (els) => els.map(el => ({ type: el.type || '', id: el.id || '', text: el.textContent || '' })))
    for (const s of scripts) {
      const t = (s.text || s.textContent || s).toString().trim()
      if (!t) continue
      if (s.type === 'application/json' || /__NEXT_DATA__|__NUXT__|__APOLLO_STATE__|__INITIAL_STATE__/i.test(s.id || '') || /"price"|\$/.test(t)) {
        results.push(t)
      }
    }
    results.push(...jsonBodies)
    // Also try window variables
    const winVars = await page.evaluate(() => {
      const out = {}
      try { out.NEXT = JSON.stringify(window.__NEXT_DATA__ || null) } catch {}
      try { out.NUXT = JSON.stringify(window.__NUXT__ || null) } catch {}
      try { out.APOLLO = JSON.stringify(window.__APOLLO_STATE__ || null) } catch {}
      return out
    })
    for (const k of Object.keys(winVars)) {
      const val = winVars[k]
      if (val && val !== 'null') results.push(val)
    }
  } catch {
    // ignore
  } finally {
    await browser.close()
  }
  return results
}

async function downloadImage(src, destDir, basenameHint) {
  try {
    const url = new URL(src)
    const ext = path.extname(url.pathname) || '.jpg'
    const fileName = `${slugify(basenameHint || path.basename(url.pathname, ext), { lower: true, strict: true })}${ext}`
    const outPath = path.join(destDir, fileName)
    if (fs.existsSync(outPath)) return `/images/menu/${fileName}`
    const resp = await axios.get(src, { responseType: 'arraybuffer', timeout: 30000 })
    fs.writeFileSync(outPath, resp.data)
    return `/images/menu/${fileName}`
  } catch (e) {
    return undefined
  }
}

function dedupeMerge(items) {
  const byKey = new Map()
  for (const it of items) {
    const key = normalizeName(it.name).toLowerCase()
    if (!byKey.has(key)) {
      byKey.set(key, it)
      continue
    }
    const cur = byKey.get(key)
    // pick lower price
    if (typeof it.price === 'number' && (typeof cur.price !== 'number' || it.price < cur.price)) {
      cur.price = it.price
    }
    // prefer image if current lacks one
    if (!cur.imageUrl && it.imageUrl) cur.imageUrl = it.imageUrl
    // merge tags
    const tags = new Set([...(cur.tags || []), ...(it.tags || [])])
    cur.tags = Array.from(tags)
    // keep existing category; if missing, take new one
    if (!cur.category && it.category) cur.category = it.category
    // prefer longer description
    if ((it.description || '').length > (cur.description || '').length) cur.description = it.description
  }
  return Array.from(byKey.values())
}

function extractNearestText($el) {
  const texts = []
  $el.contents().each((_, node) => {
    if (node.type === 'text') {
      const t = (node.data || '').trim()
      if (t) texts.push(t)
    }
  })
  return texts.join(' ')
}

function sectionizeByHeadings($) {
  const sections = []
  const headings = $('h1,h2,h3,h4').toArray()
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const $h = $(h)
    const title = normalizeName($h.text())
    const start = $h
    const end = i + 1 < headings.length ? $(headings[i + 1]) : null
    const $container = $('<div></div>')
    let next = start.next()
    while (next && next.length && (!end || next[0] !== end[0])) {
      $container.append(next.clone())
      next = next.next()
    }
    sections.push({ title, $container })
  }
  return sections
}

function findNearestCategory($, $el) {
  // Walk backwards in DOM to find the nearest previous heading text as category
  const all = $('body *').toArray()
  const idx = all.indexOf($el[0])
  if (idx === -1) return undefined
  for (let i = idx - 1; i >= 0; i--) {
    const node = all[i]
    const tag = (node.tagName || node.name || '').toLowerCase()
    if (/^h[1-6]$/.test(tag)) {
      const t = normalizeName($(node).text())
      if (t && t.length <= 80) return t
    }
  }
  return undefined
}

async function parseAliiSite(html) {
  const $ = cheerio.load(html)
  const items = []
  // Squarespace markup: look for product grids and summaries
  $('.sqs-block-content, .Products-list, .summary-item, .product-item, .summary-item-record-type-product').each((_, el) => {
    const $el = $(el)
    const name = normalizeName($el.find('h1,h2,h3,h4,h5,.product-title,.summary-title a').first().text())
    const priceNode = $el.find('.sqs-money-native, .product-price, .summary-price, .sqs-variant-price, .sqs-moneyline').first()
    const priceText = priceNode.text()
    const price = parsePrice(priceText)
    if (!name || !price || price <= 0 || price > 200) return
    const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src')
    const category = normalizeCategory(findNearestCategory($, $el) || 'menu')
    items.push({
      id: slugify(name, { lower: true, strict: true }),
      name,
      description: '',
      price,
      category,
      imageRemote: imgSrc,
      available: true,
      tags: ['aliifishmarket.com']
    })
  })
  return items
}

async function parseOrderExperience(html, baseUrl) {
  const $ = cheerio.load(html)
  const items = []
  // Heuristic 1: look for elements that contain a price and a nearby title and image
  $('[data-testid], article, section, li, div, .MuiCard-root, .MuiGrid-root').each((_, el) => {
    const $el = $(el)
    const text = normalizeName($el.text())
    const price = parsePrice(text)
    if (!price) return
    // title: search within this container for bold headers or aria-labels
    let title = $el.attr('aria-label') || $el.find('h1,h2,h3,h4,h5,strong,b,[role=heading]').first().text().trim()
    if (!title) {
      const parts = text.split(/\n|\s{2,}/).map(t=>t.trim()).filter(Boolean)
      title = parts.find(t => t && !/\$/.test(t) && t.length >= 3 && t.length <= 80) || ''
    }
    title = normalizeName(title)
    if (!title) return
    // image
    const imgEl = $el.find('img').first()
    const imgSrc = imgEl.attr('src') || imgEl.attr('data-src')
    const category = normalizeCategory(findNearestCategory($, $el) || 'menu')
    if (title && title.length <= 120) {
      items.push({
        id: slugify(title, { lower: true, strict: true }),
        name: title,
        description: '',
        price,
        category,
        imageRemote: imgSrc ? new URL(imgSrc, baseUrl).toString() : undefined,
        available: true,
        tags: ['orderexperience']
      })
    }
  })
  return items
}

function collectItemsFromJson(jsonTextArray, baseUrl) {
  const items = []
  for (const txt of jsonTextArray) {
    let obj
    try { obj = JSON.parse(txt) } catch { continue }
    const stack = [obj]
    while (stack.length) {
      const cur = stack.pop()
      if (Array.isArray(cur)) {
        for (const v of cur) stack.push(v)
        continue
      }
      if (cur && typeof cur === 'object') {
        // detect item-like objects
        const name = typeof cur.name === 'string' ? cur.name : (typeof cur.title === 'string' ? cur.title : undefined)
        let price = cur.price
        if (typeof price === 'string') price = parsePrice(price)
        if (typeof price === 'number' && price > 0 && price < 200 && name) {
          const category = normalizeCategory(cur.category || cur.section || cur.group || cur.menu || cur.menuName || cur.categoryName || 'menu')
          const image = cur.imageUrl || cur.image || (cur.images && cur.images[0]) || (cur.photo && cur.photo.url) || undefined
          items.push({
            id: slugify(name, { lower: true, strict: true }),
            name: normalizeName(name),
            description: typeof cur.description === 'string' ? cur.description : '',
            price,
            category,
            imageRemote: image ? new URL(image, baseUrl).toString() : undefined,
            available: true,
            tags: ['json']
          })
        }
        for (const v of Object.values(cur)) {
          if (v && (typeof v === 'object')) stack.push(v)
        }
      }
    }
  }
  return items
}

async function run() {
  ensureDir(path.dirname(dataOutPath))
  ensureDir(imagesDir)

  console.log('Fetching sources...')
  const [orderHtml, siteHtml] = await Promise.all([
    fetchHtml(ORDER_URL).catch(() => ''),
    fetchHtml(SITE_URL).catch(() => ''),
  ])
  const [orderJsonCandidates, siteJsonCandidates] = await Promise.all([
    fetchJsonCandidates(ORDER_URL).catch(() => []),
    fetchJsonCandidates(SITE_URL).catch(() => []),
  ])

  console.log('Parsing...')
  const orderItems = orderHtml ? await parseOrderExperience(orderHtml, ORDER_URL) : []
  const siteItems = siteHtml ? await parseAliiSite(siteHtml) : []
  const jsonItems = collectItemsFromJson([...orderJsonCandidates, ...siteJsonCandidates], ORDER_URL)

  // Only keep valid items with sensible price
  let merged = dedupeMerge([...orderItems, ...siteItems, ...jsonItems]).filter(it => typeof it.price === 'number' && it.price > 0 && it.price < 200)

  // Download images for items that have remote images but no local imageUrl
  for (const it of merged) {
    if (it.imageRemote && !it.imageUrl) {
      const local = await downloadImage(it.imageRemote, imagesDir, it.name)
      if (local) it.imageUrl = local
      delete it.imageRemote
    }
    // normalize category casing
    it.category = normalizeCategory(it.category)
  }

  // Final normalization
  merged = merged.map(it => ({
    id: it.id || slugify(it.name, { lower: true, strict: true }),
    name: normalizeName(it.name),
    description: it.description || '',
    price: it.price,
    category: it.category || 'menu',
    imageUrl: it.imageUrl,
    available: true,
    tags: it.tags || [],
    preparationTime: 5
  }))

  if (merged.length === 0) {
    // Do not overwrite with empty set; keep previous if exists
    const prev = fs.existsSync(dataOutPath) ? JSON.parse(fs.readFileSync(dataOutPath, 'utf8')) : { items: [] }
    console.log(`No items extracted; keeping existing dataset with ${prev.items?.length || 0} items`)
    return
  }
  const out = { items: merged }
  fs.writeFileSync(dataOutPath, JSON.stringify(out, null, 2))
  console.log(`Wrote ${merged.length} items to`, dataOutPath)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})


