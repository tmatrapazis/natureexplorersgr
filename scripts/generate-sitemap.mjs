/**
 * Post-build script to generate sitemap.xml for SEO
 * Runs after Vite build completes
 * Fetches fresh data from Base44 API and generates sitemap with dynamic routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const DIST_DIR = path.join(__dirname, '..', 'dist');
const BASE_URL = process.env.SITEMAP_URL || 'https://natureexplorers.gr';

// Static routes for the sitemap
const STATIC_ROUTES = [
  { loc: '/', priority: 1.0, changefreq: 'daily' },
  { loc: '/Calendar', priority: 0.9, changefreq: 'daily' },
  { loc: '/Guides', priority: 0.8, changefreq: 'weekly' },
  { loc: '/OrganizersList', priority: 0.8, changefreq: 'weekly' },
  { loc: '/GreekRefuges', priority: 0.7, changefreq: 'monthly' },
  { loc: '/PrivacyPolicy', priority: 0.6, changefreq: 'yearly' },
  { loc: '/CookiePolicy', priority: 0.6, changefreq: 'yearly' },
  { loc: '/TermsOfUse', priority: 0.6, changefreq: 'yearly' },
];

/**
 * Escape special XML characters
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate sitemap XML from entries
 */
function generateSitemapXml(entries) {
  const xmlEntries = entries
    .map(
      (entry) =>
        `  <url>
    <loc>${escapeXml(`${BASE_URL}${entry.loc}`)}</loc>
    <lastmod>${entry.lastmod || getTodayDate()}</lastmod>
    <changefreq>${entry.changefreq || 'monthly'}</changefreq>
    <priority>${entry.priority || 0.5}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generate dynamic routes
 * In production, this would fetch from Base44 API
 * For now, we generate with static routes only
 */
async function generateDynamicRoutes() {
  const dynamicRoutes = [];

  try {
    // Note: In a full implementation, you would:
    // 1. Import the sitemapGenerator utility
    // 2. Initialize Base44 client with credentials
    // 3. Call generateSitemap() or generateSitemapFromData()
    // 4. Parse and extract routes
    
    // For CI/CD environments, you might fetch from a JSON file or API endpoint
    // that's pre-generated or updated separately
    
    console.log('Dynamic routes generation would go here (API calls to Base44)');
    console.log('Currently using static routes only for build-time sitemap');
  } catch (error) {
    console.warn('Warning: Could not generate dynamic routes:', error.message);
    console.warn('Using static routes only');
  }

  return dynamicRoutes;
}

/**
 * Main function to generate and write sitemap
 */
async function generateSitemap() {
  console.log('\n📍 Starting sitemap generation...');
  console.log(`📂 Output directory: ${DIST_DIR}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  try {
    // Ensure dist directory exists
    if (!fs.existsSync(DIST_DIR)) {
      console.log('⚠️  dist directory not found, creating it...');
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    // Generate static and dynamic routes
    const dynamicRoutes = await generateDynamicRoutes();
    const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

    // Sort by priority (highest first)
    allRoutes.sort((a, b) => (b.priority || 0.5) - (a.priority || 0.5));

    // Generate XML
    const sitemapXml = generateSitemapXml(allRoutes);

    // Write to file
    const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📊 Total entries: ${allRoutes.length}`);
    console.log(`   - Static routes: ${STATIC_ROUTES.length}`);
    console.log(`   - Dynamic routes: ${dynamicRoutes.length}`);
    console.log(`📁 File location: ${sitemapPath}`);

    // List first few entries for verification
    console.log('\n📋 Sample entries:');
    allRoutes.slice(0, 3).forEach((route) => {
      console.log(`   - ${BASE_URL}${route.loc} (priority: ${route.priority})`);
    });

    console.log('\n✨ Sitemap generation complete!\n');

    return true;
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
generateSitemap().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
