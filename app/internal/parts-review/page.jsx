'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

function fmtPct(v) {
  const n = Number(v || 0);
  return `${Math.round(n * 100)}%`;
}

export default function PartsReviewPage() {
  const [adminKey, setAdminKey] = useState('');
  const [cars, setCars] = useState([]);
  const [carSlug, setCarSlug] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('false');
  const [fitments, setFitments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [bulkConfidence, setBulkConfidence] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSourceUrl, setBulkSourceUrl] = useState('');

  const [draftNotesById, setDraftNotesById] = useState(() => ({}));
  const [draftSourceById, setDraftSourceById] = useState(() => ({}));

  const canLoad = useMemo(() => Boolean(adminKey), [adminKey]);

  useEffect(() => {
    async function loadCars() {
      try {
        const res = await fetch('/api/cars?limit=200');
        const data = await res.json();
        setCars(data.cars || []);
      } catch {
        // ignore
      }
    }
    loadCars();
  }, []);

  async function loadFitments() {
    if (!adminKey) return;
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams();
      if (carSlug) qs.set('carSlug', carSlug);
      if (verifiedFilter) qs.set('verified', verifiedFilter);
      qs.set('limit', '120');

      const res = await fetch(`/api/internal/parts/fitments?${qs.toString()}`, {
        headers: { 'x-internal-admin-key': adminKey },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load fitments');
      setFitments(json.fitments || []);
      setSelectedIds(new Set());
      setDraftNotesById(Object.create(null));
      setDraftSourceById(Object.create(null));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function updateFitment(id, patch) {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/internal/parts/fitments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');

      setFitments((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...json.fitment } : f))
      );
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function updateFitmentsBulk(ids, patch) {
    if (!adminKey || !Array.isArray(ids) || ids.length === 0) return;
    try {
      const res = await fetch('/api/internal/parts/fitments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({ ids, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Bulk update failed');

      const updated = Array.isArray(json.fitments) ? json.fitments : (json.fitment ? [json.fitment] : []);
      if (updated.length === 0) return;

      const byId = new Map(updated.map((u) => [u.id, u]));
      setFitments((prev) => prev.map((f) => (byId.has(f.id) ? { ...f, ...byId.get(f.id) } : f)));
      setMessage({ type: 'success', text: `Updated ${updated.length} fitments.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  const selectedCount = selectedIds.size;
  const allSelected = fitments.length > 0 && selectedIds.size === fitments.length;

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (fitments.length === 0) return prev;
      if (prev.size === fitments.length) return new Set();
      return new Set(fitments.map((f) => f.id));
    });
  }

  const selectedIdList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal: Parts Fitment Review</h1>
        <p>Review ingested fitments, confirm, and mark verified. This improves AL accuracy for “what fits my car?”</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.control}>
          <label>Admin Key</label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="INTERNAL_ADMIN_KEY"
          />
        </div>

        <div className={styles.control}>
          <label>Car</label>
          <select value={carSlug} onChange={(e) => setCarSlug(e.target.value)}>
            <option value="">-- all cars --</option>
            {cars.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.control}>
          <label>Verified</label>
          <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
            <option value="false">Unverified</option>
            <option value="true">Verified</option>
            <option value="">All</option>
          </select>
        </div>

        <div className={styles.control}>
          <label>&nbsp;</label>
          <button disabled={!canLoad || loading} onClick={loadFitments}>
            {loading ? 'Loading…' : 'Load fitments'}
          </button>
        </div>
      </div>

      <div className={styles.bulkBar}>
        <div className={styles.bulkLeft}>
          <div className={styles.bulkTitle}>Bulk actions</div>
          <div className={styles.bulkHint}>
            Selected: <strong>{selectedCount}</strong> / {fitments.length}
          </div>
        </div>

        <div className={styles.bulkFields}>
          <div className={styles.bulkField}>
            <label>Confidence</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={bulkConfidence}
              onChange={(e) => setBulkConfidence(e.target.value)}
              placeholder="(leave blank)"
            />
          </div>
          <div className={styles.bulkField}>
            <label>Notes</label>
            <input
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              placeholder="Optional audit note"
            />
          </div>
          <div className={styles.bulkField}>
            <label>Source URL</label>
            <input
              value={bulkSourceUrl}
              onChange={(e) => setBulkSourceUrl(e.target.value)}
              placeholder="Optional source URL"
            />
          </div>
        </div>

        <div className={styles.bulkButtons}>
          <button
            className={styles.secondary}
            disabled={selectedCount === 0}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
          <button
            className={styles.secondary}
            disabled={fitments.length === 0}
            onClick={toggleSelectAll}
          >
            {allSelected ? 'Unselect all' : 'Select all'}
          </button>
          <button
            disabled={selectedCount === 0}
            onClick={() => {
              const patch = {};
              if (bulkConfidence !== '') patch.confidence = Number(bulkConfidence);
              if (bulkNotes !== '') patch.fitment_notes = bulkNotes;
              if (bulkSourceUrl !== '') patch.source_url = bulkSourceUrl;
              updateFitmentsBulk(selectedIdList, patch);
            }}
          >
            Apply fields
          </button>
          <button
            disabled={selectedCount === 0}
            onClick={() => {
              const patch = { verified: true };
              if (bulkConfidence !== '') patch.confidence = Math.max(Number(bulkConfidence), 0.85);
              else patch.confidence = 0.85;
              if (bulkNotes !== '') patch.fitment_notes = bulkNotes;
              if (bulkSourceUrl !== '') patch.source_url = bulkSourceUrl;
              updateFitmentsBulk(selectedIdList, patch);
            }}
          >
            Verify selected
          </button>
          <button
            className={styles.secondary}
            disabled={selectedCount === 0}
            onClick={() => updateFitmentsBulk(selectedIdList, { verified: false })}
          >
            Unverify selected
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.chkCol}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th>Part</th>
              <th>Category</th>
              <th>Fitment</th>
              <th>Confidence</th>
              <th>Quality</th>
              <th>Source</th>
              <th>Verify</th>
            </tr>
          </thead>
          <tbody>
            {fitments.map((f) => (
              <tr key={f.id}>
                <td className={styles.chkCol}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(f.id)}
                    onChange={() => toggleSelected(f.id)}
                    aria-label="Select row"
                  />
                </td>
                <td>
                  <div className={styles.partName}>
                    <strong>{f.parts?.brand_name ? `${f.parts.brand_name} ` : ''}{f.parts?.name}</strong>
                  </div>
                  <div className={styles.partMeta}>
                    {f.parts?.part_number ? <span>PN: {f.parts.part_number}</span> : <span>PN: —</span>}
                    {f.parts?.quality_tier ? <span>Tier: {f.parts.quality_tier}</span> : null}
                    {typeof f.parts?.street_legal === 'boolean' ? <span>Street legal: {String(f.parts.street_legal)}</span> : null}
                  </div>
                </td>
                <td>{f.parts?.category || '—'}</td>
                <td className={styles.notes}>
                  <div className={styles.editBlock}>
                    <label className={styles.smallLabel}>Notes</label>
                    <textarea
                      value={draftNotesById[f.id] ?? (f.fitment_notes || '')}
                      onChange={(e) => setDraftNotesById((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      placeholder="Fitment notes (why/what)."
                      rows={3}
                    />
                    <label className={styles.smallLabel}>Source URL</label>
                    <input
                      value={draftSourceById[f.id] ?? (f.source_url || '')}
                      onChange={(e) => setDraftSourceById((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      placeholder="https://..."
                    />
                    <div className={styles.editActions}>
                      <button
                        className={styles.secondary}
                        onClick={() => {
                          setDraftNotesById((prev) => ({ ...prev, [f.id]: f.fitment_notes || '' }));
                          setDraftSourceById((prev) => ({ ...prev, [f.id]: f.source_url || '' }));
                        }}
                      >
                        Reset
                      </button>
                      <button
                        onClick={() =>
                          updateFitment(f.id, {
                            fitment_notes: draftNotesById[f.id] ?? f.fitment_notes ?? '',
                            source_url: (draftSourceById[f.id] ?? f.source_url ?? '') || null,
                          })
                        }
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div className={styles.smallRow}>
                    <span>Requires tune: {String(Boolean(f.requires_tune))}</span>
                    <span>Install: {f.install_difficulty || '—'}</span>
                  </div>
                </td>
                <td>
                  <input
                    className={styles.confInput}
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={f.confidence ?? ''}
                    onChange={(e) => updateFitment(f.id, { confidence: e.target.value === '' ? 0 : Number(e.target.value) })}
                  />
                </td>
                <td>{fmtPct(f.qualityScore ?? 0)}</td>
                <td>
                  {f.provenance?.source_url ? (
                    <a href={f.provenance.source_url} target="_blank" rel="noreferrer">link</a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {f.verified ? (
                    <button className={styles.secondary} onClick={() => updateFitment(f.id, { verified: false })}>Unverify</button>
                  ) : (
                    <button onClick={() => updateFitment(f.id, { verified: true, confidence: Math.max(Number(f.confidence || 0), 0.85) })}>
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {fitments.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className={styles.empty}>No fitments loaded.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}



