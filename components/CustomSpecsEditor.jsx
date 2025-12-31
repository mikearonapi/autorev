'use client';

/**
 * CustomSpecsEditor Component
 * 
 * Allows users to input their specific modification details
 * (wheel sizes, tire specs, etc.) that override stock values.
 * 
 * @module components/CustomSpecsEditor
 */

import React, { useState, useCallback, useEffect } from 'react';
import styles from './CustomSpecsEditor.module.css';

// Icons
const Icons = {
  save: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  trash: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  edit: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  wheel: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  tire: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  loader: ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
};

/**
 * Section header with expand/collapse
 */
function SectionHeader({ title, icon: Icon, expanded, onToggle, hasData }) {
  return (
    <button 
      type="button"
      className={`${styles.sectionHeader} ${expanded ? styles.expanded : ''}`}
      onClick={onToggle}
    >
      <div className={styles.sectionHeaderLeft}>
        <Icon size={18} />
        <span>{title}</span>
        {hasData && <span className={styles.hasDataBadge}>Modified</span>}
      </div>
      {expanded ? <Icons.chevronUp size={18} /> : <Icons.chevronDown size={18} />}
    </button>
  );
}

/**
 * Input field with label
 */
function InputField({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <div className={styles.inputField}>
      <label className={styles.inputLabel}>{label}</label>
      <input
        type={type}
        className={styles.input}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <span className={styles.inputHint}>{hint}</span>}
    </div>
  );
}

/**
 * Form section for front/rear pairs (wheels, tires)
 */
function FrontRearSection({ title, frontData, rearData, onFrontChange, onRearChange, fields, sameAsRear = false }) {
  const [useSameForRear, setUseSameForRear] = useState(sameAsRear);

  const handleFrontChange = (field, value) => {
    onFrontChange({ ...frontData, [field]: value });
    if (useSameForRear) {
      onRearChange({ ...rearData, [field]: value });
    }
  };

  const handleSameForRearChange = (checked) => {
    setUseSameForRear(checked);
    if (checked) {
      onRearChange({ ...frontData });
    }
  };

  return (
    <div className={styles.frontRearSection}>
      <div className={styles.frontRearHeader}>
        <h5 className={styles.frontRearTitle}>{title}</h5>
        <label className={styles.sameForRearToggle}>
          <input
            type="checkbox"
            checked={useSameForRear}
            onChange={(e) => handleSameForRearChange(e.target.checked)}
          />
          <span>Same front &amp; rear</span>
        </label>
      </div>
      
      <div className={styles.frontRearGrid}>
        <div className={styles.frontRearColumn}>
          <span className={styles.columnLabel}>Front</span>
          {fields.map(({ key, label, placeholder, hint }) => (
            <InputField
              key={key}
              label={label}
              value={frontData?.[key]}
              onChange={(val) => handleFrontChange(key, val)}
              placeholder={placeholder}
              hint={hint}
            />
          ))}
        </div>
        
        {!useSameForRear && (
          <div className={styles.frontRearColumn}>
            <span className={styles.columnLabel}>Rear</span>
            {fields.map(({ key, label, placeholder, hint }) => (
              <InputField
                key={key}
                label={label}
                value={rearData?.[key]}
                onChange={(val) => onRearChange({ ...rearData, [key]: val })}
                placeholder={placeholder}
                hint={hint}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main CustomSpecsEditor component
 */
export default function CustomSpecsEditor({
  customSpecs = {},
  stockSpecs = {},
  onSave,
  onClear,
  isLoading = false,
  vehicleId,
}) {
  // Local state for form data
  const [formData, setFormData] = useState(() => ({
    wheels: customSpecs?.wheels || {},
    tires: customSpecs?.tires || {},
    suspension: customSpecs?.suspension || {},
    brakes: customSpecs?.brakes || {},
    engine: customSpecs?.engine || {},
    other: customSpecs?.other || {},
  }));

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    wheels: true,
    tires: true,
    suspension: false,
    brakes: false,
    engine: false,
    other: false,
  });

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when customSpecs prop changes
  useEffect(() => {
    setFormData({
      wheels: customSpecs?.wheels || {},
      tires: customSpecs?.tires || {},
      suspension: customSpecs?.suspension || {},
      brakes: customSpecs?.brakes || {},
      engine: customSpecs?.engine || {},
      other: customSpecs?.other || {},
    });
    setHasChanges(false);
  }, [customSpecs]);

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Update a section
  const updateSection = useCallback((section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data,
    }));
    setHasChanges(true);
  }, []);

  // Check if a section has data
  const sectionHasData = useCallback((section) => {
    const data = formData[section];
    if (!data || typeof data !== 'object') return false;
    return Object.values(data).some(v => {
      if (typeof v === 'object') {
        return Object.values(v).some(vv => vv && vv !== '');
      }
      return v && v !== '';
    });
  }, [formData]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave(formData);
      setHasChanges(false);
    }
  }, [formData, onSave]);

  // Handle clear
  const handleClear = useCallback(async () => {
    if (onClear) {
      await onClear();
      setFormData({
        wheels: {},
        tires: {},
        suspension: {},
        brakes: {},
        engine: {},
        other: {},
      });
      setHasChanges(false);
    }
  }, [onClear]);

  const hasAnyData = Object.keys(formData).some(key => sectionHasData(key));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h4 className={styles.title}>Custom Specs</h4>
          <p className={styles.subtitle}>
            Record your modifications to show your actual specs instead of stock values.
          </p>
        </div>
        <div className={styles.headerActions}>
          {hasAnyData && (
            <button 
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              disabled={isLoading}
            >
              <Icons.trash size={14} />
              Reset to Stock
            </button>
          )}
          <button 
            type="button"
            className={`${styles.saveBtn} ${hasChanges ? styles.hasChanges : ''}`}
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <Icons.loader size={14} className={styles.spinning} />
            ) : (
              <Icons.save size={14} />
            )}
            {hasChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Wheels Section */}
      <div className={styles.section}>
        <SectionHeader
          title="Wheels"
          icon={Icons.wheel}
          expanded={expandedSections.wheels}
          onToggle={() => toggleSection('wheels')}
          hasData={sectionHasData('wheels')}
        />
        {expandedSections.wheels && (
          <div className={styles.sectionContent}>
            <FrontRearSection
              title="Wheel Sizes"
              frontData={formData.wheels?.front || {}}
              rearData={formData.wheels?.rear || {}}
              onFrontChange={(data) => updateSection('wheels', { ...formData.wheels, front: data })}
              onRearChange={(data) => updateSection('wheels', { ...formData.wheels, rear: data })}
              fields={[
                { key: 'size', label: 'Size', placeholder: '19x9.5', hint: 'e.g., 19x9.5' },
                { key: 'offset', label: 'Offset', placeholder: '+22', hint: 'e.g., +22, -5' },
                { key: 'brand', label: 'Brand', placeholder: 'Volk Racing' },
                { key: 'model', label: 'Model', placeholder: 'TE37' },
                { key: 'finish', label: 'Finish', placeholder: 'Bronze' },
              ]}
            />
            <div className={styles.additionalFields}>
              <InputField
                label="Bolt Pattern"
                value={formData.wheels?.boltPattern}
                onChange={(val) => updateSection('wheels', { ...formData.wheels, boltPattern: val })}
                placeholder="5x114.3"
                hint={stockSpecs?.wheels?.boltPattern ? `Stock: ${stockSpecs.wheels.boltPattern}` : undefined}
              />
              <InputField
                label="Center Bore (mm)"
                value={formData.wheels?.centerBore}
                onChange={(val) => updateSection('wheels', { ...formData.wheels, centerBore: val })}
                placeholder="73.1"
              />
              <InputField
                label="Lug Torque (ft-lbs)"
                value={formData.wheels?.lugTorque}
                onChange={(val) => updateSection('wheels', { ...formData.wheels, lugTorque: val })}
                placeholder="85"
                hint={stockSpecs?.wheels?.lugTorque ? `Stock: ${stockSpecs.wheels.lugTorque}` : undefined}
              />
            </div>
            <InputField
              label="Notes"
              value={formData.wheels?.notes}
              onChange={(val) => updateSection('wheels', { ...formData.wheels, notes: val })}
              placeholder="Hub-centric rings installed, purchased from..."
            />
          </div>
        )}
      </div>

      {/* Tires Section */}
      <div className={styles.section}>
        <SectionHeader
          title="Tires"
          icon={Icons.tire}
          expanded={expandedSections.tires}
          onToggle={() => toggleSection('tires')}
          hasData={sectionHasData('tires')}
        />
        {expandedSections.tires && (
          <div className={styles.sectionContent}>
            <FrontRearSection
              title="Tire Specs"
              frontData={formData.tires?.front || {}}
              rearData={formData.tires?.rear || {}}
              onFrontChange={(data) => updateSection('tires', { ...formData.tires, front: data })}
              onRearChange={(data) => updateSection('tires', { ...formData.tires, rear: data })}
              fields={[
                { key: 'size', label: 'Size', placeholder: '265/35R19', hint: 'e.g., 265/35R19' },
                { key: 'brand', label: 'Brand', placeholder: 'Michelin' },
                { key: 'model', label: 'Model', placeholder: 'Pilot Sport 4S' },
                { key: 'pressure', label: 'Pressure (PSI)', placeholder: '36' },
              ]}
            />
            <InputField
              label="Notes"
              value={formData.tires?.notes}
              onChange={(val) => updateSection('tires', { ...formData.tires, notes: val })}
              placeholder="200TW for track days, date installed..."
            />
          </div>
        )}
      </div>

      {/* Suspension Section */}
      <div className={styles.section}>
        <SectionHeader
          title="Suspension"
          icon={Icons.wheel}
          expanded={expandedSections.suspension}
          onToggle={() => toggleSection('suspension')}
          hasData={sectionHasData('suspension')}
        />
        {expandedSections.suspension && (
          <div className={styles.sectionContent}>
            <div className={styles.fieldsGrid}>
              <InputField
                label="Type"
                value={formData.suspension?.type}
                onChange={(val) => updateSection('suspension', { ...formData.suspension, type: val })}
                placeholder="Coilovers / Lowering Springs / Air"
              />
              <InputField
                label="Brand"
                value={formData.suspension?.brand}
                onChange={(val) => updateSection('suspension', { ...formData.suspension, brand: val })}
                placeholder="KW, Ohlins, BC Racing..."
              />
              <InputField
                label="Model"
                value={formData.suspension?.model}
                onChange={(val) => updateSection('suspension', { ...formData.suspension, model: val })}
                placeholder="V3, Swift Springs..."
              />
              <InputField
                label="Front Drop"
                value={formData.suspension?.frontRideHeight}
                onChange={(val) => updateSection('suspension', { ...formData.suspension, frontRideHeight: val })}
                placeholder="-1.2in"
              />
              <InputField
                label="Rear Drop"
                value={formData.suspension?.rearRideHeight}
                onChange={(val) => updateSection('suspension', { ...formData.suspension, rearRideHeight: val })}
                placeholder="-1.0in"
              />
            </div>
            <InputField
              label="Notes"
              value={formData.suspension?.notes}
              onChange={(val) => updateSection('suspension', { ...formData.suspension, notes: val })}
              placeholder="Current settings, alignment specs..."
            />
          </div>
        )}
      </div>

      {/* Brakes Section */}
      <div className={styles.section}>
        <SectionHeader
          title="Brakes"
          icon={Icons.wheel}
          expanded={expandedSections.brakes}
          onToggle={() => toggleSection('brakes')}
          hasData={sectionHasData('brakes')}
        />
        {expandedSections.brakes && (
          <div className={styles.sectionContent}>
            <FrontRearSection
              title="Brake Setup"
              frontData={formData.brakes?.front || {}}
              rearData={formData.brakes?.rear || {}}
              onFrontChange={(data) => updateSection('brakes', { ...formData.brakes, front: data })}
              onRearChange={(data) => updateSection('brakes', { ...formData.brakes, rear: data })}
              fields={[
                { key: 'rotorSize', label: 'Rotor Size', placeholder: '380mm' },
                { key: 'caliperBrand', label: 'Caliper', placeholder: 'Brembo 6-piston' },
                { key: 'padCompound', label: 'Pad Compound', placeholder: 'Hawk HPS 5.0' },
              ]}
            />
            <InputField
              label="Brake Fluid"
              value={formData.brakes?.fluidType}
              onChange={(val) => updateSection('brakes', { ...formData.brakes, fluidType: val })}
              placeholder="Motul RBF 600"
            />
            <InputField
              label="Notes"
              value={formData.brakes?.notes}
              onChange={(val) => updateSection('brakes', { ...formData.brakes, notes: val })}
              placeholder="Last bleed date, bedding procedure..."
            />
          </div>
        )}
      </div>

      {/* Engine/Fluids Section */}
      <div className={styles.section}>
        <SectionHeader
          title="Engine / Fluids"
          icon={Icons.wheel}
          expanded={expandedSections.engine}
          onToggle={() => toggleSection('engine')}
          hasData={sectionHasData('engine')}
        />
        {expandedSections.engine && (
          <div className={styles.sectionContent}>
            <div className={styles.fieldsGrid}>
              <InputField
                label="Oil Type"
                value={formData.engine?.oilType}
                onChange={(val) => updateSection('engine', { ...formData.engine, oilType: val })}
                placeholder="Motul 300V 5W-40"
                hint={stockSpecs?.engine?.oilType ? `Stock: ${stockSpecs.engine.oilType}` : undefined}
              />
              <InputField
                label="Oil Capacity (qts)"
                value={formData.engine?.oilCapacity}
                onChange={(val) => updateSection('engine', { ...formData.engine, oilCapacity: val })}
                placeholder="6.5"
              />
              <InputField
                label="Coolant"
                value={formData.engine?.coolant}
                onChange={(val) => updateSection('engine', { ...formData.engine, coolant: val })}
                placeholder="Evans Waterless"
              />
              <InputField
                label="Trans Fluid"
                value={formData.engine?.transFluid}
                onChange={(val) => updateSection('engine', { ...formData.engine, transFluid: val })}
                placeholder="Motul Gear 300"
              />
              <InputField
                label="Diff Fluid"
                value={formData.engine?.diffFluid}
                onChange={(val) => updateSection('engine', { ...formData.engine, diffFluid: val })}
                placeholder="Red Line 75W-90"
              />
            </div>
            <InputField
              label="Notes"
              value={formData.engine?.notes}
              onChange={(val) => updateSection('engine', { ...formData.engine, notes: val })}
              placeholder="Fuel grade, last fluid change dates..."
            />
          </div>
        )}
      </div>

      {/* Other Notes Section */}
      <div className={styles.section}>
        <SectionHeader
          title="Other"
          icon={Icons.edit}
          expanded={expandedSections.other}
          onToggle={() => toggleSection('other')}
          hasData={sectionHasData('other')}
        />
        {expandedSections.other && (
          <div className={styles.sectionContent}>
            <InputField
              label="General Notes"
              value={formData.other?.notes}
              onChange={(val) => updateSection('other', { ...formData.other, notes: val })}
              placeholder="Any other modifications, tuner info, etc."
            />
          </div>
        )}
      </div>
    </div>
  );
}



