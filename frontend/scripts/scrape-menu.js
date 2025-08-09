#!/usr/bin/env node
/*
 Minimal scaffolding for menu scraping. Replace fetchers with actual scraping
 as needed. Writes to src/data/menu.json and downloads images into public/images/menu.
*/

const fs = require('fs')
const path = require('path')

async function run() {
  const outPath = path.join(__dirname, '..', 'src', 'data', 'menu.json')
  const outDir = path.dirname(outPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // Placeholder: ingest manually for now; implement scraping later.
  const data = { items: [] }
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
  console.log('Wrote menu data to', outPath)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})


