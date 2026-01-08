'use client';

/**
 * Edit Build Modal
 * 
 * Enhanced modal for editing shared build details, managing parts/mods, and images.
 * Features:
 * - Details tab: Title, description, build info
 * - Parts/Mods tab: Add specific parts with brand, model, pricing
 * - Photos tab: Upload images, set hero image
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BuildPartsEditor from './BuildPartsEditor';
import ImageGalleryEditor from './ImageGalleryEditor';
import LinkedBuildUpgrades from './LinkedBuildUpgrades';
import styles from './EditBuildModal.module.css';

export default function EditBuildModal({ build, onClose, onUpdate }) {
  const [title, setTitle] = useState(build.title || '');
  const [description, setDescription] = useState(build.description || '');
  const [images, setImages] = useState(build.images || []);
  const [parts, setParts] = useState(build.parts || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [hasChanges, setHasChanges] = useState(false);
  const [linkedBuildData, setLinkedBuildData] = useState(build.build_data || null);
  const [loadingLinkedBuild, setLoadingLinkedBuild] = useState(false);

  // Fetch linked build data if we have a build_id
  useEffect(() => {
    async function fetchLinkedBuild() {
      if (!build.user_build_id && !build.build_id) return;
      
      setLoadingLinkedBuild(true);
      try {
        const { data, error } = await supabase
          .from('user_projects')
          .select(`
            id,
            project_name,
            selected_upgrades,
            total_hp_gain,
            total_cost_low,
            total_cost_high,
            final_hp,
            notes
          `)
          .eq('id', build.user_build_id || build.build_id)
          .single();
        
        if (!error && data) {
          // Also fetch project parts
          const { data: partsData } = await supabase
            .from('user_project_parts')
            .select('*')
            .eq('project_id', data.id);
          
          setLinkedBuildData({
            ...data,
            project_parts: partsData || [],
          });
        }
      } catch (err) {
        console.error('Error fetching linked build:', err);
      } finally {
        setLoadingLinkedBuild(false);
      }
    }

    // Only fetch if we don't already have the data
    if (!linkedBuildData && (build.user_build_id || build.build_id)) {
      fetchLinkedBuild();
    }
  }, [build.user_build_id, build.build_id, linkedBuildData]);

  // Track changes
  const markChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleTitleChange = (value) => {
    setTitle(value);
    markChanged();
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
    markChanged();
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    markChanged();
  };

  const handlePartsChange = (newParts) => {
    setParts(newParts);
    markChanged();
  };

  const handleSetPrimaryImage = async (imageId) => {
    // Optimistic update
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId,
    }));
    setImages(updatedImages);
    markChanged();

    // Call server function
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('set_primary_image', {
          p_image_id: imageId,
          p_user_id: user.id,
        });
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
    }
  };

  const handleDeleteImage = async (imageId) => {
    // Optimistic update
    const remaining = images.filter(img => img.id !== imageId);
    // If we deleted the primary, make the first remaining image primary
    if (remaining.length > 0 && !remaining.some(img => img.is_primary)) {
      remaining[0].is_primary = true;
    }
    setImages(remaining);
    markChanged();

    // Delete from database
    try {
      await supabase
        .from('user_uploaded_images')
        .delete()
        .eq('id', imageId);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update the post details
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq('id', build.id);

      if (updateError) throw updateError;

      // Link any new images to this post
      const newImages = images.filter(img => img.id?.startsWith?.('temp_') || !img.community_post_id);
      if (newImages.length > 0) {
        for (const img of newImages) {
          if (img.id && !img.id.startsWith('temp_')) {
            await supabase
              .from('user_uploaded_images')
              .update({ community_post_id: build.id })
              .eq('id', img.id);
          }
        }
      }

      // Save parts - delete existing and insert new
      const existingParts = parts.filter(p => !p.id?.startsWith?.('temp_'));
      const newParts = parts.filter(p => p.id?.startsWith?.('temp_'));
      
      // Delete removed parts
      if (build.parts?.length > 0) {
        const keepIds = existingParts.map(p => p.id);
        const toDelete = build.parts.filter(p => !keepIds.includes(p.id));
        for (const part of toDelete) {
          await supabase
            .from('community_post_parts')
            .delete()
            .eq('id', part.id);
        }
      }

      // Update existing parts
      for (const part of existingParts) {
        const { id, ...partData } = part;
        await supabase
          .from('community_post_parts')
          .update(partData)
          .eq('id', id);
      }

      // Insert new parts
      if (newParts.length > 0) {
        const partsToInsert = newParts.map(p => {
          const { id, ...partData } = p;
          return {
            ...partData,
            community_post_id: build.id,
          };
        });
        
        await supabase
          .from('community_post_parts')
          .insert(partsToInsert);
      }

      onUpdate();
    } catch (err) {
      console.error('Error saving build:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const partsCount = parts.length;
  const photosCount = images.length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Build</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'linked' ? styles.active : ''}`}
            onClick={() => setActiveTab('linked')}
          >
            Linked Build
            {linkedBuildData && <span className={styles.tabBadge}>✓</span>}
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'parts' ? styles.active : ''}`}
            onClick={() => setActiveTab('parts')}
          >
            Parts/Mods
            {partsCount > 0 && <span className={styles.tabBadge}>{partsCount}</span>}
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'photos' ? styles.active : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
            {photosCount > 0 && <span className={styles.tabBadge}>{photosCount}</span>}
          </button>
        </div>

        <div className={styles.content}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className={styles.detailsTab}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Build Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., My Weekend Track Build"
                  maxLength={100}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={description}
                  onChange={e => handleDescriptionChange(e.target.value)}
                  className={styles.textarea}
                  placeholder="Tell the community about your build journey, goals, and what makes it unique..."
                  maxLength={2000}
                  rows={6}
                />
                <span className={styles.charCount}>{description.length}/2000</span>
              </div>

              <div className={styles.buildInfo}>
                <h4>Build Info</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Car</span>
                    <span className={styles.infoValue}>{build.car_name || 'Not specified'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Views</span>
                    <span className={styles.infoValue}>{build.view_count || 0}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Likes</span>
                    <span className={styles.infoValue}>{build.like_count || 0}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={`${styles.infoValue} ${styles.statusBadge}`}>
                      {build.is_published ? '✓ Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Linked Build Tab */}
          {activeTab === 'linked' && (
            <div className={styles.linkedTab}>
              <div className={styles.tabIntro}>
                <h3>Synced Build Configuration</h3>
                <p>
                  These upgrades and parts come from your saved build in the Tuning Shop.
                  They're automatically displayed on your community post.
                </p>
              </div>
              {loadingLinkedBuild ? (
                <div className={styles.loading}>Loading build data...</div>
              ) : (
                <LinkedBuildUpgrades 
                  buildData={linkedBuildData}
                  carSlug={build.car_slug}
                  carName={build.car_name}
                />
              )}
            </div>
          )}

          {/* Parts/Mods Tab */}
          {activeTab === 'parts' && (
            <div className={styles.partsTab}>
              <div className={styles.tabIntro}>
                <h3>Share Your Build Details</h3>
                <p>Add the specific parts and modifications you've installed. Help others learn what goes into a build like yours!</p>
              </div>
              <BuildPartsEditor 
                parts={parts} 
                onChange={handlePartsChange}
              />
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className={styles.photosTab}>
              <div className={styles.tabIntro}>
                <h3>Build Gallery</h3>
                <p>Upload photos of your build. The hero image will be displayed prominently on your build page.</p>
              </div>
              <ImageGalleryEditor
                images={images}
                onImagesChange={handleImagesChange}
                onSetPrimary={handleSetPrimaryImage}
                onDeleteImage={handleDeleteImage}
                maxImages={10}
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
