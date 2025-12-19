'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

export default function VariantMaintenanceOverridesPage() {
  const [adminKey, setAdminKey] = useState('');
  const [variantKey, setVariantKey] = useState('');

  const [sourceUrl, setSourceUrl] = useState('');
  const [confidence, setConfidence] = useState('');
  const [verified, setVerified] = useState(false);

  const [overrideJsonText, setOverrideJsonText] = useState('{\n  \n}');
  const [loaded, setLoaded] = useState(null);
  const [merged, setMerged] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean(adminKey && variantKey && variantKey.trim().length >= 3);
  }, [adminKey, variantKey]);

  async function handleLoad(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setLoaded(null);
    setMerged(null);

    try {
      const res = await fetch(`/api/internal/maintenance/variant-overrides?variantKey=${encodeURIComponent(variantKey.trim())}`, {
        headers: { 'x-internal-admin-key': adminKey },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to load');

      setLoaded(json?.override || null);
      setMerged(json?.merged || null);

      if (json?.override?.overrides) {
        setOverrideJsonText(JSON.stringify(json.override.overrides, null, 2));
      } else {
        setOverrideJsonText('{\n  \n}');
      }

      setSourceUrl(json?.override?.source_url || '');
      setConfidence(json?.override?.confidence ?? '');
      setVerified(Boolean(json?.override?.verified));

      setMessage({ type: 'success', text: 'Loaded.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let overrides = null;
      try {
        overrides = JSON.parse(overrideJsonText || '{}');
      } catch {
        throw new Error('Overrides must be valid JSON');
      }
      if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
        throw new Error('Overrides JSON must be an object');
      }

      const payload = {
        variantKey: variantKey.trim(),
        overrides,
        sourceUrl: sourceUrl || null,
        confidence: confidence === '' ? null : Number(confidence),
        verified: Boolean(verified),
      };

      const res = await fetch('/api/internal/maintenance/variant-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to save');

      setLoaded(json?.override || null);

      // Refresh merged summary after save
      const mergedRes = await fetch(`/api/internal/maintenance/variant-overrides?variantKey=${encodeURIComponent(variantKey.trim())}`, {
        headers: { 'x-internal-admin-key': adminKey },
      });
      const mergedJson = await mergedRes.json().catch(() => ({}));
      if (mergedRes.ok) setMerged(mergedJson?.merged || null);

      setMessage({ type: 'success', text: 'Saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal: Variant Maintenance Overrides</h1>
        <p>
          Store small JSON overrides keyed by <code>car_variants.variant_key</code> to make maintenance specs accurate for specific years/trims.
        </p>
      </header>

      <form className={styles.form}>
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
            <div className={styles.hint}>Sent as header <code>x-internal-admin-key</code>.</div>
          </div>

          <div className={styles.formGroup}>
            <label>Variant Key</label>
            <input
              value={variantKey}
              onChange={(e) => setVariantKey(e.target.value)}
              placeholder="e.g. audi-rs3-8v-2018-awd-dsg"
              required
            />
            <div className={styles.hint}>Use VIN match output, or query internal variants list.</div>
          </div>

          <div className={styles.formGroup}>
            <label>Source URL (optional)</label>
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label>Confidence (0..1)</label>
            <input value={confidence} onChange={(e) => setConfidence(e.target.value)} placeholder="0.85" />
          </div>

          <div className={styles.formGroupInline}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
              Verified
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button type="button" disabled={!canSubmit || loading} onClick={handleLoad}>
              {loading ? 'Loading…' : 'Load'}
            </button>
            <button type="button" className={styles.primary} disabled={!canSubmit || loading} onClick={handleSave}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Overrides JSON (object)</label>
          <textarea
            value={overrideJsonText}
            onChange={(e) => setOverrideJsonText(e.target.value)}
            rows={14}
            spellCheck={false}
          />
          <div className={styles.hint}>
            Top-level keys should match summary keys like <code>oil</code>, <code>coolant</code>, <code>brake_fluid</code>, <code>fuel</code>, <code>tires</code>.
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
      </form>

      <section className={styles.section}>
        <h2>Current Override Row</h2>
        <pre className={styles.pre}>{loaded ? JSON.stringify(loaded, null, 2) : '—'}</pre>
      </section>

      <section className={styles.section}>
        <h2>Merged Maintenance Summary (RPC)</h2>
        <pre className={styles.pre}>{merged ? JSON.stringify(merged, null, 2) : '—'}</pre>
      </section>
    </div>
  );
}







