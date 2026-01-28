'use client';

/**
 * BuildEditor Component
 *
 * Two-mode build configuration:
 * - BASIC: Quick mod selection with checkboxes (current behavior + enhanced)
 * - ADVANCED: Detailed specs for turbo, engine, fuel, dyno verification
 *
 * Advanced mode data feeds the physics model for accurate HP predictions.
 */

import { useState, useEffect, useCallback } from 'react';

import styles from './BuildEditor.module.css';

// ============================================================================
// MOD CATEGORIES FOR BASIC MODE
// ============================================================================

const BASIC_CATEGORIES = {
  power: {
    label: 'Engine & Performance',
    icon: '⚡',
    mods: [
      { key: 'intake', label: 'Intake' },
      { key: 'exhaust-catback', label: 'Exhaust' },
      { key: 'headers', label: 'Headers' },
      { key: 'downpipe', label: 'Downpipe' },
      { key: 'intercooler', label: 'Intercooler' },
    ],
  },
  tune: {
    label: 'ECU Tune',
    icon: '🎛️',
    mods: [
      { key: 'stage1-tune', label: 'Stage 1' },
      { key: 'stage2-tune', label: 'Stage 2' },
      { key: 'stage3-tune', label: 'Stage 3' },
    ],
  },
  turbo: {
    label: 'Forced Induction',
    icon: '🌀',
    mods: [
      { key: 'turbo-upgrade-existing', label: 'Upgraded Turbo' },
      { key: 'turbo-kit-single', label: 'Single Turbo Kit' },
      { key: 'supercharger-roots', label: 'Supercharger' },
    ],
  },
  fuel: {
    label: 'Fuel System',
    icon: '⛽',
    mods: [
      { key: 'flex-fuel-e85', label: 'E85/Flex Fuel' },
      { key: 'fuel-system-upgrade', label: 'Fuel System' },
      // Note: hpfp-upgrade removed - bundled with fuel-system-upgrade
    ],
  },
  suspension: {
    label: 'Suspension & Handling',
    icon: '🔧',
    mods: [
      { key: 'lowering-springs', label: 'Lowering Springs' },
      { key: 'coilovers-track', label: 'Coilovers' },
      { key: 'sway-bars', label: 'Sway Bars' },
    ],
  },
  brakes: {
    label: 'Brakes',
    icon: '🛑',
    mods: [
      { key: 'brake-pads-track', label: 'Track Pads' },
      { key: 'big-brake-kit', label: 'Big Brake Kit' },
      { key: 'brake-fluid-lines', label: 'SS Lines' },
    ],
  },
  cooling: {
    label: 'Cooling',
    icon: '❄️',
    mods: [
      { key: 'oil-cooler', label: 'Oil Cooler' },
      { key: 'radiator-upgrade', label: 'Radiator' },
      { key: 'trans-cooler', label: 'Trans Cooler' },
    ],
  },
  aero: {
    label: 'Body & Aero',
    icon: '🏎️',
    mods: [
      { key: 'wing', label: 'Wing' },
      { key: 'splitter', label: 'Splitter' },
    ],
  },
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  basic: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  advanced: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  check: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  info: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  upload: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BuildEditor({
  vehicleId: _vehicleId,
  carSlug: _carSlug,
  initialMods = [],
  initialCustomSpecs = {},
  turboOptions = [],
  onSave,
  onEstimateChange,
  stockHp = 0,
}) {
  // Mode: 'basic' or 'advanced'
  const [mode, setMode] = useState('basic');

  // Basic mode state
  const [selectedMods, setSelectedMods] = useState(new Set(initialMods));

  // Advanced mode state
  const [customSpecs, setCustomSpecs] = useState({
    engine: {
      type: 'stock', // stock, built, stroked
      displacement: null,
      internals: null, // stock, forged
      cams: null, // stock, stage1, stage2, stage3
      headWork: false,
      notes: '',
    },
    turbo: {
      type: 'stock', // stock, upgraded, custom
      modelId: null, // Reference to turbo_models table
      customModel: '',
      customBrand: '',
      inducerMm: null,
      exducerMm: null,
      targetBoostPsi: null,
      notes: '',
    },
    fuel: {
      type: '93', // 91, 93, e30, e50, e85, flex
      injectorCc: null,
      fuelPump: '',
    },
    tune: {
      tuner: '',
      ecuType: 'stock', // stock, standalone, piggyback
      standalone: '',
    },
    dyno: {
      hasResults: false,
      whp: null,
      wtq: null,
      boostPsi: null,
      fuelType: '',
      dynoType: '',
      date: '',
      shop: '',
      sheetUrl: '',
    },
    ...initialCustomSpecs,
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Detect changes
  useEffect(() => {
    const modsChanged =
      JSON.stringify([...selectedMods].sort()) !== JSON.stringify([...initialMods].sort());
    const specsChanged = JSON.stringify(customSpecs) !== JSON.stringify(initialCustomSpecs);
    setHasChanges(modsChanged || specsChanged);
  }, [selectedMods, customSpecs, initialMods, initialCustomSpecs]);

  // Toggle mod in basic mode
  const toggleMod = useCallback((modKey) => {
    setSelectedMods((prev) => {
      const next = new Set(prev);
      if (next.has(modKey)) {
        next.delete(modKey);
      } else {
        next.add(modKey);
      }
      return next;
    });
  }, []);

  // Update custom specs
  const updateSpecs = useCallback((section, field, value) => {
    setCustomSpecs((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }, []);

  // Find selected turbo data from options
  const selectedTurboData = turboOptions.find((t) => t.id === customSpecs.turbo?.modelId) || null;

  // Calculate estimated HP with turbo data for best projection
  const estimatedHp = calculateEstimatedHp(
    stockHp,
    selectedMods,
    customSpecs,
    mode,
    selectedTurboData
  );

  // Notify parent of estimate changes
  useEffect(() => {
    onEstimateChange?.(estimatedHp);
  }, [estimatedHp, onEstimateChange]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        installedModifications: [...selectedMods],
        customSpecs: mode === 'advanced' ? customSpecs : {},
        buildMode: mode,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save build:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.buildEditor}>
      {/* Mode Toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === 'basic' ? styles.active : ''}`}
          onClick={() => setMode('basic')}
        >
          <Icons.basic />
          Basic
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'advanced' ? styles.active : ''}`}
          onClick={() => setMode('advanced')}
        >
          <Icons.advanced />
          Advanced
        </button>

        <div className={styles.modeHint}>
          {mode === 'basic'
            ? 'Quick mod selection — good for general builds'
            : 'Detailed specs — accurate predictions for your exact setup'}
        </div>
      </div>

      {/* HP Estimate Bar */}
      <div className={styles.hpEstimate}>
        <div className={styles.hpLabel}>
          {mode === 'advanced' ? 'Best Estimate' : 'Estimated Power'}
        </div>
        <div className={styles.hpValue}>
          <span className={styles.stockHp}>{stockHp}</span>
          <span className={styles.hpArrow}>→</span>
          {estimatedHp.range ? (
            <>
              <span className={styles.modifiedHp}>
                {estimatedHp.range.low}-{estimatedHp.range.high} WHP
              </span>
              <span className={styles.hpGain}>
                (+{estimatedHp.range.low - stockHp} to +{estimatedHp.range.high - stockHp})
              </span>
            </>
          ) : (
            <>
              <span className={styles.modifiedHp}>{estimatedHp.whp} WHP</span>
              <span className={styles.hpGain}>(+{estimatedHp.gain})</span>
            </>
          )}
        </div>
        <div className={styles.hpConfidence}>
          <span className={`${styles.confidenceDot} ${styles[estimatedHp.confidenceLevel]}`} />
          {estimatedHp.confidenceLabel}
          {estimatedHp.tier && <span className={styles.tierBadge}>Tier {estimatedHp.tier}</span>}
        </div>
      </div>

      {/* Basic Mode */}
      {mode === 'basic' && (
        <BasicBuildForm
          categories={BASIC_CATEGORIES}
          selectedMods={selectedMods}
          onToggle={toggleMod}
        />
      )}

      {/* Advanced Mode */}
      {mode === 'advanced' && (
        <AdvancedBuildForm
          specs={customSpecs}
          onUpdate={updateSpecs}
          turboOptions={turboOptions}
          selectedMods={selectedMods}
          onToggleMod={toggleMod}
        />
      )}

      {/* Save Bar */}
      {hasChanges && (
        <div className={styles.saveBar}>
          <span className={styles.unsavedIndicator}>Unsaved changes</span>
          <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Build'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BASIC BUILD FORM
// ============================================================================

function BasicBuildForm({ categories, selectedMods, onToggle }) {
  return (
    <div className={styles.basicForm}>
      {Object.entries(categories).map(([catKey, category]) => (
        <div key={catKey} className={styles.modCategory}>
          <div className={styles.categoryHeader}>
            <span className={styles.categoryIcon}>{category.icon}</span>
            <span className={styles.categoryLabel}>{category.label}</span>
          </div>
          <div className={styles.modGrid}>
            {category.mods.map((mod) => (
              <button
                key={mod.key}
                className={`${styles.modButton} ${selectedMods.has(mod.key) ? styles.selected : ''}`}
                onClick={() => onToggle(mod.key)}
              >
                <span className={styles.modCheck}>
                  {selectedMods.has(mod.key) && <Icons.check />}
                </span>
                <span className={styles.modLabel}>{mod.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ADVANCED BUILD FORM
// ============================================================================

function AdvancedBuildForm({ specs, onUpdate, turboOptions, selectedMods, onToggleMod }) {
  return (
    <div className={styles.advancedForm}>
      {/* Engine Section */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🔧</span>
          Engine
        </h3>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Build Level</label>
          <div className={styles.radioGroup}>
            {[
              { value: 'stock', label: 'Stock' },
              { value: 'built', label: 'Built' },
              { value: 'stroked', label: 'Stroked' },
            ].map((opt) => (
              <label key={opt.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="engineType"
                  value={opt.value}
                  checked={specs?.engine?.type === opt.value}
                  onChange={(e) => onUpdate('engine', 'type', e.target.value)}
                />
                <span className={styles.radioText}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {specs?.engine?.type && specs.engine.type !== 'stock' && (
          <>
            {specs.engine.type === 'stroked' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Displacement (L)</label>
                <input
                  type="number"
                  step="0.1"
                  className={styles.input}
                  placeholder="e.g., 2.2"
                  value={specs.engine?.displacement || ''}
                  onChange={(e) =>
                    onUpdate('engine', 'displacement', parseFloat(e.target.value) || null)
                  }
                />
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Internals</label>
              <div className={styles.radioGroup}>
                {[
                  { value: 'stock', label: 'Stock' },
                  { value: 'forged', label: 'Forged' },
                ].map((opt) => (
                  <label key={opt.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="internals"
                      value={opt.value}
                      checked={specs.engine?.internals === opt.value}
                      onChange={(e) => onUpdate('engine', 'internals', e.target.value)}
                    />
                    <span className={styles.radioText}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cams</label>
              <div className={styles.radioGroup}>
                {[
                  { value: 'stock', label: 'Stock' },
                  { value: 'stage1', label: 'Stage 1' },
                  { value: 'stage2', label: 'Stage 2' },
                  { value: 'stage3', label: 'Stage 3' },
                ].map((opt) => (
                  <label key={opt.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="cams"
                      value={opt.value}
                      checked={specs.engine?.cams === opt.value}
                      onChange={(e) => onUpdate('engine', 'cams', e.target.value)}
                    />
                    <span className={styles.radioText}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={specs.engine?.headWork || false}
                  onChange={(e) => onUpdate('engine', 'headWork', e.target.checked)}
                />
                <span>Head work / Porting</span>
              </label>
            </div>
          </>
        )}
      </section>

      {/* Turbo Section */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🌀</span>
          Turbo / Power Adder
        </h3>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Turbo Setup</label>
          <div className={styles.radioGroup}>
            {[
              { value: 'stock', label: 'Stock' },
              { value: 'upgraded', label: 'Upgraded' },
              { value: 'custom', label: 'Custom / Big Turbo' },
            ].map((opt) => (
              <label key={opt.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="turboType"
                  value={opt.value}
                  checked={specs?.turbo?.type === opt.value}
                  onChange={(e) => onUpdate('turbo', 'type', e.target.value)}
                />
                <span className={styles.radioText}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {specs?.turbo?.type && specs.turbo.type !== 'stock' && (
          <>
            {turboOptions.length > 0 && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Select Turbo</label>
                <select
                  className={styles.select}
                  value={specs.turbo?.modelId || ''}
                  onChange={(e) => onUpdate('turbo', 'modelId', e.target.value || null)}
                >
                  <option value="">-- Select from library --</option>
                  {turboOptions.map((turbo) => (
                    <option key={turbo.id} value={turbo.id}>
                      {turbo.brand} {turbo.model} ({turbo.flow_hp_min}-{turbo.flow_hp_max} HP)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Or Enter Custom</label>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Brand (e.g., Garrett)"
                  value={specs.turbo?.customBrand || ''}
                  onChange={(e) => onUpdate('turbo', 'customBrand', e.target.value)}
                />
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Model (e.g., GTX3576R)"
                  value={specs.turbo?.customModel || ''}
                  onChange={(e) => onUpdate('turbo', 'customModel', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Size (optional)</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  className={styles.inputSmall}
                  placeholder="Inducer mm"
                  value={specs.turbo?.inducerMm || ''}
                  onChange={(e) =>
                    onUpdate('turbo', 'inducerMm', parseFloat(e.target.value) || null)
                  }
                />
                <span className={styles.inputSeparator}>/</span>
                <input
                  type="number"
                  className={styles.inputSmall}
                  placeholder="Exducer mm"
                  value={specs.turbo?.exducerMm || ''}
                  onChange={(e) =>
                    onUpdate('turbo', 'exducerMm', parseFloat(e.target.value) || null)
                  }
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Target Boost (PSI)</label>
              <input
                type="number"
                className={styles.inputSmall}
                placeholder="e.g., 30"
                value={specs.turbo?.targetBoostPsi || ''}
                onChange={(e) =>
                  onUpdate('turbo', 'targetBoostPsi', parseFloat(e.target.value) || null)
                }
              />
            </div>
          </>
        )}
      </section>

      {/* Fuel Section */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⛽</span>
          Fuel System
        </h3>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Fuel Type</label>
          <div className={styles.radioGroup}>
            {[
              { value: '91', label: '91' },
              { value: '93', label: '93' },
              { value: 'e30', label: 'E30' },
              { value: 'e50', label: 'E50' },
              { value: 'e85', label: 'E85' },
              { value: 'flex', label: 'Flex' },
            ].map((opt) => (
              <label key={opt.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="fuelType"
                  value={opt.value}
                  checked={specs?.fuel?.type === opt.value}
                  onChange={(e) => onUpdate('fuel', 'type', e.target.value)}
                />
                <span className={styles.radioText}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Injector Size (cc)</label>
          <input
            type="number"
            className={styles.inputSmall}
            placeholder="e.g., 1300"
            value={specs?.fuel?.injectorCc || ''}
            onChange={(e) => onUpdate('fuel', 'injectorCc', parseInt(e.target.value) || null)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Fuel Pump</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g., Walbro 450"
            value={specs?.fuel?.fuelPump || ''}
            onChange={(e) => onUpdate('fuel', 'fuelPump', e.target.value)}
          />
        </div>
      </section>

      {/* Dyno Results Section */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📊</span>
          Dyno Results
          <span className={styles.sectionHint}>
            Verified data improves predictions for everyone
          </span>
        </h3>

        <div className={styles.fieldGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={specs?.dyno?.hasResults || false}
              onChange={(e) => onUpdate('dyno', 'hasResults', e.target.checked)}
            />
            <span>I have dyno results</span>
          </label>
        </div>

        {specs?.dyno?.hasResults && (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Wheel Horsepower</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  className={styles.inputSmall}
                  placeholder="WHP"
                  value={specs.dyno?.whp || ''}
                  onChange={(e) => onUpdate('dyno', 'whp', parseInt(e.target.value) || null)}
                />
                <input
                  type="number"
                  className={styles.inputSmall}
                  placeholder="WTQ"
                  value={specs.dyno?.wtq || ''}
                  onChange={(e) => onUpdate('dyno', 'wtq', parseInt(e.target.value) || null)}
                />
                <input
                  type="number"
                  className={styles.inputSmall}
                  placeholder="Boost PSI"
                  value={specs.dyno?.boostPsi || ''}
                  onChange={(e) => onUpdate('dyno', 'boostPsi', parseFloat(e.target.value) || null)}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Dyno Details</label>
              <div className={styles.inputRow}>
                <select
                  className={styles.select}
                  value={specs.dyno?.dynoType || ''}
                  onChange={(e) => onUpdate('dyno', 'dynoType', e.target.value)}
                >
                  <option value="">Dyno Type</option>
                  <option value="dynojet">Dynojet</option>
                  <option value="mustang">Mustang</option>
                  <option value="mainline">Mainline</option>
                  <option value="other">Other</option>
                </select>
                <select
                  className={styles.select}
                  value={specs.dyno?.fuelType || ''}
                  onChange={(e) => onUpdate('dyno', 'fuelType', e.target.value)}
                >
                  <option value="">Fuel</option>
                  <option value="91">91</option>
                  <option value="93">93</option>
                  <option value="e85">E85</option>
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Shop / Tuner</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Dyno shop name"
                value={specs.dyno?.shop || ''}
                onChange={(e) => onUpdate('dyno', 'shop', e.target.value)}
              />
            </div>
          </>
        )}
      </section>

      {/* Additional Mods (from basic mode) */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🛠️</span>
          Supporting Mods
        </h3>
        <div className={styles.compactModGrid}>
          {Object.values(BASIC_CATEGORIES)
            .flatMap((cat) => cat.mods)
            .map((mod) => (
              <label key={mod.key} className={styles.compactModLabel}>
                <input
                  type="checkbox"
                  checked={selectedMods.has(mod.key)}
                  onChange={() => onToggleMod(mod.key)}
                />
                <span>{mod.label}</span>
              </label>
            ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// HP ESTIMATION - Physics-Based with Forum Calibration
// ============================================================================

function calculateEstimatedHp(stockHp, selectedMods, customSpecs, mode, turboData = null) {
  if (!stockHp) {
    return {
      whp: 0,
      gain: 0,
      confidenceLevel: 'low',
      confidenceLabel: 'Missing stock HP',
      range: null,
    };
  }

  // If user has dyno results, use them directly (Tier 1 - Verified)
  if (mode === 'advanced' && customSpecs.dyno?.hasResults && customSpecs.dyno?.whp) {
    return {
      whp: customSpecs.dyno.whp,
      gain: customSpecs.dyno.whp - stockHp,
      confidenceLevel: 'high',
      confidenceLabel: 'Verified dyno data',
      range: null,
      tier: 1,
    };
  }

  let estimatedWhp = stockHp;
  let confidence = 'medium';
  let confidenceLabel = 'Estimated based on mods';
  let range = null;

  // Basic mode: use simple multipliers with disclaimer
  if (mode === 'basic') {
    const modCount = selectedMods.size;
    const hasTurboUpgrade =
      selectedMods.has('turbo-upgrade-existing') || selectedMods.has('turbo-kit-single');
    const hasE85 = selectedMods.has('flex-fuel-e85');
    const hasStage3 = selectedMods.has('stage3-tune');
    const hasStage2 = selectedMods.has('stage2-tune');

    if (hasTurboUpgrade && hasE85 && hasStage3) {
      estimatedWhp = Math.round(stockHp * 1.8);
      confidence = 'low';
      confidenceLabel = 'Rough estimate — use Advanced for accuracy';
    } else if (hasTurboUpgrade || hasStage3) {
      estimatedWhp = Math.round(stockHp * 1.5);
      confidence = 'low';
      confidenceLabel = 'Rough estimate — use Advanced for accuracy';
    } else if (hasStage2 || hasE85) {
      estimatedWhp = Math.round(stockHp * 1.3);
      confidence = 'medium';
    } else if (modCount > 0) {
      estimatedWhp = Math.round(stockHp * (1 + modCount * 0.03));
      confidence = 'medium';
    }

    return {
      whp: estimatedWhp,
      gain: estimatedWhp - stockHp,
      confidenceLevel: confidence,
      confidenceLabel,
      range: null,
      tier: 4,
    };
  }

  // Advanced mode: Physics-based calculation
  if (mode === 'advanced') {
    const calculations = [];
    let engineMultiplier = 1.0;
    let fuelMultiplier = 1.0;
    const stockBoost = 21; // Typical turbo car stock boost

    // === ENGINE MODIFICATIONS ===
    if (customSpecs.engine?.type === 'built' || customSpecs.engine?.type === 'stroked') {
      // Forged internals enable more power but don't add directly
      if (customSpecs.engine.internals === 'forged') {
        engineMultiplier += 0.02; // Small reliability margin
      }

      // Cams add significant VE improvement
      if (customSpecs.engine.cams === 'stage3') {
        engineMultiplier += 0.12; // +12% VE
      } else if (customSpecs.engine.cams === 'stage2') {
        engineMultiplier += 0.07; // +7% VE
      } else if (customSpecs.engine.cams === 'stage1') {
        engineMultiplier += 0.04; // +4% VE
      }

      // Head work
      if (customSpecs.engine.headWork) {
        engineMultiplier += 0.06; // +6% flow
      }

      // Stroker displacement bonus
      if (customSpecs.engine.type === 'stroked' && customSpecs.engine.displacement) {
        const stockDisplacement = 2.0;
        const displacementRatio = customSpecs.engine.displacement / stockDisplacement;
        engineMultiplier *= displacementRatio;
      }
    }

    // === FUEL SYSTEM ===
    if (customSpecs.fuel?.type === 'e85' || customSpecs.fuel?.type === 'flex') {
      fuelMultiplier = 1.15; // E85 adds ~15%
    } else if (customSpecs.fuel?.type === 'e50') {
      fuelMultiplier = 1.1;
    } else if (customSpecs.fuel?.type === 'e30') {
      fuelMultiplier = 1.06;
    } else if (customSpecs.fuel?.type === '91') {
      fuelMultiplier = 0.97; // Knock limited
    }

    // === TURBO CALCULATION (Most Important) ===
    if (customSpecs.turbo?.type === 'upgraded' || customSpecs.turbo?.type === 'custom') {
      // Method 1: If we have turbo library data (best)
      if (turboData && turboData.flow_hp_min && turboData.flow_hp_max) {
        const turboEfficiency = 0.78; // Typical ball-bearing efficiency
        const flowMidpoint = (turboData.flow_hp_min + turboData.flow_hp_max) / 2;
        const turboBasedHp = Math.round(
          flowMidpoint * turboEfficiency * fuelMultiplier * engineMultiplier
        );

        calculations.push({
          method: 'turbo_flow',
          hp: turboBasedHp,
          weight: 0.35,
          label: `${turboData.brand} ${turboData.model} flow data`,
        });

        // Also calculate range from turbo limits
        const turboMin = Math.round(turboData.flow_hp_min * turboEfficiency * fuelMultiplier);
        const turboMax = Math.round(
          turboData.flow_hp_max * turboEfficiency * fuelMultiplier * engineMultiplier
        );
        range = { low: turboMin, high: turboMax };
        confidence = 'high';
        confidenceLabel = `Based on ${turboData.model} flow capacity`;
      }

      // Method 2: Inducer size estimation
      if (customSpecs.turbo.inducerMm) {
        const inducer = customSpecs.turbo.inducerMm;
        // Rough correlation: inducer mm to HP potential
        // 50mm ~= 400HP, 58mm ~= 600HP, 66mm ~= 850HP
        const hpPotential = Math.pow(inducer / 50, 2.3) * 400;
        const inducerBasedHp = Math.round(hpPotential * fuelMultiplier * engineMultiplier * 0.85);

        calculations.push({
          method: 'inducer_size',
          hp: inducerBasedHp,
          weight: 0.25,
          label: `${inducer}mm inducer estimate`,
        });

        if (!range) {
          range = {
            low: Math.round(inducerBasedHp * 0.9),
            high: Math.round(inducerBasedHp * 1.1),
          };
        }
      }

      // Method 3: Target boost pressure ratio
      if (customSpecs.turbo.targetBoostPsi) {
        const targetBoost = customSpecs.turbo.targetBoostPsi;
        const pressureRatio = (14.7 + targetBoost) / (14.7 + stockBoost);
        const boostGain = (pressureRatio - 1) * 0.7; // 70% of theoretical
        const boostBasedHp = Math.round(
          stockHp * (1 + boostGain) * fuelMultiplier * engineMultiplier
        );

        calculations.push({
          method: 'boost_pressure',
          hp: boostBasedHp,
          weight: 0.25,
          label: `@ ${targetBoost} PSI (PR: ${pressureRatio.toFixed(2)})`,
        });

        confidenceLabel = `Estimated @ ${targetBoost} PSI`;
      }

      // Method 4: Generic upgrade fallback
      if (calculations.length === 0) {
        const genericMultiplier = customSpecs.turbo.type === 'custom' ? 1.8 : 1.5;
        const genericHp = Math.round(
          stockHp * genericMultiplier * fuelMultiplier * engineMultiplier
        );

        calculations.push({
          method: 'generic',
          hp: genericHp,
          weight: 1.0,
          label: 'Generic turbo upgrade estimate',
        });

        confidence = 'low';
        confidenceLabel = 'Enter turbo details for better estimate';
      }
    } else {
      // No turbo upgrade - just bolt-ons
      const boltOnMultiplier = 1.0 + selectedMods.size * 0.02;
      estimatedWhp = Math.round(stockHp * boltOnMultiplier * fuelMultiplier * engineMultiplier);

      return {
        whp: estimatedWhp,
        gain: estimatedWhp - stockHp,
        confidenceLevel: 'medium',
        confidenceLabel: 'Bolt-on estimate',
        range: null,
        tier: 3,
      };
    }

    // Calculate weighted average of all methods
    if (calculations.length > 0) {
      const totalWeight = calculations.reduce((sum, c) => sum + c.weight, 0);
      estimatedWhp = Math.round(
        calculations.reduce((sum, c) => sum + c.hp * c.weight, 0) / totalWeight
      );

      // Determine confidence level
      if (calculations.some((c) => c.method === 'turbo_flow')) {
        confidence = 'high';
      } else if (calculations.length >= 2) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }
    }
  }

  return {
    whp: estimatedWhp,
    gain: estimatedWhp - stockHp,
    confidenceLevel: confidence,
    confidenceLabel,
    range,
    tier: confidence === 'high' ? 2 : confidence === 'medium' ? 3 : 4,
  };
}
