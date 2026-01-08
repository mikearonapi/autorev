'use client';

/**
 * Cost Entries Table Component
 * 
 * Displays all cost entries with edit and delete functionality.
 * Supports sorting, filtering by category, and inline actions.
 */

import { useState, useMemo } from 'react';
import styles from './CostEntriesTable.module.css';
import { 
  EditIcon, 
  TrashIcon, 
  DollarSignIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FilterIcon,
  RefreshIcon,
} from './Icons';

// Category labels for display
const CATEGORY_LABELS = {
  INFRASTRUCTURE: 'Infrastructure',
  DEVELOPMENT: 'Development',
  OPERATING_EXPENSE: 'Operating',
  R_AND_D: 'R&D',
  COGS: 'COGS',
  OTHER: 'Other',
};

// Category colors
const CATEGORY_COLORS = {
  INFRASTRUCTURE: '#3b82f6', // blue
  DEVELOPMENT: '#8b5cf6',    // purple
  OPERATING_EXPENSE: '#f59e0b', // amber
  R_AND_D: '#ec4899',        // pink
  COGS: '#06b6d4',           // cyan
  OTHER: '#64748b',          // slate
};

const COST_TYPE_LABELS = {
  FIXED: 'Fixed',
  VARIABLE: 'Variable',
  ONE_TIME: 'One-Time',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CostEntriesTable({ 
  entries = [], 
  onEdit, 
  onDelete, 
  onRefresh,
  loading = false,
}) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Get unique categories from entries
  const categories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category));
    return ['all', ...Array.from(cats)];
  }, [entries]);
  
  // Sort and filter entries
  const processedEntries = useMemo(() => {
    let filtered = [...entries];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'vendor':
          aVal = (a.vendor || '').toLowerCase();
          bVal = (b.vendor || '').toLowerCase();
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [entries, categoryFilter, sortField, sortDirection]);
  
  // Calculate totals
  const totals = useMemo(() => {
    return processedEntries.reduce((acc, entry) => {
      acc.total += entry.amount;
      if (entry.isProductDev) {
        acc.rAndD += entry.amount;
      } else {
        acc.operating += entry.amount;
      }
      return acc;
    }, { total: 0, operating: 0, rAndD: 0 });
  }, [processedEntries]);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleDeleteClick = (entry) => {
    setDeleteConfirm(entry.id);
  };
  
  const handleDeleteConfirm = async (entryId) => {
    if (onDelete) {
      await onDelete(entryId);
    }
    setDeleteConfirm(null);
  };
  
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon size={12} /> 
      : <ChevronDownIcon size={12} />;
  };
  
  if (!entries || entries.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <DollarSignIcon size={18} />
            <h3>Cost Entries</h3>
          </div>
        </div>
        <div className={styles.emptyState}>
          <p>No cost entries found.</p>
          <span>Add your first cost entry using the form above.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <DollarSignIcon size={18} />
          <h3>Cost Entries</h3>
          <span className={styles.entryCount}>{processedEntries.length} entries</span>
        </div>
        
        <div className={styles.headerActions}>
          {/* Category Filter */}
          <div className={styles.filterWrapper}>
            <FilterIcon size={14} />
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </select>
          </div>
          
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className={styles.refreshButton}
              disabled={loading}
              title="Refresh entries"
            >
              <RefreshIcon size={14} className={loading ? styles.spinning : ''} />
            </button>
          )}
        </div>
      </div>
      
      {/* Totals Summary */}
      <div className={styles.totalsBar}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{formatCurrency(totals.total)}</span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Operating</span>
          <span className={styles.totalValue}>{formatCurrency(totals.operating)}</span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>R&D</span>
          <span className={`${styles.totalValue} ${styles.rAndD}`}>{formatCurrency(totals.rAndD)}</span>
        </div>
      </div>
      
      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('date')}
                className={styles.sortable}
              >
                Date <SortIcon field="date" />
              </th>
              <th 
                onClick={() => handleSort('vendor')}
                className={styles.sortable}
              >
                Vendor <SortIcon field="vendor" />
              </th>
              <th>Description</th>
              <th 
                onClick={() => handleSort('category')}
                className={styles.sortable}
              >
                Category <SortIcon field="category" />
              </th>
              <th>Type</th>
              <th 
                onClick={() => handleSort('amount')}
                className={`${styles.sortable} ${styles.amountHeader}`}
              >
                Amount <SortIcon field="amount" />
              </th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedEntries.map((entry) => (
              <tr key={entry.id} className={entry.isProductDev ? styles.rAndDRow : ''}>
                <td className={styles.dateCell}>
                  {formatDate(entry.date)}
                </td>
                <td className={styles.vendorCell}>
                  {entry.vendor || '—'}
                </td>
                <td className={styles.descriptionCell}>
                  <span title={entry.description}>{entry.description}</span>
                  {entry.isRecurring && (
                    <span className={styles.recurringBadge} title="Recurring expense">↻</span>
                  )}
                </td>
                <td>
                  <span 
                    className={styles.categoryBadge}
                    style={{ 
                      backgroundColor: `${CATEGORY_COLORS[entry.category] || '#64748b'}20`,
                      color: CATEGORY_COLORS[entry.category] || '#64748b',
                      borderColor: `${CATEGORY_COLORS[entry.category] || '#64748b'}40`,
                    }}
                  >
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                </td>
                <td>
                  <span className={styles.typeBadge}>
                    {COST_TYPE_LABELS[entry.type] || entry.type}
                  </span>
                </td>
                <td className={styles.amountCell}>
                  {formatCurrency(entry.amount)}
                </td>
                <td className={styles.actionsCell}>
                  {deleteConfirm === entry.id ? (
                    <div className={styles.confirmDelete}>
                      <span>Delete?</span>
                      <button 
                        onClick={() => handleDeleteConfirm(entry.id)}
                        className={styles.confirmYes}
                        title="Confirm delete"
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(null)}
                        className={styles.confirmNo}
                        title="Cancel"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => onEdit?.(entry)}
                        className={styles.editButton}
                        title="Edit entry"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(entry)}
                        className={styles.deleteButton}
                        title="Delete entry"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CostEntriesTable;









