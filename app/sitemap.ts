import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URLs for static pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Dynamic URLs for projects (if publicly accessible)
  // Note: Only include public-facing project pages if they exist
  // For now, we'll skip individual project pages since they require authentication

  return staticUrls;
}