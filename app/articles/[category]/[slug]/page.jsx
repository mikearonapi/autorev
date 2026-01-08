/**
 * Individual Article Page
 * 
 * Routes:
 * - /articles/comparisons/[slug] - Comparison & Buyer Guide articles
 * - /articles/enthusiast/[slug] - Car Culture & Industry articles
 * - /articles/technical/[slug] - Mods & Technical Guide articles
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  fetchArticleBySlug, 
  fetchRelatedArticles,
  ARTICLE_CATEGORIES,
  getArticleUrl,
  formatReadTime 
} from '@/lib/articlesService';
import { ArticleIcon } from '@/components/ArticleIcons';
import ArticleShareButtons from '@/components/ArticleShareButtons';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
  const { category, slug } = await params;
  
  const { data: article } = await fetchArticleBySlug(slug, category);
  
  if (!article) {
    return { title: 'Article Not Found | AutoRev' };
  }

  const categoryInfo = ARTICLE_CATEGORIES[category];
  const seoTitle = article.seo_title || article.title;
  const description = article.meta_description || article.excerpt || `Read ${article.title} on AutoRev - expert automotive content for enthusiasts.`;
  const canonicalUrl = `https://autorev.app${getArticleUrl(article)}`;
  
  // Ensure images array has proper format for social sharing
  const ogImages = article.hero_image_url 
    ? [{
        url: article.hero_image_url,
        width: 1200,
        height: 630,
        alt: article.title,
        type: 'image/png',
      }]
    : [{
        url: 'https://autorev.app/og-default.png',
        width: 1200,
        height: 630,
        alt: 'AutoRev - Expert Automotive Content',
      }];

  return {
    title: `${seoTitle} | AutoRev`,
    description,
    keywords: [
      ...(article.tags || []),
      categoryInfo?.name,
      'automotive',
      'cars',
      'sports cars',
      article.subcategory?.replace(/_/g, ' '),
    ].filter(Boolean).join(', '),
    authors: [{ name: article.author_name || 'AL (AutoRev Intelligence)' }],
    creator: 'AutoRev',
    publisher: 'AutoRev',
    
    // Open Graph - Optimized for Facebook and Facebook Groups
    openGraph: {
      title: seoTitle,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'AutoRev',
      locale: 'en_US',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [article.author_name || 'AL (AutoRev Intelligence)'],
      section: categoryInfo?.name || 'Automotive',
      tags: article.tags || [],
      images: ogImages,
    },
    
    // Twitter Card - Large image for visual impact
    twitter: {
      card: 'summary_large_image',
      site: '@AutoRevApp',
      creator: '@AutoRevApp',
      title: seoTitle,
      description,
      images: ogImages,
    },
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

// Structured data for SEO - Enhanced for Google rich results and social sharing
function ArticleJsonLd({ article, category, canonicalUrl }) {
  const categoryInfo = ARTICLE_CATEGORIES[category];
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': canonicalUrl,
    headline: article.title,
    alternativeHeadline: article.seo_title || article.title,
    description: article.meta_description || article.excerpt,
    image: article.hero_image_url ? {
      '@type': 'ImageObject',
      url: article.hero_image_url,
      width: 1200,
      height: 630,
    } : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: article.author_name || 'AL (AutoRev Intelligence)',
      url: 'https://autorev.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AutoRev',
      url: 'https://autorev.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://autorev.app/logo.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    articleSection: categoryInfo?.name || 'Automotive',
    keywords: (article.tags || []).join(', '),
    wordCount: article.word_count || Math.round((article.read_time_minutes || 3) * 200),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    potentialAction: {
      '@type': 'ReadAction',
      target: canonicalUrl,
    },
  };

  // BreadcrumbList for navigation context
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Articles',
        item: 'https://autorev.app/articles',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryInfo?.name || category,
        item: `https://autorev.app/articles/${category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

// Reduced revalidation for faster updates
export const revalidate = 60;

export default async function ArticlePage({ params }) {
  const { category, slug } = await params;
  
  // Validate category
  if (!ARTICLE_CATEGORIES[category]) {
    notFound();
  }

  // Fetch article
  const { data: article, error } = await fetchArticleBySlug(slug, category);
  
  if (error || !article) {
    notFound();
  }

  const categoryInfo = ARTICLE_CATEGORIES[category];
  const subcategoryInfo = categoryInfo.subcategories?.[article.subcategory];

  // Fetch related articles
  const { data: relatedArticles } = await fetchRelatedArticles(article.id, category, 3);

  const canonicalUrl = `https://autorev.app${getArticleUrl(article)}`;

  return (
    <>
      <ArticleJsonLd article={article} category={category} canonicalUrl={canonicalUrl} />
      
      <article className={styles.article}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs}>
              <Link href="/articles">Articles</Link>
              <span className={styles.separator}>/</span>
              <Link href={`/articles/${category}`}>{categoryInfo.name}</Link>
              {subcategoryInfo && (
                <>
                  <span className={styles.separator}>/</span>
                  <Link href={`/articles/${category}?sub=${article.subcategory}`}>
                    {subcategoryInfo.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Meta Badges */}
            <div className={styles.badges}>
              <span className={styles.categoryBadge}>
                <ArticleIcon iconId={categoryInfo.iconId} size={16} />
                <span>{categoryInfo.name}</span>
              </span>
              {subcategoryInfo && (
                <span className={styles.subcategoryBadge}>
                  <ArticleIcon iconId={subcategoryInfo.iconId} size={14} />
                  <span>{subcategoryInfo.name}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className={styles.title}>{article.title}</h1>
            
            {article.excerpt && (
              <p className={styles.excerpt}>{article.excerpt}</p>
            )}

            {/* Article Meta */}
            <div className={styles.meta}>
              <span className={styles.author}>
                By {article.author_name || 'AL (AutoRev Intelligence)'}
              </span>
              <span className={styles.divider}>•</span>
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className={styles.divider}>•</span>
              <span>{formatReadTime(article.read_time_minutes)}</span>
            </div>
          </div>
        </header>

        {/* Hero Image - Only show approved images */}
        {article.hero_image_url && article.image_qa_status !== 'rejected' && (
          <div className={styles.heroImage}>
            <Image
              src={`${article.hero_image_url}?v=${new Date(article.updated_at).getTime()}`}
              alt={article.title}
              fill
              priority
              className={styles.image}
            />
          </div>
        )}

        {/* Content */}
        <div className={styles.contentWrapper}>
          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: article.content_html || article.content }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className={styles.tags}>
              {article.tags.map(tag => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Social Share Buttons */}
          <ArticleShareButtons 
            title={article.seo_title || article.title}
            description={article.meta_description || article.excerpt}
            url={canonicalUrl}
          />

          {/* Author Box */}
          <div className={styles.authorBox}>
            <div className={styles.authorAvatar}>
              <span>AL</span>
            </div>
            <div className={styles.authorInfo}>
              <h4>Written by {article.author_name || 'AL (AutoRev Intelligence)'}</h4>
              <p>
                AL is AutoRev's AI assistant, helping enthusiasts make informed decisions 
                about their vehicles with data-driven insights and expert analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className={styles.related}>
            <div className={styles.relatedInner}>
              <h2>Related Articles</h2>
              <div className={styles.relatedGrid}>
                {relatedArticles.map(related => (
                  <Link 
                    key={related.id} 
                    href={getArticleUrl(related)}
                    className={styles.relatedCard}
                  >
                    <div className={styles.relatedImage}>
                      {related.hero_image_url ? (
                        <Image
                          src={`${related.hero_image_url}?v=${new Date(related.updated_at).getTime()}`}
                          alt={related.title}
                          fill
                          className={styles.image}
                        />
                      ) : (
                        <div className={styles.relatedPlaceholder}>
                          <ArticleIcon iconId={categoryInfo.iconId} size={32} />
                        </div>
                      )}
                    </div>
                    <div className={styles.relatedContent}>
                      <h3>{related.title}</h3>
                      <span className={styles.relatedMeta}>
                        {formatReadTime(related.read_time_minutes)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h3>Ready to explore?</h3>
            <p>Find your perfect car with AutoRev's AI-powered search.</p>
            <Link href="/car-search" className={styles.ctaButton}>
              Start Searching →
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}

