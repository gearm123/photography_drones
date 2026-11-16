import { mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const outDir = path.resolve('public/images')
mkdirSync(outDir, { recursive: true })

async function cover(input, width, height, file, position = 'attention') {
  await sharp(input)
    .rotate()
    .resize(width, height, { fit: 'cover', position })
    .webp({ quality: 74 })
    .toFile(path.join(outDir, file))
  console.log(file, width, height)
}

await cover('tmp-images/family.jpg', 1800, 1200, 'hero-family-1800.webp', 'attention')
await cover('tmp-images/family.jpg', 900, 600, 'hero-family-900.webp', 'attention')
await cover('tmp-images/family.jpg', 1200, 630, 'og-family.webp', 'attention')
await cover('tmp-images/candid.jpg', 900, 1125, 'service-mobile.webp')
await cover('tmp-images/professional.jpg', 900, 1125, 'service-professional.webp', 'centre')
await cover('tmp-images/aerial.jpg', 900, 1125, 'service-drone.webp', 'centre')
await cover('tmp-images/hotel.jpg', 900, 1125, 'service-hotel.webp', 'centre')
await cover('tmp-images/sports.jpg', 900, 1125, 'service-sports.webp', 'centre')
await cover('tmp-images/events.jpg', 900, 1125, 'service-events.webp', 'attention')
await cover('tmp-images/hero.jpg', 1200, 1500, 'why.webp', 'centre')
