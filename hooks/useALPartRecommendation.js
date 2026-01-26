/**
 * useALPartRecommendation Hook
 * 
 * Provides a simple interface to ask AL for part recommendations.
 * Opens AL chat with a pre-filled question about the part/upgrade.
 * 
 * @module hooks/useALPartRecommendation
 */

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

/**
 * Build a natural question for AL about a specific part
 */
function buildPartQuestion({ upgradeKey, upgradeName, category, carName, carSlug }) {
  // Build a helpful, specific question for AL
  const questions = [
    `What's the best ${upgradeName || category || 'part'} for a ${carName}?`,
    `I'm looking for specific product recommendations.`,
    `Please include brand names, part numbers, and estimated prices.`,
    `Also mention any installation considerations or compatibility notes.`,
  ];
  
  return questions.join(' ');
}

/**
 * Hook for getting AL part recommendations
 * 
 * Instead of making an API call inline, this opens the AL chat
 * with a pre-filled question. This gives users a full conversation
 * experience where they can ask follow-up questions.
 */
export function useALPartRecommendation() {
  const router = useRouter();

  const askALForPart = useCallback(({ upgradeKey, upgradeName, category, carName, carSlug }) => {
    const question = buildPartQuestion({ upgradeKey, upgradeName, category, carName, carSlug });
    
    // Encode the question for URL
    const encodedQuestion = encodeURIComponent(question);
    
    // Navigate to AL page with the pre-filled question
    // The AL page will handle the conversation
    if (carSlug) {
      router.push(`/al?car=${carSlug}&q=${encodedQuestion}`);
    } else {
      router.push(`/al?q=${encodedQuestion}`);
    }
  }, [router]);

  return { askALForPart };
}

export default useALPartRecommendation;
