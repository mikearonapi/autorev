/**
 * Article Category Page
 * 
 * Dynamic page for each article category:
 * - /articles/comparisons - Comparisons & Buyer Guides
 * - /articles/enthusiast - Car Culture & Industry
 * - /articles/technical - Mods & Technical Guides
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchArticles, ARTICLE_CATEGORIES, getArticleUrl, formatReadTime } from '@/lib/articlesService';
import { ArticleIcon } from '@/components/ArticleIcons';
import styles from './page.module.css';

// Valid categories
const VALID_CATEGORIES = ['comparisons', 'enthusiast', 'technical', 'pitlane'];

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(category => ({ category }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categoryInfo = ARTICLE_CATEGORIES[category];
  
  if (!categoryInfo) {
    return { title: 'Articles | AutoRev' };
  }

  const canonicalUrl = `https://autorev.app/articles/${category}`;
  const seoTitle = `${categoryInfo.name} Articles | AutoRev`;

  return {
    title: seoTitle,
    description: categoryInfo.description,
    keywords: [
      categoryInfo.name,
      'automotive articles',
      'car guides',
      'sports cars',
      ...Object.values(categoryInfo.subcategories || {}).map(s => s.name),
    ].filter(Boolean).join(', '),
    
    // Open Graph - Optimized for Facebook
    openGraph: {
      title: seoTitle,
      description: categoryInfo.description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'AutoRev',
      locale: 'en_US',
      images: [{
        url: 'https://autorev.app/og-articles.png',
        width: 1200,
        height: 630,
        alt: `${categoryInfo.name} - AutoRev Articles`,
      }],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@AutoRevApp',
      title: seoTitle,
      description: categoryInfo.description,
      images: ['https://autorev.app/og-articles.png'],
    },
    
    alternates: {
      canonical: canonicalUrl,
    },
    
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const revalidate = 600;

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params;
  const searchParamsData = await searchParams;
  const subcategoryFilter = searchParamsData?.sub;
  
  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const categoryInfo = ARTICLE_CATEGORIES[category];
  
  // Fetch articles
  const { data: articles, error } = await fetchArticles({
    category,
    subcategory: subcategoryFilter,
    limit: 24,
  });

  if (error) {
    console.error('[CategoryPage] Error:', error);
  }

  // Separate featured and regular
  const featuredArticles = (articles || []).filter(a => a.is_featured);
  const regularArticles = (articles || []).filter(a => !a.is_featured);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.categoryIcon}>
            <ArticleIcon iconId={categoryInfo.iconId} size={48} />
          </span>
          <h1 className={styles.heroTitle}>{categoryInfo.name}</h1>
          <p className={styles.heroSubtitle}>{categoryInfo.description}</p>
        </div>
      </section>

      {/* Subcategory Filter */}
      <nav className={styles.filterNav}>
        <div className={styles.filterInner}>
          <Link 
            href="/articles/all"
            className={styles.allArticlesBtn}
            title="View all articles"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>All Articles</span>
          </Link>
          <span className={styles.filterDivider} />
          <Link 
            href={`/articles/${category}`}
            className={`${styles.filterLink} ${!subcategoryFilter ? styles.active : ''}`}
          >
            All
          </Link>
          {Object.entries(categoryInfo.subcategories).map(([key, sub]) => (
            <Link
              key={key}
              href={`/articles/${category}?sub=${key}`}
              className={`${styles.filterLink} ${subcategoryFilter === key ? styles.active : ''}`}
            >
              <ArticleIcon iconId={sub.iconId} size={16} />
              <span>{sub.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className={styles.content}>
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Featured
            </h2>
            <div className={styles.featuredGrid}>
              {featuredArticles.map(article => (
                <ArticleCard key={article.id} article={article} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Articles */}
        <section className={styles.section}>
          {subcategoryFilter && (
            <div className={styles.filterTag}>
              Filtered: {categoryInfo.subcategories[subcategoryFilter]?.name || subcategoryFilter}
              <Link href={`/articles/${category}`} className={styles.clearFilter}>✕</Link>
            </div>
          )}
          
          {regularArticles.length > 0 ? (
            <div className={styles.grid}>
              {regularArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <ArticleIcon iconId={categoryInfo.iconId} size={48} />
              <p>No articles yet in this category.</p>
              <span className={styles.emptyHint}>Check back soon for new content!</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ArticleCard({ article, featured = false }) {
  const category = ARTICLE_CATEGORIES[article.category];
  const subcategory = category?.subcategories?.[article.subcategory];
  
  return (
    <Link 
      href={getArticleUrl(article)}
      className={`${styles.card} ${featured ? styles.featured : ''}`}
    >
      <div className={styles.cardImage}>
        {article.hero_image_url ? (
          <Image
            src={`${article.hero_image_url}?v=${new Date(article.updated_at).getTime()}`}
            alt={article.title}
            fill
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <ArticleIcon iconId={category?.iconId || 'article'} size={48} />
          </div>
        )}
        {subcategory && (
          <span className={styles.subcategoryBadge}>
            <ArticleIcon iconId={subcategory.iconId} size={14} />
            <span>{subcategory.name}</span>
          </span>
        )}
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{article.title}</h3>
        {article.excerpt && (
          <p className={styles.cardExcerpt}>
            {article.excerpt.length > 140 
              ? `${article.excerpt.slice(0, 140)}...` 
              : article.excerpt}
          </p>
        )}
        <div className={styles.cardMeta}>
          <span className={styles.author}>By {article.author_name || 'AL'}</span>
          <span className={styles.readTime}>{formatReadTime(article.read_time_minutes)}</span>
        </div>
      </div>
    </Link>
  );
}

