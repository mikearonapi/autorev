'use client';

/**
 * WheelTireSpecsCard Component
 * 
 * Displays wheel/tire specs with inline editing capability.
 * Shows stock values by default, with ability to record custom specs.
 * Edit happens where you view - no navigation to another tab.
 * 
 * @module components/WheelTireSpecsCard
 */

import React, { useState, useCallback } from 'react';

import { Icons } from '@/components/ui/Icons';

import styles from './WheelTireSpecsCard.module.css';

/**
 * Single spec row with inline edit capability
 */
function SpecRow({ label, stockValue, customValue, onSave, placeholder, isEditing, onStartEdit }) {
  const [editValue, setEditValue] = useState(customValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [localEditing, setLocalEditing] = useState(false);

  const hasCustom = customValue && customValue !== stockValue;
  const displayValue = customValue || stockValue || '—';

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editValue || null); // null to clear
    setIsSaving(false);
    setLocalEditing(false);
  };

  const handleCancel = () => {
    setEditValue(customValue || '');
    setLocalEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (localEditing) {
    return (
      <div className={styles.specRow}>
        <span className={styles.specLabel}>{label}</span>
        <div className={styles.editContainer}>
          <input
            type="text"
            className={styles.editInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || stockValue || 'Enter value'}
            autoFocus
          />
          <button 
            className={styles.editActionBtn} 
            onClick={handleSave}
            disabled={isSaving}
            title="Save"
          >
            {isSaving ? <Icons.loader size={14} className={styles.spinning} /> : <Icons.check size={14} />}
          </button>
          <button 
            className={styles.editActionBtn} 
            onClick={handleCancel}
            disabled={isSaving}
            title="Cancel"
          >
            <Icons.x size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.specRow} ${hasCustom ? styles.hasCustom : ''} ${isEditing ? styles.editable : ''}`}
      onClick={isEditing ? () => setLocalEditing(true) : undefined}
    >
      <span className={styles.specLabel}>{label}</span>
      <span className={`${styles.specValue} ${hasCustom ? styles.customValue : ''}`}>
        {displayValue}
        {hasCustom && stockValue && (
          <span className={styles.stockHint}>was {stockValue}</span>
        )}
      </span>
      {isEditing && !localEditing && (
        <button 
          className={styles.rowEditBtn}
          onClick={(e) => { e.stopPropagation(); setLocalEditing(true); }}
          title="Edit"
        >
          <Icons.edit size={12} />
        </button>
      )}
    </div>
  );
}

/**
 * WheelTireSpecsCard - displays wheel/tire specs with inline editing
 */
export default function WheelTireSpecsCard({
  stockSpecs = {},
  customSpecs = {},
  onUpdateCustomSpecs,
  fitmentOptions = [],
  showFitmentToggle = true,
  carName,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showFitments, setShowFitments] = useState(false);

  const wheels = customSpecs?.wheels || {};
  const tires = customSpecs?.tires || {};

  // Helper to update a nested custom spec value
  const updateSpec = useCallback(async (path, value) => {
    if (!onUpdateCustomSpecs) return;

    const parts = path.split('.');
    const newSpecs = JSON.parse(JSON.stringify(customSpecs || {}));
    
    let current = newSpecs;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    
    if (value === null || value === '') {
      delete current[parts[parts.length - 1]];
    } else {
      current[parts[parts.length - 1]] = value;
    }

    await onUpdateCustomSpecs(newSpecs);
  }, [customSpecs, onUpdateCustomSpecs]);

  const hasAnyCustom = wheels.front?.size || wheels.rear?.size || 
                       wheels.front?.brand || tires.front?.size || 
                       tires.front?.brand || wheels.boltPattern;

  const hasAnyData = hasAnyCustom || 
                     stockSpecs?.wheel_bolt_pattern ||
                     stockSpecs?.wheel_size_front ||
                     stockSpecs?.tire_size_front;

  if (!hasAnyData) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h4 className={styles.title}>
            <span>Tires & Wheels</span>
          </h4>
        </div>
        <div className={styles.emptyState}>
          <p>Wheel and tire specs not yet available.</p>
          <p className={styles.emptyHint}>
            Check your owner's manual or door jamb sticker for specifications.
          </p>
          {onUpdateCustomSpecs && (
            <button 
              className={styles.addSpecsBtn}
              onClick={() => setIsEditing(true)}
            >
              <Icons.edit size={14} />
              Record Your Specs
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h4 className={styles.title}>
            <span>
              Tires & Wheels
              {hasAnyCustom && <span className={styles.customBadge}>Your Specs</span>}
            </span>
          </h4>
          {onUpdateCustomSpecs && (
            <button 
              className={`${styles.editToggle} ${isEditing ? styles.active : ''}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              <Icons.edit size={14} />
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
        {isEditing && (
          <p className={styles.editHint}>Click any value to customize it</p>
        )}
      </div>

      <div className={styles.specsGrid}>
        {/* Wheels Section */}
        {(wheels.front?.brand || stockSpecs?.wheel_size_front || isEditing) && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Wheels</span>
            
            {(wheels.front?.brand || isEditing) && (
              <SpecRow
                label="Front"
                stockValue={stockSpecs?.wheel_size_front}
                customValue={wheels.front?.brand 
                  ? `${wheels.front.brand}${wheels.front.model ? ` ${wheels.front.model}` : ''} ${wheels.front.size || ''}${wheels.front.offset ? ` ${wheels.front.offset}` : ''}`.trim()
                  : wheels.front?.size}
                onSave={(val) => updateSpec('wheels.front.size', val)}
                placeholder="e.g., 19x9.5 +22"
                isEditing={isEditing}
              />
            )}
            
            {!wheels.front?.brand && stockSpecs?.wheel_size_front && !isEditing && (
              <SpecRow
                label="Front"
                stockValue={stockSpecs?.wheel_size_front}
                customValue={wheels.front?.size}
                onSave={(val) => updateSpec('wheels.front.size', val)}
                isEditing={isEditing}
              />
            )}

            {(wheels.rear?.brand || stockSpecs?.wheel_size_rear || isEditing) && (
              <SpecRow
                label="Rear"
                stockValue={stockSpecs?.wheel_size_rear}
                customValue={wheels.rear?.brand 
                  ? `${wheels.rear.brand}${wheels.rear.model ? ` ${wheels.rear.model}` : ''} ${wheels.rear.size || ''}${wheels.rear.offset ? ` ${wheels.rear.offset}` : ''}`.trim()
                  : wheels.rear?.size}
                onSave={(val) => updateSpec('wheels.rear.size', val)}
                placeholder="e.g., 19x10.5 +25"
                isEditing={isEditing}
              />
            )}
          </div>
        )}

        {/* Tires Section */}
        {(tires.front?.brand || stockSpecs?.tire_size_front || isEditing) && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Tires</span>
            
            <SpecRow
              label="Front"
              stockValue={stockSpecs?.tire_size_front}
              customValue={tires.front?.brand 
                ? `${tires.front.size || ''} ${tires.front.brand}${tires.front.model ? ` ${tires.front.model}` : ''}`.trim()
                : tires.front?.size}
              onSave={(val) => updateSpec('tires.front.size', val)}
              placeholder="e.g., 265/35R19"
              isEditing={isEditing}
            />

            {(tires.rear?.brand || stockSpecs?.tire_size_rear || isEditing) && (
              <SpecRow
                label="Rear"
                stockValue={stockSpecs?.tire_size_rear}
                customValue={tires.rear?.brand 
                  ? `${tires.rear.size || ''} ${tires.rear.brand}${tires.rear.model ? ` ${tires.rear.model}` : ''}`.trim()
                  : tires.rear?.size}
                onSave={(val) => updateSpec('tires.rear.size', val)}
                placeholder="e.g., 295/35R19"
                isEditing={isEditing}
              />
            )}
          </div>
        )}

        {/* Pressures */}
        {(stockSpecs?.tire_pressure_front_psi || tires.front?.pressure || isEditing) && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Pressure</span>
            
            <SpecRow
              label="Front PSI"
              stockValue={stockSpecs?.tire_pressure_front_psi ? `${stockSpecs.tire_pressure_front_psi}` : null}
              customValue={tires.front?.pressure}
              onSave={(val) => updateSpec('tires.front.pressure', val)}
              placeholder="e.g., 36"
              isEditing={isEditing}
            />

            <SpecRow
              label="Rear PSI"
              stockValue={stockSpecs?.tire_pressure_rear_psi ? `${stockSpecs.tire_pressure_rear_psi}` : null}
              customValue={tires.rear?.pressure}
              onSave={(val) => updateSpec('tires.rear.pressure', val)}
              placeholder="e.g., 38"
              isEditing={isEditing}
            />
          </div>
        )}

        {/* Fitment Info */}
        {(stockSpecs?.wheel_bolt_pattern || stockSpecs?.wheel_center_bore_mm || isEditing) && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Fitment</span>
            
            {(stockSpecs?.wheel_bolt_pattern || wheels.boltPattern || isEditing) && (
              <SpecRow
                label="Bolt Pattern"
                stockValue={stockSpecs?.wheel_bolt_pattern}
                customValue={wheels.boltPattern}
                onSave={(val) => updateSpec('wheels.boltPattern', val)}
                placeholder="e.g., 5x114.3"
                isEditing={isEditing}
              />
            )}

            {(stockSpecs?.wheel_center_bore_mm || wheels.centerBore || isEditing) && (
              <SpecRow
                label="Center Bore"
                stockValue={stockSpecs?.wheel_center_bore_mm ? `${stockSpecs.wheel_center_bore_mm} mm` : null}
                customValue={wheels.centerBore ? `${wheels.centerBore} mm` : null}
                onSave={(val) => updateSpec('wheels.centerBore', val?.replace(' mm', ''))}
                placeholder="e.g., 73.1"
                isEditing={isEditing}
              />
            )}

            {(stockSpecs?.wheel_lug_torque_ft_lbs || wheels.lugTorque || isEditing) && (
              <SpecRow
                label="Lug Torque"
                stockValue={stockSpecs?.wheel_lug_torque_ft_lbs ? `${stockSpecs.wheel_lug_torque_ft_lbs} ft-lbs` : null}
                customValue={wheels.lugTorque ? `${wheels.lugTorque} ft-lbs` : null}
                onSave={(val) => updateSpec('wheels.lugTorque', val?.replace(' ft-lbs', ''))}
                placeholder="e.g., 85"
                isEditing={isEditing}
              />
            )}
          </div>
        )}
      </div>

      {/* Compatible Fitments */}
      {showFitmentToggle && fitmentOptions.length > 1 && (
        <>
          <button 
            className={styles.fitmentToggle}
            onClick={() => setShowFitments(!showFitments)}
          >
            {showFitments ? '▾' : '▸'} Compatible Sizes ({fitmentOptions.length - 1} upgrade options)
          </button>
          
          {showFitments && (
            <div className={styles.fitmentList}>
              {fitmentOptions.filter(f => f.fitment_type !== 'oem').map((fit, idx) => (
                <div key={fit.id || idx} className={styles.fitmentOption}>
                  <div className={styles.fitmentHeader}>
                    <span className={styles.fitmentType}>
                      {fit.fitment_type === 'oem_optional' ? 'OEM Option' :
                       fit.fitment_type === 'plus_one' ? '+1 Size' :
                       fit.fitment_type === 'plus_two' ? '+2 Size' :
                       fit.fitment_type === 'aggressive' ? 'Aggressive' :
                       fit.fitment_type === 'square' ? 'Square' :
                       fit.fitment_type === 'conservative' ? 'Conservative' :
                       fit.fitment_type}
                    </span>
                    {fit.verified && <span className={styles.fitmentVerified}>✓</span>}
                  </div>
                  <div className={styles.fitmentSpecs}>
                    <span>Wheels: {fit.wheel_diameter_inches}×{fit.wheel_width_front}F / {fit.wheel_diameter_inches}×{fit.wheel_width_rear}R</span>
                    <span>Tires: {fit.tire_size_front} / {fit.tire_size_rear}</span>
                  </div>
                  {fit.clearance_notes && (
                    <div className={styles.fitmentNotes}>{fit.clearance_notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

