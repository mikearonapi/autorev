'use client';

/**
 * Manual Data Entry Page
 * 
 * Internal tool for entering data that cannot be scraped.
 * Used when:
 * - Sites have strong anti-bot measures
 * - Data is behind paywalls
 * - Scrapers are temporarily blocked
 * - Need to add data from offline sources
 */

import { useState, useEffect } from 'react';
import styles from './page.module.css';

const DATA_TYPES = ['pricing', 'review', 'safety', 'specs'];

const TEMPLATE_HINTS = {
  pricing: {
    fields: ['price', 'condition', 'mileage', 'year'],
    example: { price: 75000, condition: 'good', mileage: 45000, year: 2020 },
  },
  review: {
    fields: ['rating', 'pros', 'cons', 'verdict'],
    example: { rating: 8.5, pros: ['Great handling', 'Powerful engine'], cons: ['Expensive options'], verdict: 'One of the best in its class' },
  },
  safety: {
    fields: ['reliabilityScore', 'commonIssues', 'maintenanceCost'],
    example: { reliabilityScore: 4, commonIssues: ['Water pump failure around 80k miles'], maintenanceCost: 'high' },
  },
  specs: {
    fields: ['hp', 'torque', 'weight', 'fuelCapacity'],
    example: { hp: 502, torque: 460, weight: 3534, fuelCapacity: 17.2 },
  },
};

export default function ManualEntryPage() {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [dataType, setDataType] = useState('pricing');
  const [source, setSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [dataJson, setDataJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  
  // Load cars on mount
  useEffect(() => {
    async function loadCars() {
      try {
        const res = await fetch('/api/cars?limit=200');
        const data = await res.json();
        setCars(data.cars || []);
      } catch (err) {
        console.error('Error loading cars:', err);
      }
    }
    loadCars();
  }, []);
  
  // Update example when data type changes
  useEffect(() => {
    const template = TEMPLATE_HINTS[dataType];
    if (template) {
      setDataJson(JSON.stringify(template.example, null, 2));
    }
  }, [dataType]);
  
  // Load existing entries when car is selected
  useEffect(() => {
    if (selectedCar) {
      loadExistingEntries();
    }
  }, [selectedCar]);
  
  async function loadExistingEntries() {
    try {
      const res = await fetch(`/api/cars/${selectedCar}/manual-data`);
      const data = await res.json();
      setRecentEntries(data.entries || []);
    } catch (err) {
      console.error('Error loading entries:', err);
    }
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      // Validate JSON
      let parsedData;
      try {
        parsedData = JSON.parse(dataJson);
      } catch (err) {
        throw new Error('Invalid JSON: ' + err.message);
      }
      
      const res = await fetch(`/api/cars/${selectedCar}/manual-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType,
          source,
          sourceUrl,
          notes,
          data: parsedData,
          enteredBy: 'manual-entry-ui',
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save');
      }
      
      setMessage({ type: 'success', text: 'Data saved successfully!' });
      loadExistingEntries();
      
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Manual Data Entry</h1>
        <p>Enter data from sources that cannot be scraped automatically.</p>
      </header>
      
      <div className={styles.content}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="car">Select Car</label>
            <select
              id="car"
              value={selectedCar}
              onChange={(e) => setSelectedCar(e.target.value)}
              required
            >
              <option value="">-- Select a car --</option>
              {cars.map((car) => (
                <option key={car.slug} value={car.slug}>
                  {car.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="dataType">Data Type</label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              required
            >
              {DATA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="source">Source Name</label>
            <input
              type="text"
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Consumer Reports, KBB, Magazine Article"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="sourceUrl">Source URL (optional)</label>
            <input
              type="url"
              id="sourceUrl"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data">
              Data (JSON)
              <span className={styles.hint}>
                Fields: {TEMPLATE_HINTS[dataType]?.fields.join(', ')}
              </span>
            </label>
            <textarea
              id="data"
              value={dataJson}
              onChange={(e) => setDataJson(e.target.value)}
              rows={10}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional context about this data..."
            />
          </div>
          
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}
          
          <button type="submit" disabled={loading || !selectedCar}>
            {loading ? 'Saving...' : 'Save Data'}
          </button>
        </form>
        
        <aside className={styles.sidebar}>
          <h2>Recent Entries</h2>
          {selectedCar ? (
            recentEntries.length > 0 ? (
              <ul className={styles.entriesList}>
                {recentEntries.map((entry) => (
                  <li key={entry.id} className={styles.entry}>
                    <span className={styles.entryType}>{entry.data_type}</span>
                    <span className={styles.entrySource}>{entry.source}</span>
                    <span className={styles.entryDate}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noEntries}>No entries yet for this car.</p>
            )
          ) : (
            <p className={styles.noEntries}>Select a car to see existing entries.</p>
          )}
          
          <h2>Common Sources</h2>
          <ul className={styles.sourcesList}>
            <li onClick={() => setSource('Consumer Reports')}>Consumer Reports</li>
            <li onClick={() => setSource('Kelley Blue Book')}>Kelley Blue Book</li>
            <li onClick={() => setSource('Edmunds')}>Edmunds</li>
            <li onClick={() => setSource('JD Power')}>JD Power</li>
            <li onClick={() => setSource('Road & Track')}>Road & Track</li>
            <li onClick={() => setSource('Top Gear')}>Top Gear</li>
            <li onClick={() => setSource('Jalopnik')}>Jalopnik</li>
            <li onClick={() => setSource('Owner Forum')}>Owner Forum</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}



