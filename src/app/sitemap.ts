import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://myproductschool.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://myproductschool.com/waitlist', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://myproductschool.com/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://myproductschool.com/login', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://myproductschool.com/signup', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ]
}
