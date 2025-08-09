import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://aliifishmarket.com'
  return [
    {
      url: `${site}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${site}/menu`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${site}/staff`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}


