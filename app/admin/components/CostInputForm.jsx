'use client';

/**
 * Cost Input Form Component
 * 
 * Form for manually entering cost/expense entries.
 * Supports categorization, GL accounts, and recurring expenses.
 */

import { useState } from 'react';
import styles from './CostInputForm.module.css';
import { DollarSignIcon, CheckCircleIcon, AlertCircleIcon } from './Icons';

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

export function CostInputForm({ onSubmit, onCancel, glAccounts = [] }) {
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    glAccountCode: '',  // Primary categorization method
    costType: 'FIXED',
    vendor: '',
    amount: '',
    description: '',
    isRecurring: false,
    recurrencePeriod: 'MONTHLY',
  });
  
  // Derive category and isProductDevelopment from GL account code
  const selectedGLCode = formData.glAccountCode;
  const isProductDevelopment = selectedGLCode?.startsWith('7');
  const costCategory = selectedGLCode?.startsWith('5') ? 'COGS' :
                       selectedGLCode?.startsWith('6') ? 'OPERATING_EXPENSE' :
                       selectedGLCode?.startsWith('7') ? 'R_AND_D' : 'OTHER';
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };
  
  const handleSubmit = async (e) => {
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
      
      await onSubmit({
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
      });
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
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
        setSuccess(false);
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <DollarSignIcon size={18} />
        </div>
        <h3 className={styles.title}>Add Cost Entry</h3>
      </div>
      
      {success && (
        <div className={styles.successMessage}>
          <CheckCircleIcon size={16} />
          <span>Cost entry added successfully!</span>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircleIcon size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Date</label>
            <input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.field}>
            <label>Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
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
            onChange={handleChange}
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
            <select name="costType" value={formData.costType} onChange={handleChange}>
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
              onChange={handleChange}
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
            onChange={handleChange}
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
              onChange={handleChange}
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
          <button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CostInputForm;

