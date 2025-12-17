'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

const DEFAULT_CONDITIONS = {
  ambient_temp_c: null,
  humidity_pct: null,
  altitude_ft: null,
  weather: null,
};

const DEFAULT_CURVE = {
  rpm: [],
  hp: [],
  tq: [],
  units: { rpm: 'rpm', hp: 'hp', tq: 'lb-ft' },
  smoothing: null,
};

export default function DynoPage() {
  const [adminKey, setAdminKey] = useState('');
  const [cars, setCars] = useState([]);
  const [carSlug, setCarSlug] = useState('');

  const [runKind, setRunKind] = useState('baseline');
  const [recordedAt, setRecordedAt] = useState('');
  const [dynoType, setDynoType] = useState('');
  const [correction, setCorrection] = useState('');
  const [fuel, setFuel] = useState('');
  const [isWheel, setIsWheel] = useState(true);

  const [peakWhp, setPeakWhp] = useState('');
  const [peakWtq, setPeakWtq] = useState('');
  const [peakHp, setPeakHp] = useState('');
  const [peakTq, setPeakTq] = useState('');
  const [boostPsiMax, setBoostPsiMax] = useState('');

  const [sourceUrl, setSourceUrl] = useState('');
  const [confidence, setConfidence] = useState('0.70');
  const [notes, setNotes] = useState('');

  const [conditionsJson, setConditionsJson] = useState(JSON.stringify(DEFAULT_CONDITIONS, null, 2));
  const [modsJson, setModsJson] = useState(JSON.stringify({ mods: [] }, null, 2));
  const [curveJson, setCurveJson] = useState(JSON.stringify(DEFAULT_CURVE, null, 2));

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const canSubmit = useMemo(() => Boolean(adminKey && carSlug), [adminKey, carSlug]);

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
      let curve;
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
      try {
        curve = JSON.parse(curveJson || '{}');
      } catch (err) {
        throw new Error(`Invalid curve JSON: ${err.message}`);
      }

      const res = await fetch('/api/internal/dyno/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-admin-key': adminKey,
        },
        body: JSON.stringify({
          carSlug,
          runKind,
          recordedAt: recordedAt || null,
          dynoType: dynoType || null,
          correction: correction || null,
          fuel: fuel || null,
          isWheel,
          peakWhp: peakWhp === '' ? null : Number(peakWhp),
          peakWtq: peakWtq === '' ? null : Number(peakWtq),
          peakHp: peakHp === '' ? null : Number(peakHp),
          peakTq: peakTq === '' ? null : Number(peakTq),
          boostPsiMax: boostPsiMax === '' ? null : Number(boostPsiMax),
          curve,
          conditions,
          modifications,
          notes: notes || null,
          sourceUrl: sourceUrl || null,
          confidence: confidence === '' ? null : Number(confidence),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save dyno run');
      setMessage({ type: 'success', text: `Saved dyno run (${json.dynoRun?.run_kind || runKind}) for ${carSlug}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal: Dyno Runs</h1>
        <p>Manual entry for citeable dyno runs (baseline/modded), including peak numbers and optional curves.</p>
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
            <label>Run kind</label>
            <select value={runKind} onChange={(e) => setRunKind(e.target.value)}>
              <option value="baseline">baseline</option>
              <option value="modded">modded</option>
              <option value="comparison">comparison</option>
              <option value="unknown">unknown</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Recorded at (optional)</label>
            <input value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>

          <div className={styles.formGroup}>
            <label>Dyno type (optional)</label>
            <input value={dynoType} onChange={(e) => setDynoType(e.target.value)} placeholder="Dynojet / Mustang / Mainline" />
          </div>

          <div className={styles.formGroup}>
            <label>Correction (optional)</label>
            <input value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="SAE / STD / Uncorrected" />
          </div>

          <div className={styles.formGroup}>
            <label>Fuel (optional)</label>
            <input value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="91 / 93 / E85 / race gas" />
          </div>

          <div className={styles.formGroupInline}>
            <label>
              <input type="checkbox" checked={isWheel} onChange={(e) => setIsWheel(e.target.checked)} />
              Wheel power (whp/wtq)
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Peak WHP (optional)</label>
            <input value={peakWhp} onChange={(e) => setPeakWhp(e.target.value)} placeholder="e.g. 330" />
          </div>

          <div className={styles.formGroup}>
            <label>Peak WTQ (optional)</label>
            <input value={peakWtq} onChange={(e) => setPeakWtq(e.target.value)} placeholder="e.g. 360" />
          </div>

          <div className={styles.formGroup}>
            <label>Peak HP (optional)</label>
            <input value={peakHp} onChange={(e) => setPeakHp(e.target.value)} placeholder="crank hp (if known)" />
          </div>

          <div className={styles.formGroup}>
            <label>Peak TQ (optional)</label>
            <input value={peakTq} onChange={(e) => setPeakTq(e.target.value)} placeholder="crank tq (if known)" />
          </div>

          <div className={styles.formGroup}>
            <label>Boost max PSI (optional)</label>
            <input value={boostPsiMax} onChange={(e) => setBoostPsiMax(e.target.value)} placeholder="e.g. 28.5" />
          </div>

          <div className={styles.formGroup}>
            <label>Source URL (recommended)</label>
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className={styles.formGroup}>
            <label>Confidence (0..1)</label>
            <input value={confidence} onChange={(e) => setConfidence(e.target.value)} placeholder="0.70" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Curve (JSON) (optional)</label>
          <textarea rows={8} value={curveJson} onChange={(e) => setCurveJson(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label>Conditions (JSON)</label>
          <textarea rows={6} value={conditionsJson} onChange={(e) => setConditionsJson(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label>Modifications (JSON)</label>
          <textarea rows={6} value={modsJson} onChange={(e) => setModsJson(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label>Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

        <button disabled={!canSubmit || loading} type="submit">
          {loading ? 'Saving…' : 'Save Dyno Run'}
        </button>
      </form>
    </div>
  );
}




