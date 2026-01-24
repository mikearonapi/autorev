'use client';

/**
 * Service Log Modal
 * 
 * Modal for adding/editing service log entries for owned vehicles.
 * Supports various service types with smart defaults and cost tracking.
 */

import { useState, useEffect } from 'react';
import styles from './ServiceLogModal.module.css';

// SVG Icons for service categories
const ServiceIcons = {
  oil: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  tire: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  brake: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  fluid: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  filter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  electrical: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  engine: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  suspension: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  wrench: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
};

// Service categories and types
const SERVICE_CATEGORIES = {
  oil_change: {
    label: 'Oil Change',
    icon: ServiceIcons.oil,
    types: ['Oil Change', 'Oil & Filter Change', 'Synthetic Oil Change'],
    defaultInterval: { miles: 5000, months: 6 },
  },
  tire: {
    label: 'Tires & Wheels',
    icon: ServiceIcons.tire,
    types: ['Tire Rotation', 'Tire Replacement', 'Wheel Alignment', 'Tire Balance', 'TPMS Service'],
    defaultInterval: { miles: 7500, months: null },
  },
  brake: {
    label: 'Brakes',
    icon: ServiceIcons.brake,
    types: ['Brake Pad Replacement', 'Brake Rotor Replacement', 'Brake Fluid Flush', 'Caliper Service', 'Brake Inspection'],
    defaultInterval: { miles: 30000, months: null },
  },
  fluid: {
    label: 'Fluids',
    icon: ServiceIcons.fluid,
    types: ['Coolant Flush', 'Transmission Fluid Change', 'Differential Fluid Change', 'Power Steering Flush', 'Brake Fluid Flush'],
    defaultInterval: { miles: 30000, months: 24 },
  },
  filter: {
    label: 'Filters',
    icon: ServiceIcons.filter,
    types: ['Air Filter Replacement', 'Cabin Filter Replacement', 'Fuel Filter Replacement'],
    defaultInterval: { miles: 15000, months: 12 },
  },
  electrical: {
    label: 'Electrical',
    icon: ServiceIcons.electrical,
    types: ['Battery Replacement', 'Alternator Service', 'Starter Replacement', 'Spark Plug Replacement'],
    defaultInterval: { miles: null, months: 48 },
  },
  engine: {
    label: 'Engine',
    icon: ServiceIcons.engine,
    types: ['Timing Belt/Chain Service', 'Serpentine Belt Replacement', 'Engine Tune-Up', 'Valve Adjustment'],
    defaultInterval: { miles: 60000, months: null },
  },
  suspension: {
    label: 'Suspension',
    icon: ServiceIcons.suspension,
    types: ['Shock/Strut Replacement', 'Spring Replacement', 'Sway Bar Service', 'Bushing Replacement', 'Alignment'],
    defaultInterval: { miles: 50000, months: null },
  },
  other: {
    label: 'Other',
    icon: ServiceIcons.wrench,
    types: ['Inspection', 'Recall Service', 'Warranty Work', 'Custom/Other'],
    defaultInterval: { miles: null, months: 12 },
  },
};

const PERFORMED_BY_OPTIONS = [
  { value: 'self', label: 'Self (DIY)' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'independent', label: 'Independent Shop' },
  { value: 'mobile', label: 'Mobile Mechanic' },
  { value: 'other', label: 'Other' },
];

export default function ServiceLogModal({ 
  isOpen, 
  onClose, 
  onSave, 
  vehicleInfo,
  editingLog = null,
}) {
  const [formData, setFormData] = useState({
    serviceDate: new Date().toISOString().split('T')[0],
    serviceCategory: 'oil_change',
    serviceType: 'Oil & Filter Change',
    description: '',
    mileage: '',
    performedBy: 'self',
    shopName: '',
    partsCost: '',
    laborCost: '',
    notes: '',
    warrantyCovered: false,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (editingLog) {
      setFormData({
        serviceDate: editingLog.service_date || new Date().toISOString().split('T')[0],
        serviceCategory: editingLog.service_category || 'other',
        serviceType: editingLog.service_type || '',
        description: editingLog.service_description || '',
        mileage: editingLog.odometer_reading || '',
        performedBy: editingLog.performed_by || 'self',
        shopName: editingLog.shop_name || '',
        partsCost: editingLog.parts_cost || '',
        laborCost: editingLog.labor_cost || '',
        notes: editingLog.notes || '',
        warrantyCovered: editingLog.warranty_covered || false,
      });
    } else {
      // Reset form for new entry
      setFormData({
        serviceDate: new Date().toISOString().split('T')[0],
        serviceCategory: 'oil_change',
        serviceType: 'Oil & Filter Change',
        description: '',
        mileage: vehicleInfo?.currentMileage || '',
        performedBy: 'self',
        shopName: '',
        partsCost: '',
        laborCost: '',
        notes: '',
        warrantyCovered: false,
      });
    }
  }, [editingLog, vehicleInfo, isOpen]);

  // Update service type when category changes
  const handleCategoryChange = (category) => {
    const categoryData = SERVICE_CATEGORIES[category];
    setFormData(prev => ({
      ...prev,
      serviceCategory: category,
      serviceType: categoryData.types[0],
    }));
  };

  // Calculate total cost
  const totalCost = (parseFloat(formData.partsCost) || 0) + (parseFloat(formData.laborCost) || 0);

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.serviceDate) {
      newErrors.serviceDate = 'Service date is required';
    }
    if (!formData.serviceType) {
      newErrors.serviceType = 'Service type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleServiceLogSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        serviceDate: formData.serviceDate,
        serviceCategory: formData.serviceCategory,
        serviceType: formData.serviceType,
        description: formData.description,
        mileage: parseInt(formData.mileage) || null,
        performedBy: formData.performedBy,
        shopName: formData.shopName || null,
        partsCost: parseFloat(formData.partsCost) || null,
        laborCost: parseFloat(formData.laborCost) || null,
        totalCost: totalCost || null,
        notes: formData.notes || null,
        warrantyCovered: formData.warrantyCovered,
        isScheduledMaintenance: true,
      });
      
      onClose();
    } catch (err) {
      console.error('[ServiceLogModal] Error saving:', err);
      setErrors({ submit: 'Failed to save service log. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editingLog ? 'Edit Service Record' : 'Log Service'}
          </h2>
          {vehicleInfo && (
            <p className={styles.vehicleInfo}>
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </p>
          )}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleServiceLogSubmit} className={styles.form}>
          {/* Service Category Selection */}
          <div className={styles.categoryGrid}>
            {Object.entries(SERVICE_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                className={`${styles.categoryBtn} ${formData.serviceCategory === key ? styles.categoryActive : ''}`}
                onClick={() => handleCategoryChange(key)}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryLabel}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Main Form Fields */}
          <div className={styles.formGrid}>
            {/* Service Type */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Service Type *</label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                className={styles.select}
              >
                {SERVICE_CATEGORIES[formData.serviceCategory]?.types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.serviceType && <span className={styles.error}>{errors.serviceType}</span>}
            </div>

            {/* Service Date */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Service Date *</label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                className={styles.input}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.serviceDate && <span className={styles.error}>{errors.serviceDate}</span>}
            </div>

            {/* Mileage */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Odometer Reading</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                className={styles.input}
                placeholder="Current miles"
              />
            </div>

            {/* Performed By */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Performed By</label>
              <select
                value={formData.performedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, performedBy: e.target.value }))}
                className={styles.select}
              >
                {PERFORMED_BY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Shop Name (conditional) */}
            {formData.performedBy !== 'self' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Shop Name</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                  className={styles.input}
                  placeholder="Shop or dealership name"
                />
              </div>
            )}

            {/* Warranty Covered */}
            <div className={styles.formGroupInline}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.warrantyCovered}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyCovered: e.target.checked }))}
                  className={styles.checkbox}
                />
                Covered by warranty
              </label>
            </div>
          </div>

          {/* Cost Section */}
          <div className={styles.costSection}>
            <h3 className={styles.sectionTitle}>Cost Tracking</h3>
            <div className={styles.costGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Parts Cost</label>
                <div className={styles.inputWithPrefix}>
                  <span className={styles.prefix}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.partsCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, partsCost: e.target.value }))}
                    className={styles.input}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Labor Cost</label>
                <div className={styles.inputWithPrefix}>
                  <span className={styles.prefix}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, laborCost: e.target.value }))}
                    className={styles.input}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className={styles.totalCost}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className={styles.textarea}
              placeholder="Parts used, observations, recommendations..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className={styles.submitError}>{errors.submit}</div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.saveBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingLog ? 'Update' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}












