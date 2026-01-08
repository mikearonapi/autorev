'use client';

/**
 * Build Parts Editor
 * 
 * Component for adding and editing detailed parts/mods for community builds.
 * Allows users to specify brand, product name, pricing, and notes for each mod.
 */

import { useState, useCallback } from 'react';
import styles from './BuildPartsEditor.module.css';

// Mod categories matching the database schema
const MOD_CATEGORIES = [
  { key: 'intake', label: 'Intake', icon: '🌀' },
  { key: 'exhaust', label: 'Exhaust', icon: '💨' },
  { key: 'ecu', label: 'ECU / Tune', icon: '🖥️' },
  { key: 'turbo', label: 'Turbo', icon: '🔄' },
  { key: 'supercharger', label: 'Supercharger', icon: '⚡' },
  { key: 'intercooler', label: 'Intercooler', icon: '❄️' },
  { key: 'fuel', label: 'Fuel System', icon: '⛽' },
  { key: 'engine', label: 'Engine Internals', icon: '🔧' },
  { key: 'suspension', label: 'Suspension', icon: '🏎️' },
  { key: 'brakes', label: 'Brakes', icon: '🛑' },
  { key: 'wheels', label: 'Wheels', icon: '⭕' },
  { key: 'tires', label: 'Tires', icon: '🛞' },
  { key: 'aero', label: 'Aero', icon: '🪽' },
  { key: 'interior', label: 'Interior', icon: '🪑' },
  { key: 'exterior', label: 'Exterior', icon: '🎨' },
  { key: 'other', label: 'Other', icon: '📦' },
];

// Common mod types by category
const MOD_TYPES = {
  intake: ['Cold Air Intake', 'Short Ram Intake', 'Stock Airbox Mod', 'Intake Manifold', 'Throttle Body'],
  exhaust: ['Cat-Back Exhaust', 'Axle-Back Exhaust', 'Headers', 'Downpipe', 'Mid-Pipe', 'Test Pipe', 'High-Flow Cat', 'Muffler Delete'],
  ecu: ['ECU Tune', 'Piggyback ECU', 'Flash Tune', 'Custom Tune', 'E85 Tune'],
  turbo: ['Turbo Upgrade', 'Turbo Kit', 'Wastegate', 'Blow-Off Valve', 'Turbo Inlet'],
  supercharger: ['Supercharger Kit', 'Pulley Upgrade', 'Supercharger Tune'],
  intercooler: ['Front Mount Intercooler', 'Top Mount Intercooler', 'Intercooler Upgrade', 'Charge Pipes'],
  fuel: ['Fuel Injectors', 'Fuel Pump', 'Fuel Rails', 'Fuel Pressure Regulator', 'Flex Fuel Kit'],
  engine: ['Camshafts', 'Valve Springs', 'Pistons', 'Rods', 'Crank', 'Head Gasket', 'Timing Chain/Belt'],
  suspension: ['Coilovers', 'Lowering Springs', 'Struts/Shocks', 'Sway Bars', 'Control Arms', 'Bushings', 'Camber Kit'],
  brakes: ['Brake Pads', 'Brake Rotors', 'Big Brake Kit', 'Brake Lines', 'Brake Fluid', 'Caliper Upgrade'],
  wheels: ['Aftermarket Wheels', 'Wheel Spacers', 'Lug Nuts', 'Center Caps'],
  tires: ['Performance Tires', 'Track Tires', 'All-Season Tires', 'Winter Tires'],
  aero: ['Front Lip', 'Side Skirts', 'Rear Diffuser', 'Wing/Spoiler', 'Splitter', 'Canards', 'Hood'],
  interior: ['Steering Wheel', 'Seats', 'Harness', 'Roll Bar/Cage', 'Shift Knob', 'Pedals', 'Gauge Pod'],
  exterior: ['Body Kit', 'Wrap/Paint', 'Lighting', 'Mirrors', 'Badges', 'Grille'],
  other: ['Other Modification'],
};

const INSTALL_TYPES = [
  { key: 'diy', label: 'DIY / Self-Installed' },
  { key: 'shop', label: 'Independent Shop' },
  { key: 'dealer', label: 'Dealer' },
];

// Empty part template
const EMPTY_PART = {
  category: 'intake',
  mod_type: '',
  brand_name: '',
  product_name: '',
  part_number: '',
  hp_gain: 0,
  tq_gain: 0,
  price_paid: '',
  install_type: 'diy',
  install_notes: '',
  notes: '',
  is_recommended: true,
  product_url: '',
};

export default function BuildPartsEditor({ parts = [], onChange, readOnly = false }) {
  const [editingPart, setEditingPart] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_PART });

  // Group parts by category
  const partsByCategory = parts.reduce((acc, part) => {
    const cat = part.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(part);
    return acc;
  }, {});

  const handleAddPart = useCallback(() => {
    const newPart = {
      ...formData,
      id: `temp_${Date.now()}`,
      price_paid: formData.price_paid ? parseInt(formData.price_paid * 100) : null, // Convert to cents
    };
    onChange([...parts, newPart]);
    setFormData({ ...EMPTY_PART });
    setShowAddForm(false);
  }, [formData, parts, onChange]);

  const handleUpdatePart = useCallback((partId, updates) => {
    const updatedParts = parts.map(p => 
      p.id === partId ? { ...p, ...updates } : p
    );
    onChange(updatedParts);
    setEditingPart(null);
  }, [parts, onChange]);

  const handleDeletePart = useCallback((partId) => {
    onChange(parts.filter(p => p.id !== partId));
  }, [parts, onChange]);

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      category,
      mod_type: MOD_TYPES[category]?.[0] || '',
    }));
  };

  return (
    <div className={styles.editor}>
      {/* Category Overview */}
      {parts.length > 0 && (
        <div className={styles.categoryGrid}>
          {MOD_CATEGORIES.filter(cat => partsByCategory[cat.key]?.length > 0).map(cat => (
            <div key={cat.key} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.label}</span>
                <span className={styles.partCount}>{partsByCategory[cat.key].length}</span>
              </div>
              <div className={styles.categoryParts}>
                {partsByCategory[cat.key].map(part => (
                  <PartItem
                    key={part.id}
                    part={part}
                    isEditing={editingPart === part.id}
                    onEdit={() => setEditingPart(part.id)}
                    onSave={(updates) => handleUpdatePart(part.id, updates)}
                    onCancel={() => setEditingPart(null)}
                    onDelete={() => handleDeletePart(part.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {parts.length === 0 && !showAddForm && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔧</div>
          <h4>No parts added yet</h4>
          <p>Add the specific parts and mods you've used in your build.</p>
          {!readOnly && (
            <button 
              className={styles.addFirstBtn}
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Part
            </button>
          )}
        </div>
      )}

      {/* Add Part Form */}
      {showAddForm && (
        <div className={styles.addForm}>
          <h4 className={styles.formTitle}>Add Part / Mod</h4>
          
          {/* Category Selection */}
          <div className={styles.formGroup}>
            <label>Category</label>
            <div className={styles.categorySelect}>
              {MOD_CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.categoryBtn} ${formData.category === cat.key ? styles.active : ''}`}
                  onClick={() => handleCategoryChange(cat.key)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mod Type */}
          <div className={styles.formGroup}>
            <label>Modification Type</label>
            <select
              value={formData.mod_type}
              onChange={(e) => setFormData(prev => ({ ...prev, mod_type: e.target.value }))}
              className={styles.select}
            >
              <option value="">Select type...</option>
              {MOD_TYPES[formData.category]?.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="custom">Other (specify below)</option>
            </select>
            {formData.mod_type === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom mod type"
                className={styles.input}
                onChange={(e) => setFormData(prev => ({ ...prev, mod_type: e.target.value }))}
              />
            )}
          </div>

          {/* Brand & Product */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Brand</label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                placeholder="e.g., Cobb, Koni, Eibach"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Product Name</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder="e.g., Accessport V3"
                className={styles.input}
              />
            </div>
          </div>

          {/* Part Number & Price */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Part Number (optional)</label>
              <input
                type="text"
                value={formData.part_number}
                onChange={(e) => setFormData(prev => ({ ...prev, part_number: e.target.value }))}
                placeholder="e.g., AP3-SUB-004"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Price Paid (optional)</label>
              <div className={styles.priceInput}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  value={formData.price_paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_paid: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Performance Gains */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>HP Gain (estimated)</label>
              <input
                type="number"
                value={formData.hp_gain}
                onChange={(e) => setFormData(prev => ({ ...prev, hp_gain: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Torque Gain (estimated)</label>
              <input
                type="number"
                value={formData.tq_gain}
                onChange={(e) => setFormData(prev => ({ ...prev, tq_gain: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                className={styles.input}
              />
            </div>
          </div>

          {/* Installation */}
          <div className={styles.formGroup}>
            <label>Installation</label>
            <div className={styles.installOptions}>
              {INSTALL_TYPES.map(type => (
                <label key={type.key} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="install_type"
                    value={type.key}
                    checked={formData.install_type === type.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, install_type: e.target.value }))}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label>Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any notes about this mod, installation tips, etc."
              className={styles.textarea}
              rows={2}
            />
          </div>

          {/* Product URL */}
          <div className={styles.formGroup}>
            <label>Product Link (optional)</label>
            <input
              type="url"
              value={formData.product_url}
              onChange={(e) => setFormData(prev => ({ ...prev, product_url: e.target.value }))}
              placeholder="https://..."
              className={styles.input}
            />
          </div>

          {/* Recommendation */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.is_recommended}
              onChange={(e) => setFormData(prev => ({ ...prev, is_recommended: e.target.checked }))}
            />
            I recommend this product
          </label>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={() => {
                setShowAddForm(false);
                setFormData({ ...EMPTY_PART });
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className={styles.saveBtn}
              onClick={handleAddPart}
              disabled={!formData.mod_type}
            >
              Add Part
            </button>
          </div>
        </div>
      )}

      {/* Add Part Button */}
      {!showAddForm && !readOnly && parts.length > 0 && (
        <button 
          className={styles.addPartBtn}
          onClick={() => setShowAddForm(true)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Another Part
        </button>
      )}
    </div>
  );
}

/**
 * Individual Part Item Component
 */
function PartItem({ part, isEditing, onEdit, onSave, onCancel, onDelete, readOnly }) {
  const [editData, setEditData] = useState(part);

  const formatPrice = (cents) => {
    if (!cents) return null;
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  if (isEditing) {
    return (
      <div className={styles.partItemEdit}>
        <div className={styles.formGroup}>
          <label>Brand</label>
          <input
            type="text"
            value={editData.brand_name || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, brand_name: e.target.value }))}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Product Name</label>
          <input
            type="text"
            value={editData.product_name || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, product_name: e.target.value }))}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Notes</label>
          <textarea
            value={editData.notes || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
            className={styles.textarea}
            rows={2}
          />
        </div>
        <div className={styles.editActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => onSave(editData)}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.partItem}>
      <div className={styles.partMain}>
        <span className={styles.modType}>{part.mod_type}</span>
        {part.brand_name && (
          <span className={styles.brandProduct}>
            {part.brand_name}
            {part.product_name && ` ${part.product_name}`}
          </span>
        )}
      </div>
      <div className={styles.partMeta}>
        {(part.hp_gain > 0 || part.tq_gain > 0) && (
          <span className={styles.gains}>
            {part.hp_gain > 0 && `+${part.hp_gain}hp`}
            {part.hp_gain > 0 && part.tq_gain > 0 && ' / '}
            {part.tq_gain > 0 && `+${part.tq_gain}tq`}
          </span>
        )}
        {part.price_paid && (
          <span className={styles.price}>{formatPrice(part.price_paid)}</span>
        )}
        {part.is_recommended && (
          <span className={styles.recommended} title="Recommended">👍</span>
        )}
      </div>
      {part.notes && <p className={styles.partNotes}>{part.notes}</p>}
      {!readOnly && (
        <div className={styles.partActions}>
          <button className={styles.editBtn} onClick={onEdit} title="Edit">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className={styles.deleteBtn} onClick={onDelete} title="Delete">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

