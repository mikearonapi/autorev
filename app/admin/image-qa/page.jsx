'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';

import { createBrowserClient } from '@supabase/ssr';

import styles from './page.module.css';

export default function ImageQAPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [updating, setUpdating] = useState(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchArticles() {
    setLoading(true);
    let query = supabase
      .from('al_articles')
      .select('id, title, slug, category, hero_image_url, image_qa_status, image_qa_issues, is_published')
      .eq('is_published', true)
      .order('title');

    if (filter !== 'all') {
      query = query.eq('image_qa_status', filter);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    setArticles(data || []);
    setLoading(false);
  }

  async function updateStatus(articleId, status, issues = null) {
    setUpdating(articleId);
    
    const updateData = {
      image_qa_status: status,
      image_qa_reviewed_at: new Date().toISOString(),
    };
    
    if (issues) {
      updateData.image_qa_issues = issues;
    }

    const { error } = await supabase
      .from('al_articles')
      .update(updateData)
      .eq('id', articleId);

    if (error) {
      console.error(error);
      alert('Failed to update status');
    } else {
      fetchArticles();
    }
    setUpdating(null);
  }

  async function rejectWithIssues(article) {
    const issueOptions = [
      'car_cutoff',
      'unrealistic_proportions', 
      'artifacts',
      'wrong_car_model',
      'low_quality',
      'inappropriate_content',
      'text_in_image',
      'other'
    ];

    const selectedIssues = prompt(
      `Select issues (comma-separated numbers):\n` +
      issueOptions.map((opt, i) => `${i + 1}. ${opt.replace(/_/g, ' ')}`).join('\n') +
      `\n\nOr type custom issue:`
    );

    if (!selectedIssues) return;

    // Parse selection
    const nums = selectedIssues.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const finalIssues = nums.length > 0 
      ? nums.map(n => issueOptions[n - 1]).filter(Boolean)
      : [selectedIssues];

    await updateStatus(article.id, 'rejected', finalIssues);
  }

  const statusCounts = {
    pending: articles.filter(a => a.image_qa_status === 'pending').length,
    approved: articles.filter(a => a.image_qa_status === 'approved').length,
    rejected: articles.filter(a => a.image_qa_status === 'rejected').length,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Image QA Review</h1>
        <p>Review AI-generated article images for quality issues</p>
      </header>

      {/* Filter Tabs */}
      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({statusCounts.pending || '...'})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({statusCounts.approved || 0})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'rejected' ? styles.active : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({statusCounts.rejected || 0})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {/* QA Checklist */}
      <div className={styles.checklist}>
        <h3>QA Checklist - Check for:</h3>
        <ul>
          <li><strong>Car accuracy</strong> - Is it the correct make/model?</li>
          <li><strong>Completeness</strong> - Is the entire car visible? No cutoffs?</li>
          <li><strong>Realism</strong> - Natural proportions, no distortions?</li>
          <li><strong>Artifacts</strong> - No weird AI glitches, extra parts, or merged objects?</li>
          <li><strong>Quality</strong> - Sharp, well-lit, professional looking?</li>
          <li><strong>No text/watermarks</strong> - Clean image without embedded text?</li>
        </ul>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className={styles.loading}>Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className={styles.empty}>
          No {filter === 'all' ? '' : filter} images to review.
        </div>
      ) : (
        <div className={styles.grid}>
          {articles.map(article => (
            <div key={article.id} className={styles.card}>
              {/* Image */}
              <div className={styles.imageContainer}>
                {article.hero_image_url ? (
                  <Image
                    src={article.hero_image_url}
                    alt={article.title}
                    fill
                    className={styles.image}
                    unoptimized
                  />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
                <span className={`${styles.status} ${styles[article.image_qa_status]}`}>
                  {article.image_qa_status}
                </span>
              </div>

              {/* Info */}
              <div className={styles.info}>
                <h3>{article.title}</h3>
                <p className={styles.category}>{article.category}</p>
                
                {article.image_qa_issues && article.image_qa_issues.length > 0 && (
                  <div className={styles.issues}>
                    <strong>Issues:</strong> {article.image_qa_issues.join(', ')}
                  </div>
                )}

                {/* Actions */}
                <div className={styles.actions}>
                  <button
                    className={`${styles.btn} ${styles.approve}`}
                    onClick={() => updateStatus(article.id, 'approved')}
                    disabled={updating === article.id}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className={`${styles.btn} ${styles.reject}`}
                    onClick={() => rejectWithIssues(article)}
                    disabled={updating === article.id}
                  >
                    ✗ Reject
                  </button>
                  <a
                    href={`/articles/${article.category}/${article.slug}`}
                    target="_blank"
                    className={`${styles.btn} ${styles.view}`}
                  >
                    View Article
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

