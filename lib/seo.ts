import { Metadata } from 'next';
import { APP_NAME, APP_URL, SEO_CONFIG, SOCIAL_LINKS } from '@/config/constants';

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = '',
  image?: string,
  type: 'website' | 'article' = 'website'
): Metadata {
  const url = `${APP_URL}${path}`;
  const ogImage = image || `${APP_URL}/og-image.png`;

  return {
    title: `${title} | ${APP_NAME}`,
    description,
    keywords: SEO_CONFIG.keywords,
    authors: [{ name: SEO_CONFIG.author }],
    creator: SEO_CONFIG.author,
    publisher: APP_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: SEO_CONFIG.locale,
      url,
      title: `${title} | ${APP_NAME}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
      siteName: APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${APP_NAME}`,
      description,
      images: [ogImage],
      creator: SEO_CONFIG.twitterHandle,
    },
    alternates: {
      canonical: url,
    },
    metadataBase: new URL(APP_URL),
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    description: SEO_CONFIG.description,
    sameAs: Object.values(SOCIAL_LINKS),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@kachramart.com',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
  };
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: APP_NAME,
    image: `${APP_URL}/logo.png`,
    description: SEO_CONFIG.description,
    url: APP_URL,
    telephone: '+91-XXXXXXXXXX',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    sameAs: Object.values(SOCIAL_LINKS),
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
