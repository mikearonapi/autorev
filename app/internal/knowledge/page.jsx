'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

export default function KnowledgeIngestPage() {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState('');

  const [sourceType, setSourceType] = useState('editorial_review');
  const [topic, setTopic] = useState('editorial_review');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [text, setText] = useState('');

  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean(adminKey && sourceType && text && text.trim().length >= 200);
  }, [adminKey, sourceType, text]);

  useEffect(() => {
    async function loadCars() {
      try {
        const res = await fetch('/api/cars?limit=200');
        const data = await res.json();
        setCars(data.cars || []);
      } catch (err) {
        // ignore
      }
    }
    loadCars();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/internal/knowledge/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({
          sourceType,
          sourceUrl: sourceUrl || null,
          sourceTitle: sourceTitle || null,
          carSlug: selectedCar || null,
          topic: topic || null,
          text,
          metadata: {
            source: 'internal-ui',
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to ingest');

      setMessage({ type: 'success', text: `Indexed ${json.chunks} chunks (document ${json.documentId}).` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal: Knowledge Ingest</h1>
        <p>
          Paste an excerpt (or full text you have rights to use), and we’ll index it into the knowledge base so AL can cite it.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label>Admin Key</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="INTERNAL_ADMIN_KEY"
              required
            />
            <div className={styles.hint}>Sent as header `x-internal-admin-key`.</div>
          </div>

          <div className={styles.formGroup}>
            <label>Car (optional)</label>
            <select value={selectedCar} onChange={(e) => setSelectedCar(e.target.value)}>
              <option value="">-- none --</option>
              {cars.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Source Type</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="editorial_review">editorial_review</option>
              <option value="forum_post">forum_post</option>
              <option value="whitepaper">whitepaper</option>
              <option value="manual_note">manual_note</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="editorial_review" />
          </div>

          <div className={styles.formGroup}>
            <label>Source Title</label>
            <input value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="e.g. Car and Driver – 2022 RS3 Review" />
          </div>

          <div className={styles.formGroup}>
            <label>Source URL</label>
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Text (min 200 chars)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            placeholder="Paste text here (make sure you have rights to store/index it)."
            required
          />
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <button disabled={!canSubmit || loading} type="submit">
          {loading ? 'Indexing…' : 'Ingest + Index'}
        </button>
      </form>
    </div>
  );
}















