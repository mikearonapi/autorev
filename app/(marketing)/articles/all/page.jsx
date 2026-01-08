/**
 * All Articles Page
 * 
 * Shows all AL articles across all categories in a unified view.
 * Features:
 * - Grid and list view toggle
 * - Sort by date or category
 * - Filter by category
 */

import Link from 'next/link';
import Image from 'next/image';
import { fetchArticles, fetchArticleCounts, ARTICLE_CATEGORIES, getArticleUrl, formatReadTime } from '@/lib/articlesService';
import { ArticleIcon } from '@/components/ArticleIcons';
import styles from './page.module.css';

export const metadata = {
  title: 'All Articles | AL Reviews | AutoRev',
  description: 'Browse all expert car articles, comparisons, buyer guides, enthusiast content, and technical guides from AL, your AI automotive expert.',
  openGraph: {
    title: 'All Articles | AL Reviews | AutoRev',
    description: 'Browse all expert car articles from AL.',
    type: 'website',
  },
};

export const revalidate = 600;

export default async function AllArticlesPage({ searchParams }) {
  const params = await searchParams;
  const categoryFilter = params?.category || null;
  const viewMode = params?.view || 'grid';

  // Fetch all articles
  const { data: allArticles, error } = await fetchArticles({
    category: categoryFilter,
    limit: 100,
  });

  const { data: counts } = await fetchArticleCounts();

  if (error) {
    console.error('[AllArticlesPage] Error:', error);
  }

  const articles = allArticles || [];
  const totalCount = counts?.total || articles.length;

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            All <span className={styles.accent}>Articles</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {totalCount} expert articles from AL, your AI automotive expert
          </p>
        </div>
      </section>

      {/* Filter & View Controls */}
      <nav className={styles.controlNav}>
        <div className={styles.controlInner}>
          {/* Back Link + Category Filters */}
          <div className={styles.filterGroup}>
            <Link 
              href="/articles"
              className={styles.backChip}
              title="Back to Articles Hub"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Hub</span>
            </Link>
            <span className={styles.filterDivider} />
            <Link 
              href="/articles/all"
              className={`${styles.filterChip} ${!categoryFilter ? styles.active : ''}`}
            >
              All ({totalCount})
            </Link>
            {Object.values(ARTICLE_CATEGORIES).map(category => (
              <Link
                key={category.id}
                href={`/articles/all?category=${category.id}${viewMode !== 'grid' ? `&view=${viewMode}` : ''}`}
                className={`${styles.filterChip} ${categoryFilter === category.id ? styles.active : ''}`}
              >
                <ArticleIcon iconId={category.iconId} size={14} />
                <span>{category.shortName}</span>
                <span className={styles.chipCount}>{counts?.[category.id] || 0}</span>
              </Link>
            ))}
          </div>

          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <Link 
              href={`/articles/all${categoryFilter ? `?category=${categoryFilter}&` : '?'}view=grid`}
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              title="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </Link>
            <Link 
              href={`/articles/all${categoryFilter ? `?category=${categoryFilter}&` : '?'}view=list`}
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              title="List view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Articles */}
      <div className={styles.content}>
        {categoryFilter && (
          <div className={styles.filterTag}>
            Showing: {ARTICLE_CATEGORIES[categoryFilter]?.name || categoryFilter}
            <Link href={`/articles/all${viewMode !== 'grid' ? `?view=${viewMode}` : ''}`} className={styles.clearFilter}>✕</Link>
          </div>
        )}

        {articles.length > 0 ? (
          viewMode === 'list' ? (
            <div className={styles.listView}>
              {articles.map(article => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className={styles.gridView}>
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )
        ) : (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p>No articles found.</p>
            <span className={styles.emptyHint}>Check back soon for new content!</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }) {
  const category = ARTICLE_CATEGORIES[article.category];
  const subcategory = category?.subcategories?.[article.subcategory];
  
  return (
    <Link href={getArticleUrl(article)} className={styles.card}>
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
            <ArticleIcon iconId={category?.iconId || 'article'} size={40} />
          </div>
        )}
        {subcategory && (
          <span className={styles.badge}>
            <ArticleIcon iconId={subcategory.iconId} size={12} />
            <span>{subcategory.name}</span>
          </span>
        )}
        <span className={styles.categoryTag}>
          <ArticleIcon iconId={category?.iconId || 'article'} size={12} />
          {category?.shortName || 'Article'}
        </span>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{article.title}</h3>
        {article.excerpt && (
          <p className={styles.cardExcerpt}>
            {article.excerpt.length > 100 ? `${article.excerpt.slice(0, 100)}...` : article.excerpt}
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

function ArticleRow({ article }) {
  const category = ARTICLE_CATEGORIES[article.category];
  const subcategory = category?.subcategories?.[article.subcategory];
  const publishDate = article.published_at 
    ? new Date(article.published_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : null;
  
  return (
    <Link href={getArticleUrl(article)} className={styles.row}>
      {/* Thumbnail */}
      <div className={styles.rowImage}>
        {article.hero_image_url ? (
          <Image
            src={`${article.hero_image_url}?v=${new Date(article.updated_at).getTime()}`}
            alt={article.title}
            fill
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <ArticleIcon iconId={category?.iconId || 'article'} size={28} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.rowContent}>
        <div className={styles.rowHeader}>
          <span className={styles.rowCategory}>
            <ArticleIcon iconId={category?.iconId || 'article'} size={14} />
            {category?.shortName || 'Article'}
          </span>
          {subcategory && (
            <span className={styles.rowSubcategory}>
              <ArticleIcon iconId={subcategory.iconId} size={12} />
              {subcategory.name}
            </span>
          )}
        </div>
        
        <h3 className={styles.rowTitle}>{article.title}</h3>
        
        {article.excerpt && (
          <p className={styles.rowExcerpt}>
            {article.excerpt.length > 160 ? `${article.excerpt.slice(0, 160)}...` : article.excerpt}
          </p>
        )}
        
        <div className={styles.rowMeta}>
          <span className={styles.author}>By {article.author_name || 'AL'}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.readTime}>{formatReadTime(article.read_time_minutes)}</span>
          {publishDate && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.date}>{publishDate}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className={styles.rowArrow}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

