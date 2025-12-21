/**
 * SchemaOrg Component
 * 
 * Injects JSON-LD structured data into the page head.
 * Use this component to add schema.org markup for SEO.
 * 
 * Usage:
 *   <SchemaOrg schema={vehicleSchema} />
 *   <SchemaOrg schemas={[breadcrumbSchema, vehicleSchema]} />
 * 
 * @module components/SchemaOrg
 */

import { serializeSchema } from '@/lib/seoUtils';

/**
 * Injects a single JSON-LD schema or multiple schemas into the page.
 * 
 * @param {Object} props
 * @param {Object} [props.schema] - Single schema object
 * @param {Object[]} [props.schemas] - Array of schema objects
 * @returns {JSX.Element|null}
 */
export default function SchemaOrg({ schema, schemas }) {
  // Handle single schema
  if (schema) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchema(schema) }}
      />
    );
  }

  // Handle multiple schemas
  if (schemas && schemas.length > 0) {
    return (
      <>
        {schemas.filter(Boolean).map((s, index) => (
          <script
            key={`schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeSchema(s) }}
          />
        ))}
      </>
    );
  }

  return null;
}

/**
 * Pre-built schema components for common page types.
 * These use the seoUtils generators internally.
 */

import {
  generateBreadcrumbSchema,
  generateVehicleSchema,
  generateEventSchema,
  generateArticleSchema,
  generateFAQSchema,
  generateItemListSchema,
  generateWebApplicationSchema,
} from '@/lib/seoUtils';

/**
 * Breadcrumb schema component.
 * 
 * @param {Object} props
 * @param {Array<{name: string, url: string}>} props.items - Breadcrumb items
 */
export function BreadcrumbSchema({ items }) {
  if (!items || items.length === 0) return null;
  const schema = generateBreadcrumbSchema(items);
  return <SchemaOrg schema={schema} />;
}

/**
 * Vehicle schema component for car detail pages.
 * 
 * @param {Object} props
 * @param {Object} props.car - Car object from database
 */
export function VehicleSchema({ car }) {
  if (!car) return null;
  const schema = generateVehicleSchema(car);
  return <SchemaOrg schema={schema} />;
}

/**
 * Event schema component for event detail pages.
 * 
 * @param {Object} props
 * @param {Object} props.event - Event object from database
 */
export function EventSchema({ event }) {
  if (!event) return null;
  const schema = generateEventSchema(event);
  return <SchemaOrg schema={schema} />;
}

/**
 * Article schema component for educational content.
 * 
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} props.path
 * @param {string} [props.datePublished]
 * @param {string} [props.dateModified]
 * @param {string[]} [props.keywords]
 */
export function ArticleSchema({ title, description, path, datePublished, dateModified, keywords }) {
  const schema = generateArticleSchema({ title, description, path, datePublished, dateModified, keywords });
  return <SchemaOrg schema={schema} />;
}

/**
 * FAQ schema component.
 * 
 * @param {Object} props
 * @param {Array<{question: string, answer: string}>} props.faqs
 */
export function FAQSchema({ faqs }) {
  if (!faqs || faqs.length === 0) return null;
  const schema = generateFAQSchema(faqs);
  return <SchemaOrg schema={schema} />;
}

/**
 * ItemList schema component for browse/listing pages.
 * 
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.description
 * @param {Array<{name: string, url: string}>} props.items
 */
export function ItemListSchema({ name, description, items }) {
  if (!items || items.length === 0) return null;
  const schema = generateItemListSchema({ name, description, items });
  return <SchemaOrg schema={schema} />;
}

/**
 * WebApplication schema component for tools/apps.
 * 
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.description
 * @param {string} props.path
 * @param {string} [props.applicationCategory]
 */
export function WebApplicationSchema({ name, description, path, applicationCategory }) {
  const schema = generateWebApplicationSchema({ name, description, path, applicationCategory });
  return <SchemaOrg schema={schema} />;
}












