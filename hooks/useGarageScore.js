/**
 * useGarageScore Hook
 * 
 * Provides garage score management functionality:
 * - Trigger score recalculation after relevant actions
 * - Get current score and breakdown
 * 
 * Garage Score Categories (from garageScoreService.js):
 *   specs_confirmed: 20 pts - Verify vehicle specs
 *   build_saved: 15 pts - Save a build
 *   build_shared: 25 pts - Share to community
 *   parts_specified: 25 pts - Add parts with brand/model
 *   photos_uploaded: 15 pts - Upload photos
 * 
 * @module hooks/useGarageScore
 */

import { useCallback, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

/**
 * Hook to manage garage score recalculation
 * 
 * @param {string} vehicleId - The vehicle ID to manage score for
 * @returns {Object} - { recalculateScore, isRecalculating, lastScore }
 */
export function useGarageScore(vehicleId) {
  const { user, isAuthenticated } = useAuth();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastScore, setLastScore] = useState(null);

  /**
   * Trigger garage score recalculation for the vehicle
   * Call this after:
   * - Adding/updating parts with brand/model details
   * - Uploading photos
   * - Marking parts as installed
   * 
   * @returns {Promise<{success: boolean, newScore?: number, change?: number}>}
   */
  const recalculateScore = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !vehicleId) {
      console.log('[useGarageScore] Cannot recalculate - missing auth or vehicleId');
      return { success: false };
    }

    setIsRecalculating(true);

    try {
      const response = await fetch(
        `/api/users/${user.id}/vehicles/${vehicleId}/score`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Score recalculation failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('[useGarageScore] Score recalculated:', {
        previous: data.previousScore,
        new: data.newScore,
        change: data.change,
      });

      setLastScore(data.newScore);

      return {
        success: true,
        newScore: data.newScore,
        previousScore: data.previousScore,
        change: data.change,
        breakdown: data.breakdown,
      };
    } catch (err) {
      console.error('[useGarageScore] Recalculation error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsRecalculating(false);
    }
  }, [isAuthenticated, user?.id, vehicleId]);

  /**
   * Get current score without recalculating
   * @returns {Promise<Object|null>}
   */
  const getScore = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !vehicleId) {
      return null;
    }

    try {
      const response = await fetch(
        `/api/users/${user.id}/vehicles/${vehicleId}/score`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      setLastScore(data.score);
      return data;
    } catch (err) {
      console.error('[useGarageScore] Get score error:', err);
      return null;
    }
  }, [isAuthenticated, user?.id, vehicleId]);

  return {
    recalculateScore,
    getScore,
    isRecalculating,
    lastScore,
  };
}

export default useGarageScore;
