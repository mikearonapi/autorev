'use client';

/**
 * Service Log Modal
 * 
 * Modal for adding/editing service log entries for owned vehicles.
 * Supports various service types with smart defaults and cost tracking.
 */

import { useState, useEffect } from 'react';
import styles from './ServiceLogModal.module.css';

// Service categories and types
const SERVICE_CATEGORIES = {
  oil_change: {
    label: 'Oil Change',
    icon: '🛢️',
    types: ['Oil Change', 'Oil & Filter Change', 'Synthetic Oil Change'],
    defaultInterval: { miles: 5000, months: 6 },
  },
  tire: {
    label: 'Tires & Wheels',
    icon: '🔧',
    types: ['Tire Rotation', 'Tire Replacement', 'Wheel Alignment', 'Tire Balance', 'TPMS Service'],
    defaultInterval: { miles: 7500, months: null },
  },
  brake: {
    label: 'Brakes',
    icon: '🛑',
    types: ['Brake Pad Replacement', 'Brake Rotor Replacement', 'Brake Fluid Flush', 'Caliper Service', 'Brake Inspection'],
    defaultInterval: { miles: 30000, months: null },
  },
  fluid: {
    label: 'Fluids',
    icon: '💧',
    types: ['Coolant Flush', 'Transmission Fluid Change', 'Differential Fluid Change', 'Power Steering Flush', 'Brake Fluid Flush'],
    defaultInterval: { miles: 30000, months: 24 },
  },
  filter: {
    label: 'Filters',
    icon: '🔲',
    types: ['Air Filter Replacement', 'Cabin Filter Replacement', 'Fuel Filter Replacement'],
    defaultInterval: { miles: 15000, months: 12 },
  },
  electrical: {
    label: 'Electrical',
    icon: '⚡',
    types: ['Battery Replacement', 'Alternator Service', 'Starter Replacement', 'Spark Plug Replacement'],
    defaultInterval: { miles: null, months: 48 },
  },
  engine: {
    label: 'Engine',
    icon: '🔩',
    types: ['Timing Belt/Chain Service', 'Serpentine Belt Replacement', 'Engine Tune-Up', 'Valve Adjustment'],
    defaultInterval: { miles: 60000, months: null },
  },
  suspension: {
    label: 'Suspension',
    icon: '🏎️',
    types: ['Shock/Strut Replacement', 'Spring Replacement', 'Sway Bar Service', 'Bushing Replacement', 'Alignment'],
    defaultInterval: { miles: 50000, months: null },
  },
  other: {
    label: 'Other',
    icon: '🔧',
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
    nextServiceMiles: '',
    nextServiceDate: '',
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
        nextServiceMiles: editingLog.next_service_miles || '',
        nextServiceDate: editingLog.next_service_date || '',
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
        nextServiceMiles: '',
        nextServiceDate: '',
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

  // Calculate next service based on defaults
  const calculateNextService = () => {
    const categoryData = SERVICE_CATEGORIES[formData.serviceCategory];
    if (!categoryData?.defaultInterval) return;

    const currentMileage = parseInt(formData.mileage) || 0;
    
    if (categoryData.defaultInterval.miles && currentMileage) {
      setFormData(prev => ({
        ...prev,
        nextServiceMiles: currentMileage + categoryData.defaultInterval.miles,
      }));
    }

    if (categoryData.defaultInterval.months) {
      const nextDate = new Date(formData.serviceDate);
      nextDate.setMonth(nextDate.getMonth() + categoryData.defaultInterval.months);
      setFormData(prev => ({
        ...prev,
        nextServiceDate: nextDate.toISOString().split('T')[0],
      }));
    }
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
  const handleSubmit = async (e) => {
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
        nextServiceMiles: parseInt(formData.nextServiceMiles) || null,
        nextServiceDate: formData.nextServiceDate || null,
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

        <form onSubmit={handleSubmit} className={styles.form}>
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

          {/* Next Service Reminder */}
          <div className={styles.reminderSection}>
            <div className={styles.reminderHeader}>
              <h3 className={styles.sectionTitle}>Next Service Reminder</h3>
              <button 
                type="button" 
                className={styles.autoCalcBtn}
                onClick={calculateNextService}
              >
                Auto-calculate
              </button>
            </div>
            <div className={styles.reminderGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Due at Miles</label>
                <input
                  type="number"
                  value={formData.nextServiceMiles}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextServiceMiles: e.target.value }))}
                  className={styles.input}
                  placeholder="Next service miles"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Due by Date</label>
                <input
                  type="date"
                  value={formData.nextServiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextServiceDate: e.target.value }))}
                  className={styles.input}
                />
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












