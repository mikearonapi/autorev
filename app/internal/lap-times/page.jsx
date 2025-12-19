'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

const DEFAULT_CONDITIONS = {
  ambient_temp_c: null,
  surface_temp_c: null,
  weather: null,
  session_kind: null, // "hotlap", "time_attack", "test", etc
};

export default function LapTimesPage() {
  const [adminKey, setAdminKey] = useState('');
  const [cars, setCars] = useState([]);
  const [carSlug, setCarSlug] = useState('');

  const [trackName, setTrackName] = useState('');
  const [trackSlug, setTrackSlug] = useState('');
  const [layoutKey, setLayoutKey] = useState('');
  const [layoutName, setLayoutName] = useState('');

  const [lapTime, setLapTime] = useState('1:58.321');
  const [sessionDate, setSessionDate] = useState('');
  const [isStock, setIsStock] = useState(true);
  const [tires, setTires] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [confidence, setConfidence] = useState('0.75');
  const [notes, setNotes] = useState('');

  const [conditionsJson, setConditionsJson] = useState(JSON.stringify(DEFAULT_CONDITIONS, null, 2));
  const [modsJson, setModsJson] = useState(JSON.stringify({ mods: [] }, null, 2));

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean(adminKey && carSlug && (trackName || trackSlug) && lapTime);
  }, [adminKey, carSlug, trackName, trackSlug, lapTime]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let conditions;
      let modifications;
      try {
        conditions = JSON.parse(conditionsJson || '{}');
      } catch (err) {
        throw new Error(`Invalid conditions JSON: ${err.message}`);
      }
      try {
        modifications = JSON.parse(modsJson || '{}');
      } catch (err) {
        throw new Error(`Invalid modifications JSON: ${err.message}`);
      }

      const res = await fetch('/api/internal/track/lap-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({
          carSlug,
          trackName: trackName || null,
          trackSlug: trackSlug || null,
          layoutKey: layoutKey || null,
          layoutName: layoutName || null,
          lapTime,
          sessionDate: sessionDate || null,
          isStock,
          tires: tires || null,
          conditions,
          modifications,
          notes: notes || null,
          sourceUrl: sourceUrl || null,
          confidence: confidence === '' ? null : Number(confidence),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save lap time');

      setMessage({ type: 'success', text: `Saved lap time (${json.lapTime?.lap_time_text || lapTime}) for ${json.track?.name}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal: Track Lap Times</h1>
        <p>Manual entry for citeable lap times (with conditions + source URL) to power AL’s track answers.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label>Admin Key</label>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="INTERNAL_ADMIN_KEY" />
          </div>

          <div className={styles.formGroup}>
            <label>Car</label>
            <select value={carSlug} onChange={(e) => setCarSlug(e.target.value)} required>
              <option value="">-- select a car --</option>
              {cars.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Track Name</label>
            <input value={trackName} onChange={(e) => setTrackName(e.target.value)} placeholder="e.g. Laguna Seca" />
          </div>

          <div className={styles.formGroup}>
            <label>Track Slug (optional)</label>
            <input value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} placeholder="e.g. laguna-seca" />
          </div>

          <div className={styles.formGroup}>
            <label>Layout Key (optional)</label>
            <input value={layoutKey} onChange={(e) => setLayoutKey(e.target.value)} placeholder="e.g. gp, full, west" />
          </div>

          <div className={styles.formGroup}>
            <label>Layout Name (optional)</label>
            <input value={layoutName} onChange={(e) => setLayoutName(e.target.value)} placeholder="e.g. Full Course" />
          </div>

          <div className={styles.formGroup}>
            <label>Lap Time</label>
            <input value={lapTime} onChange={(e) => setLapTime(e.target.value)} placeholder="e.g. 1:58.321" required />
            <div className={styles.hint}>Accepted: <code>m:ss.mmm</code> or <code>ss.mmm</code></div>
          </div>

          <div className={styles.formGroup}>
            <label>Session Date (optional)</label>
            <input value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>

          <div className={styles.formGroup}>
            <label>Tires (optional)</label>
            <input value={tires} onChange={(e) => setTires(e.target.value)} placeholder="e.g. Michelin PS4S 235/35R19" />
          </div>

          <div className={styles.formGroup}>
            <label>Source URL (recommended)</label>
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label>Confidence (0..1)</label>
            <input value={confidence} onChange={(e) => setConfidence(e.target.value)} placeholder="0.75" />
          </div>

          <div className={styles.formGroupInline}>
            <label>
              <input type="checkbox" checked={isStock} onChange={(e) => setIsStock(e.target.checked)} />
              Stock car
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Conditions (JSON)</label>
          <textarea rows={8} value={conditionsJson} onChange={(e) => setConditionsJson(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label>Modifications (JSON)</label>
          <textarea rows={8} value={modsJson} onChange={(e) => setModsJson(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label>Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

        <button disabled={!canSubmit || loading} type="submit">
          {loading ? 'Saving…' : 'Save Lap Time'}
        </button>
      </form>
    </div>
  );
}







