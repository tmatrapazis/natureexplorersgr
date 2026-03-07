import { useEffect } from 'react';

/**
 * Custom hook to manage document title and meta tags for SEO
 * @param {Object} seo - SEO configuration object
 * @param {string} seo.title - Page title
 * @param {string} seo.description - Meta description
 * @param {string} [seo.image] - OG image URL
 * @param {string} [seo.url] - Canonical URL
 * @param {string} [seo.type] - OG type (website, article, etc.)
 * @param {boolean} [seo.noindex] - If true, adds noindex meta tag to prevent search engine indexing
 */
export const useSEO = ({ title, description, image = undefined, url = undefined, type = 'website', noindex = false }) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description);
    
    // Robots meta tag for noindex
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      // Remove noindex if it exists and noindex is false
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag) {
        robotsTag.remove();
      }
    }
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Nature Explorers', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Canonical URL
    if (url && !noindex) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }
  }, [title, description, image, url, type, noindex]);
};

export default useSEO;