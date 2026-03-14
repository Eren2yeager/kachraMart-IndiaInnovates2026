import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/signin', '/auth/signup'],
        disallow: [
          '/api/',
          '/dashboard',
          '/citizen/',
          '/collector/',
          '/dealer/',
          '/admin/',
          '/.next/',
          '/node_modules/',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/auth/signin', '/auth/signup'],
        disallow: [
          '/api/',
          '/dashboard',
          '/citizen/',
          '/collector/',
          '/dealer/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/auth/signin', '/auth/signup'],
        disallow: [
          '/api/',
          '/dashboard',
          '/citizen/',
          '/collector/',
          '/dealer/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
