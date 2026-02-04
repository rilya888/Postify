import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/projects/', '/settings/'], // Disallow authenticated areas
    },
    sitemap: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}