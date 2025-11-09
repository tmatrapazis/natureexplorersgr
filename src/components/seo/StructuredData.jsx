import React from 'react';

/**
 * Component to inject JSON-LD structured data into the page
 * @param {Object} data - The structured data object
 */
export default function StructuredData({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}