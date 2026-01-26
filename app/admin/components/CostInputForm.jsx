'use client';

/**
 * Cost Input Form Component
 * 
 * Form for manually entering or editing cost/expense entries.
 * Supports categorization, GL accounts, and recurring expenses.
 */

import { useState, useEffect } from 'react';
import styles from './CostInputForm.module.css';
import { DollarSignIcon, CheckCircleIcon, AlertCircleIcon, EditIcon } from './Icons';

// GL Account groups for the dropdown
const GL_ACCOUNT_GROUPS = {
  'Operating Expenses (6xxx)': [
    { code: '6110', name: 'Supabase', vendor: 'Supabase' },
    { code: '6120', name: 'Vercel', vendor: 'Vercel' },
    { code: '6130', name: 'Domain & DNS', vendor: 'Domain Registrar' },
    { code: '6210', name: 'Cursor IDE', vendor: 'Cursor' },
    { code: '6220', name: 'Claude Pro', vendor: 'Anthropic' },
    { code: '6230', name: 'GitHub/Source Control', vendor: 'GitHub' },
    { code: '6300', name: 'Marketing', vendor: null },
    { code: '6400', name: 'Professional Services', vendor: null },
    { code: '6500', name: 'Software Subscriptions', vendor: null },
    { code: '6900', name: 'Other Operating Expenses', vendor: 'Other' },
  ],
  'R&D / Product Development (7xxx)': [
    { code: '7100', name: 'Product Development - Launch', vendor: null },
    { code: '7200', name: 'Product Development - Ongoing', vendor: null },
    { code: '7300', name: 'API Development Costs', vendor: 'Cursor' },
  ],
  'Cost of Goods Sold (5xxx)': [
    { code: '5100', name: 'AI API Costs (Production)', vendor: 'Anthropic' },
    { code: '5200', name: 'Infrastructure Variable', vendor: null },
  ],
};

const COST_TYPES = [
  { value: 'FIXED', label: 'Fixed (Monthly)' },
  { value: 'VARIABLE', label: 'Variable (Usage-based)' },
  { value: 'ONE_TIME', label: 'One-Time' },
];

// Helper: Find GL code from account ID
function findGLCodeFromId(glAccountId, glAccounts) {
  if (!glAccountId || !glAccounts?.length) return '';
  const account = glAccounts.find(gl => gl.id === glAccountId);
  return account?.code || '';
}

// Helper: Find GL code from category if no account ID
function findGLCodeFromCategory(category, isProductDev) {
  if (isProductDev) return '7200'; // Default R&D code
  switch (category) {
    case 'INFRASTRUCTURE': return '6110';
    case 'DEVELOPMENT': return '6210';
    case 'COGS': return '5100';
    default: return '6900';
  }
}

export function CostInputForm({ onSubmit, onCancel, glAccounts = [], editEntry = null }) {
  const isEditMode = !!editEntry;
  
  const getInitialFormData = () => ({
    entryDate: new Date().toISOString().split('T')[0],
    glAccountCode: '',
    costType: 'FIXED',
    vendor: '',
    amount: '',
    description: '',
    isRecurring: false,
    recurrencePeriod: 'MONTHLY',
  });
  
  const [formData, setFormData] = useState(getInitialFormData());
  
  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      // Find the GL code - either from the account ID or derive from category
      let glCode = '';
      if (editEntry.glAccountId) {
        glCode = findGLCodeFromId(editEntry.glAccountId, glAccounts);
      }
      if (!glCode && editEntry.category) {
        glCode = findGLCodeFromCategory(editEntry.category, editEntry.isProductDev);
      }
      
      setFormData({
        entryDate: editEntry.date || new Date().toISOString().split('T')[0],
        glAccountCode: glCode,
        costType: editEntry.type || 'FIXED',
        vendor: editEntry.vendor || '',
        amount: editEntry.amount?.toString() || '',
        description: editEntry.description || '',
        isRecurring: editEntry.isRecurring || false,
        recurrencePeriod: 'MONTHLY',
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [editEntry, glAccounts]);
  
  // Derive category and isProductDevelopment from GL account code
  const selectedGLCode = formData.glAccountCode;
  const isProductDevelopment = selectedGLCode?.startsWith('7');
  const costCategory = selectedGLCode?.startsWith('5') ? 'COGS' :
                       selectedGLCode?.startsWith('6') ? 'OPERATING_EXPENSE' :
                       selectedGLCode?.startsWith('7') ? 'R_AND_D' : 'OTHER';
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleCostInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };
  
  const handleCostEntrySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      // Validate
      if (!formData.glAccountCode) {
        throw new Error('Please select a GL Account');
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!formData.description.trim()) {
        throw new Error('Please enter a description');
      }
      
      const amountCents = Math.round(parseFloat(formData.amount) * 100);
      
      // Find the GL account ID from the code
      const glAccount = glAccounts.find(gl => gl.code === formData.glAccountCode);
      
      const submitData = {
        entryDate: formData.entryDate,
        glAccountId: glAccount?.id || null,
        costCategory: costCategory,
        costType: formData.costType,
        vendor: formData.vendor,
        amountCents,
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurrencePeriod: formData.isRecurring ? formData.recurrencePeriod : null,
        isProductDevelopment: isProductDevelopment,
      };
      
      // Include ID if editing
      if (isEditMode && editEntry?.id) {
        submitData.id = editEntry.id;
      }
      
      await onSubmit(submitData, isEditMode);
      
      setSuccess(true);
      
      // Reset form after success (only for new entries, not edits)
      setTimeout(() => {
        if (!isEditMode) {
          setFormData({
            entryDate: new Date().toISOString().split('T')[0],
            glAccountCode: '',
            costType: 'FIXED',
            vendor: '',
            amount: '',
            description: '',
            isRecurring: false,
            recurrencePeriod: 'MONTHLY',
          });
        }
        setSuccess(false);
        // Call onCancel to close form after edit
        if (isEditMode && onCancel) {
          onCancel();
        }
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className={`${styles.container} ${isEditMode ? styles.editMode : ''}`}>
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${isEditMode ? styles.editIcon : ''}`}>
          {isEditMode ? <EditIcon size={18} /> : <DollarSignIcon size={18} />}
        </div>
        <h3 className={styles.title}>{isEditMode ? 'Edit Cost Entry' : 'Add Cost Entry'}</h3>
      </div>
      
      {success && (
        <div className={styles.successMessage}>
          <CheckCircleIcon size={16} />
          <span>Cost entry {isEditMode ? 'updated' : 'added'} successfully!</span>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircleIcon size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleCostEntrySubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Date</label>
            <input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={handleCostInputChange}
              required
            />
          </div>
          
          <div className={styles.field}>
            <label>Amount ($)</label>
            <input
              type="number"
              inputMode="decimal"
              name="amount"
              value={formData.amount}
              onChange={handleCostInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>
        
        {/* GL Account Selection - Primary categorization */}
        <div className={styles.field}>
          <label>GL Account *</label>
          <select 
            name="glAccountCode" 
            value={formData.glAccountCode} 
            onChange={handleCostInputChange}
            required
          >
            <option value="">Select GL Account...</option>
            {Object.entries(GL_ACCOUNT_GROUPS).map(([group, accounts]) => (
              <optgroup key={group} label={group}>
                {accounts.map(acc => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {isProductDevelopment && (
            <span className={styles.glHint}>R&D expense - tracked separately from operating costs</span>
          )}
        </div>
        
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Cost Type</label>
            <select name="costType" value={formData.costType} onChange={handleCostInputChange}>
              {COST_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.field}>
            <label>Vendor</label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor}
              onChange={handleCostInputChange}
              placeholder="e.g., Supabase, Vercel, Anthropic"
            />
          </div>
        </div>
        
        <div className={styles.field}>
          <label>Description *</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleCostInputChange}
            placeholder="e.g., Supabase Pro - December 2024"
            required
          />
        </div>
        
        <div className={styles.checkboxRow}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleCostInputChange}
            />
            <span>Recurring monthly expense</span>
          </label>
        </div>
        
        <div className={styles.actions}>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={submitting} className={`${styles.submitButton} ${isEditMode ? styles.editButton : ''}`}>
            {submitting 
              ? (isEditMode ? 'Saving...' : 'Adding...') 
              : (isEditMode ? 'Save Changes' : 'Add Entry')
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default CostInputForm;

