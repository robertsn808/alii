#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const axios = require('axios').default
const { parse } = require('csv-parse/sync')
const slugify = require('slugify')

const rootDir = path.join(__dirname, '..')
const imagesDir = path.join(rootDir, 'public', 'images', 'menu')
const dataOutPath = path.join(rootDir, 'src', 'data', 'menu.json')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function normalizeName(name) {
  return (name || '').trim().replace(/\s+/g, ' ')
}

function parsePrice(v) {
  if (v === undefined || v === null) return undefined
  const s = String(v).replace(/,/g, '')
  const m = s.match(/\$?\s*(\d+(?:\.\d{1,2})?)/)
  return m ? parseFloat(m[1]) : undefined
}

async function downloadImage(src, basenameHint) {
  try {
    const url = new URL(src)
    let ext = path.extname(url.pathname)
    if (!ext) ext = '.jpg'
    const file = `${slugify(basenameHint, { lower: true, strict: true })}${ext}`
    const outPath = path.join(imagesDir, file)
    if (fs.existsSync(outPath)) return `/images/menu/${file}`
    const resp = await axios.get(src, { responseType: 'arraybuffer', timeout: 30000 })
    fs.writeFileSync(outPath, resp.data)
    return `/images/menu/${file}`
  } catch (e) {
    return undefined
  }
}

function dedupeLowerPrice(items) {
  const byKey = new Map()
  for (const it of items) {
    const key = normalizeName(it.name).toLowerCase()
    if (!byKey.has(key)) {
      byKey.set(key, it)
      continue
    }
    const cur = byKey.get(key)
    if (typeof it.price === 'number' && (typeof cur.price !== 'number' || it.price < cur.price)) {
      cur.price = it.price
    }
    if (!cur.imageUrl && it.imageUrl) cur.imageUrl = it.imageUrl
    if ((it.description || '').length > (cur.description || '').length) cur.description = it.description
    if (!cur.category && it.category) cur.category = it.category
    const tags = new Set([...(cur.tags || []), ...(it.tags || [])])
    cur.tags = Array.from(tags)
  }
  return Array.from(byKey.values())
}

async function run() {
  const inputCsv = process.argv[2] || path.join(rootDir, 'data', 'menu.csv')
  if (!fs.existsSync(inputCsv)) {
    console.error('CSV not found:', inputCsv)
    process.exit(1)
  }
  ensureDir(imagesDir)
  const raw = fs.readFileSync(inputCsv, 'utf8')
  const records = parse(raw, { columns: true, skip_empty_lines: true })
  const items = []

  for (const r of records) {
    const name = normalizeName(r.name)
    if (!name) continue
    const description = r.description ? String(r.description) : ''
    const price = parsePrice(r.price)
    const category = r.category ? String(r.category) : 'menu'
    const tags = r.tags ? String(r.tags).split(/[,;]+/).map(t => t.trim()).filter(Boolean) : []
    let imageUrl
    if (r.image_url && /^https?:\/\//i.test(r.image_url)) {
      imageUrl = await downloadImage(r.image_url, name)
    }
    items.push({
      id: slugify(name, { lower: true, strict: true }),
      name,
      description,
      price: typeof price === 'number' ? price : 0,
      category,
      imageUrl,
      available: true,
      tags,
      preparationTime: 5
    })
  }

  const merged = dedupeLowerPrice(items)
  const out = { items: merged }
  ensureDir(path.dirname(dataOutPath))
  fs.writeFileSync(dataOutPath, JSON.stringify(out, null, 2))
  console.log(`Imported ${merged.length} items from CSV ->`, dataOutPath)
}

run().catch((err) => { console.error(err); process.exit(1) })


