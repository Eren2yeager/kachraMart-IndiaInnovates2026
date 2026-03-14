import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = APP_URL;

  // Public pages that should be indexed
  const publicPages = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
  ];

  return publicPages;
}
