/**
 * AL Articles Hub
 * 
 * Main landing page for all AL-branded content.
 * Inspired by Car and Driver and Jalopnik.
 * 
 * Categories:
 * - Comparisons & Buyer Guides (Car Search persona)
 * - Enthusiast (My Garage persona)
 * - Technical & Mods (Tuning Shop persona)
 */

import Link from 'next/link';
import Image from 'next/image';
import { fetchArticles, fetchArticleCounts, ARTICLE_CATEGORIES, getArticleUrl, formatReadTime } from '@/lib/articlesService';
import { ArticleIcon } from '@/components/ArticleIcons';
import styles from './page.module.css';

export const metadata = {
  title: 'Expert Automotive Articles & Reviews | AutoRev',
  description: 'Expert car comparisons, buyer guides, enthusiast content, and technical modification guides. Find your perfect sports car with data-driven insights.',
  keywords: 'car reviews, automotive articles, sports car comparisons, buyer guides, car modifications, car culture, automotive enthusiast',
  
  // Open Graph - Optimized for Facebook and Facebook Groups
  openGraph: {
    title: 'Expert Automotive Articles & Reviews | AutoRev',
    description: 'Expert car comparisons, buyer guides, enthusiast content, and technical guides for automotive enthusiasts.',
    type: 'website',
    url: 'https://autorev.app/articles',
    siteName: 'AutoRev',
    locale: 'en_US',
    images: [{
      url: 'https://autorev.app/og-articles.png',
      width: 1200,
      height: 630,
      alt: 'AutoRev - Expert Automotive Articles & Reviews',
    }],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@AutoRevApp',
    title: 'Expert Automotive Articles & Reviews | AutoRev',
    description: 'Expert car comparisons, buyer guides, and technical guides for automotive enthusiasts.',
    images: ['https://autorev.app/og-articles.png'],
  },
  
  alternates: {
    canonical: 'https://autorev.app/articles',
  },
  
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 600; // Revalidate every 10 minutes

export default async function ArticlesHubPage() {
  // Fetch articles for each category
  const [
    { data: comparisonsArticles },
    { data: enthusiastArticles },
    { data: technicalArticles },
    { data: pitlaneArticles },
    { data: counts },
  ] = await Promise.all([
    fetchArticles({ category: 'comparisons', limit: 4 }),
    fetchArticles({ category: 'enthusiast', limit: 4 }),
    fetchArticles({ category: 'technical', limit: 4 }),
    fetchArticles({ category: 'pitlane', limit: 4 }),
    fetchArticleCounts(),
  ]);

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Expert Reviews & <span className={styles.accent}>Guides</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Comparisons, buyer guides, enthusiast content, and technical deep-dives 
            from AL, your AI automotive expert.
          </p>
        </div>
      </section>

      {/* Category Navigation */}
      <nav className={styles.categoryNav}>
        <div className={styles.categoryNavInner}>
          {/* All Articles Link */}
          <Link 
            href="/articles/all"
            className={`${styles.categoryNavLink} ${styles.allArticlesLink}`}
          >
            <span className={styles.categoryNavIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span className={styles.categoryNavName}>All</span>
            <span className={styles.categoryNavCount}>{counts?.total || 0}</span>
          </Link>
          
          {Object.values(ARTICLE_CATEGORIES).map(category => (
            <Link 
              key={category.id}
              href={`/articles/${category.id}`}
              className={styles.categoryNavLink}
            >
              <span className={styles.categoryNavIcon}>
                <ArticleIcon iconId={category.iconId} size={18} />
              </span>
              <span className={styles.categoryNavName}>{category.shortName}</span>
              <span className={styles.categoryNavCount}>{counts?.[category.id] || 0}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className={styles.content}>
        {/* Comparisons Section */}
        <section className={styles.section}>
          <CategoryHeader 
            category={ARTICLE_CATEGORIES.comparisons}
            count={counts?.comparisons}
          />
          <div className={styles.grid}>
            {(comparisonsArticles || []).map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                featured={index === 0}
              />
            ))}
          </div>
          {(comparisonsArticles || []).length === 0 && (
            <EmptyState category="comparisons" />
          )}
        </section>

        {/* Enthusiast Section */}
        <section className={styles.section}>
          <CategoryHeader 
            category={ARTICLE_CATEGORIES.enthusiast}
            count={counts?.enthusiast}
          />
          <div className={styles.grid}>
            {(enthusiastArticles || []).map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                featured={index === 0}
              />
            ))}
          </div>
          {(enthusiastArticles || []).length === 0 && (
            <EmptyState category="enthusiast" />
          )}
        </section>

        {/* Technical Section */}
        <section className={styles.section}>
          <CategoryHeader 
            category={ARTICLE_CATEGORIES.technical}
            count={counts?.technical}
          />
          <div className={styles.grid}>
            {(technicalArticles || []).map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                featured={index === 0}
              />
            ))}
          </div>
          {(technicalArticles || []).length === 0 && (
            <EmptyState category="technical" />
          )}
        </section>

        {/* Pit Lane (Humor) Section */}
        <section className={styles.section}>
          <CategoryHeader 
            category={ARTICLE_CATEGORIES.pitlane}
            count={counts?.pitlane}
          />
          <div className={styles.grid}>
            {(pitlaneArticles || []).map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                featured={index === 0}
              />
            ))}
          </div>
          {(pitlaneArticles || []).length === 0 && (
            <EmptyState category="pitlane" />
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryHeader({ category, count }) {
  return (
    <div className={styles.categoryHeader}>
      <div className={styles.categoryInfo}>
        <span className={styles.categoryIcon}>
          <ArticleIcon iconId={category.iconId} size={32} />
        </span>
        <div>
          <h2 className={styles.categoryTitle}>{category.name}</h2>
          <p className={styles.categoryDescription}>{category.description}</p>
        </div>
      </div>
      <Link href={`/articles/${category.id}`} className={styles.viewAllLink}>
        View all {count > 0 && `(${count})`} →
      </Link>
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
      {/* Image */}
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

      {/* Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{article.title}</h3>
        {article.excerpt && (
          <p className={styles.cardExcerpt}>
            {article.excerpt.length > 120 
              ? `${article.excerpt.slice(0, 120)}...` 
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

function EmptyState({ category }) {
  const cat = ARTICLE_CATEGORIES[category];
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        <ArticleIcon iconId={cat?.iconId || 'article'} size={40} />
      </span>
      <p>{cat?.name || 'Articles'} coming soon!</p>
      <span className={styles.emptyHint}>
        Check back later for expert content in this category.
      </span>
    </div>
  );
}

