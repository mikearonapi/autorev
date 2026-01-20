'use client';

/**
 * ALAttachmentMenu Component
 * 
 * Allows users to attach files/photos to AL conversations:
 * - Photo capture (mobile camera)
 * - Photo upload from gallery
 * - Document upload (PDF)
 * 
 * Designed to be embedded in ALPageClient and AIMechanicChat.
 */

import { useState, useRef, useCallback } from 'react';
import styles from './ALAttachmentMenu.module.css';

// SVG Icons
const Icons = {
  // Close icon
  close: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  // Camera icon
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  // Image/Gallery icon
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  // Document icon
  document: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  // Small document icon for preview
  documentSmall: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
};

// Supported file types
const ACCEPTED_FILE_TYPES = {
  image: 'image/jpeg,image/png,image/gif,image/webp,image/heic',
  document: 'application/pdf',
};

const MAX_FILE_SIZE_MB = 10;

/**
 * ALAttachmentMenu - File attachment options for AL
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the menu is visible
 * @param {Function} props.onClose - Callback when menu is closed
 * @param {Function} props.onAttachmentAdd - Callback when an attachment is added
 * @param {Array} props.currentAttachments - Currently attached files
 * @param {number} props.maxAttachments - Maximum number of attachments (default: 5)
 */
export default function ALAttachmentMenu({
  isOpen,
  onClose,
  onAttachmentAdd,
  currentAttachments = [],
  maxAttachments = 5,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (event, source) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    setError(null);
    
    // Check if we've hit the attachment limit
    const remainingSlots = maxAttachments - currentAttachments.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxAttachments} attachments allowed`);
      return;
    }
    
    // Process files (up to remaining slots)
    const filesToProcess = files.slice(0, remainingSlots);
    
    for (const file of filesToProcess) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      
      setUploading(true);
      
      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', source); // camera, gallery, or document
        
        // Upload to server
        const response = await fetch('/api/al/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }
        
        const data = await response.json();
        
        // Notify parent with attachment info
        if (onAttachmentAdd && data.attachment) {
          onAttachmentAdd({
            id: data.attachment.id,
            file_name: data.attachment.file_name,
            file_type: data.attachment.file_type,
            file_size: data.attachment.file_size,
            file_category: data.attachment.file_category,
            public_url: data.attachment.public_url,
            storage_path: data.attachment.storage_path,
            source,
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message || 'Failed to upload file');
      }
    }
    
    setUploading(false);
    
    // Reset input
    event.target.value = '';
    
    // Close menu after successful upload
    if (onClose) {
      onClose();
    }
  }, [currentAttachments.length, maxAttachments, onAttachmentAdd, onClose]);

  // Trigger file input
  const triggerImageUpload = () => imageInputRef.current?.click();
  const triggerCameraCapture = () => cameraInputRef.current?.click();
  const triggerDocumentUpload = () => documentInputRef.current?.click();

  if (!isOpen) return null;

  const canAddMore = currentAttachments.length < maxAttachments;

  return (
    <div className={styles.menu}>
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.image}
        multiple
        onChange={(e) => handleFileSelect(e, 'gallery')}
        className={styles.hiddenInput}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.image}
        capture="environment"
        onChange={(e) => handleFileSelect(e, 'camera')}
        className={styles.hiddenInput}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.document}
        onChange={(e) => handleFileSelect(e, 'document')}
        className={styles.hiddenInput}
      />

      {/* Menu Options */}
      <div className={styles.menuContent}>
        <div className={styles.menuHeader}>
          <span className={styles.menuTitle}>Add Attachment</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        </div>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        {uploading ? (
          <div className={styles.uploading}>
            <div className={styles.uploadingSpinner} />
            <span>Uploading...</span>
          </div>
        ) : canAddMore ? (
          <div className={styles.options}>
            {/* Camera Capture - Mobile only */}
            <button 
              className={styles.option} 
              onClick={triggerCameraCapture}
            >
              <span className={styles.optionIcon}>{Icons.camera}</span>
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>Take Photo</span>
                <span className={styles.optionDescription}>Capture with camera</span>
              </div>
            </button>
            
            {/* Photo Gallery */}
            <button 
              className={styles.option} 
              onClick={triggerImageUpload}
            >
              <span className={styles.optionIcon}>{Icons.image}</span>
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>Photo Library</span>
                <span className={styles.optionDescription}>Choose from gallery</span>
              </div>
            </button>
            
            {/* Document Upload */}
            <button 
              className={styles.option} 
              onClick={triggerDocumentUpload}
            >
              <span className={styles.optionIcon}>{Icons.document}</span>
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>Document</span>
                <span className={styles.optionDescription}>Upload PDF</span>
              </div>
            </button>
          </div>
        ) : (
          <div className={styles.limitReached}>
            Maximum {maxAttachments} attachments reached
          </div>
        )}
        
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {currentAttachments.length}/{maxAttachments} • Max {MAX_FILE_SIZE_MB}MB
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ALAttachmentPreview - Preview component for attached files
 * 
 * @param {Object} props
 * @param {Object} props.attachment - Attachment object
 * @param {Function} props.onRemove - Callback to remove the attachment
 * @param {boolean} props.compact - Compact display mode
 */
export function ALAttachmentPreview({ attachment, onRemove, compact = false }) {
  const isImage = attachment.file_type?.startsWith('image/');
  
  return (
    <div className={`${styles.preview} ${compact ? styles.previewCompact : ''}`}>
      {isImage ? (
        <img 
          src={attachment.public_url} 
          alt={attachment.file_name}
          className={styles.previewImage}
        />
      ) : (
        <div className={styles.previewDocument}>
          <span className={styles.previewDocIcon}>{Icons.documentSmall}</span>
        </div>
      )}
      <div className={styles.previewInfo}>
        <span className={styles.previewName}>{attachment.file_name}</span>
        {!compact && (
          <span className={styles.previewSize}>
            {formatFileSize(attachment.file_size)}
          </span>
        )}
      </div>
      {onRemove && (
        <button 
          className={styles.previewRemove} 
          onClick={() => onRemove(attachment.id)}
          aria-label="Remove attachment"
        >
          {Icons.close}
        </button>
      )}
    </div>
  );
}

/**
 * ALAttachmentsBar - Horizontal bar showing current attachments
 * 
 * @param {Object} props
 * @param {Array} props.attachments - Array of attachment objects
 * @param {Function} props.onRemove - Callback to remove an attachment
 * @param {Function} props.onAddClick - Callback when add button is clicked
 * @param {number} props.maxAttachments - Maximum allowed attachments
 */
export function ALAttachmentsBar({ 
  attachments = [], 
  onRemove, 
  onAddClick,
  maxAttachments = 5
}) {
  if (attachments.length === 0) return null;
  
  return (
    <div className={styles.attachmentsBar}>
      <div className={styles.attachmentsList}>
        {attachments.map((attachment) => (
          <ALAttachmentPreview
            key={attachment.id}
            attachment={attachment}
            onRemove={onRemove}
            compact
          />
        ))}
        {attachments.length < maxAttachments && onAddClick && (
          <button 
            className={styles.addMoreButton}
            onClick={onAddClick}
            aria-label="Add more attachments"
          >
            <span>+</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
