/**
 * Sitemap Generator for Nature Explorers
 * Generates XML sitemap for Google Search Console
 * Includes static routes and dynamically generated routes from Base44 API
 */

import { createClientFromRequest } from '@base44/sdk';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const BASE_URL = 'https://natureexplorers.gr';

// Static routes that should always be in the sitemap
const STATIC_ROUTES: SitemapEntry[] = [
  {
    loc: `${BASE_URL}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: `${BASE_URL}/Calendar`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: `${BASE_URL}/Guides`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: `${BASE_URL}/OrganizersList`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: `${BASE_URL}/About`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    loc: `${BASE_URL}/GreekRefuges`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    loc: `${BASE_URL}/PrivacyPolicy`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.6,
  },
  {
    loc: `${BASE_URL}/CookiePolicy`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.6,
  },
  {
    loc: `${BASE_URL}/TermsOfUse`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.6,
  },
];

/**
 * Generate XML sitemap entries for dynamic routes
 */
async function generateDynamicRoutes(base44: any): Promise<SitemapEntry[]> {
  const dynamicRoutes: SitemapEntry[] = [];

  try {
    // Fetch all hiking trips
    console.log('Fetching hiking trips for sitemap...');
    const trips = await base44.entities.HikingTrip.list();
    
    trips.forEach((trip: any) => {
      if (trip.id && trip.status !== 'draft' && trip.status !== 'archived') {
        dynamicRoutes.push({
          loc: `${BASE_URL}/TripDetails?id=${trip.id}`,
          lastmod: trip.updated_date ? new Date(trip.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.6,
        });
      }
    });
    console.log(`Added ${trips.length} trip entries to sitemap`);
  } catch (error) {
    console.error('Error fetching trips for sitemap:', error);
  }

  try {
    // Fetch all mountain guides
    console.log('Fetching mountain guides for sitemap...');
    const guides = await base44.entities.MountainGuide.list();
    
    guides.forEach((guide: any) => {
      if (guide.id && guide.is_verified) {
        dynamicRoutes.push({
          loc: `${BASE_URL}/GuideProfile?id=${guide.id}`,
          lastmod: guide.updated_date ? new Date(guide.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.5,
        });
      }
    });
    console.log(`Added ${guides.length} guide entries to sitemap`);
  } catch (error) {
    console.error('Error fetching guides for sitemap:', error);
  }

  try {
    // Fetch all organizers
    console.log('Fetching organizers for sitemap...');
    const organizers = await base44.entities.Organizer.list();
    
    organizers.forEach((org: any) => {
      if (org.username && org.is_verified) {
        dynamicRoutes.push({
          loc: `${BASE_URL}/OrganizerProfile/${org.username}`,
          lastmod: org.updated_date ? new Date(org.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.5,
        });
      }
    });
    console.log(`Added ${organizers.length} organizer entries to sitemap`);
  } catch (error) {
    console.error('Error fetching organizers for sitemap:', error);
  }

  return dynamicRoutes;
}

/**
 * Convert sitemap entries to XML format
 */
function entriesToXml(entries: SitemapEntry[]): string {
  const xmlEntries = entries
    .map(
      (entry) =>
        `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main function to generate the complete sitemap
 * Can be called during build process or on-demand
 */
export async function generateSitemap(base44: any): Promise<string> {
  console.log('Starting sitemap generation...');
  
  try {
    // Combine static and dynamic routes
    const dynamicRoutes = await generateDynamicRoutes(base44);
    const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

    // Sort by priority (highest first) then by URL
    allRoutes.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.loc.localeCompare(b.loc);
    });

    const xml = entriesToXml(allRoutes);
    console.log(`Sitemap generated with ${allRoutes.length} total entries`);
    
    return xml;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return sitemap with only static routes as fallback
    return entriesToXml(STATIC_ROUTES);
  }
}

/**
 * Alternative: Generate sitemap from pre-fetched data
 * Useful when API calls have already been made
 */
export function generateSitemapFromData(
  trips: any[] = [],
  guides: any[] = [],
  organizers: any[] = []
): string {
  const dynamicRoutes: SitemapEntry[] = [];

  // Add trip routes
  trips.forEach((trip) => {
    if (trip.id && trip.status !== 'draft' && trip.status !== 'archived') {
      dynamicRoutes.push({
        loc: `${BASE_URL}/TripDetails?id=${trip.id}`,
        lastmod: trip.updated_date ? new Date(trip.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.6,
      });
    }
  });

  // Add guide routes
  guides.forEach((guide) => {
    if (guide.id && guide.is_verified) {
      dynamicRoutes.push({
        loc: `${BASE_URL}/GuideProfile?id=${guide.id}`,
        lastmod: guide.updated_date ? new Date(guide.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.5,
      });
    }
  });

  // Add organizer routes
  organizers.forEach((org) => {
    if (org.username && org.is_verified) {
      dynamicRoutes.push({
        loc: `${BASE_URL}/OrganizerProfile/${org.username}`,
        lastmod: org.updated_date ? new Date(org.updated_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.5,
      });
    }
  });

  // Combine and sort
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];
  allRoutes.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.loc.localeCompare(b.loc);
  });

  return entriesToXml(allRoutes);
}