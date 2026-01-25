'use client';

/**
 * Questionnaire Page
 * 
 * Full-page immersive questionnaire experience.
 * Allows users to answer profile questions in a focused, distraction-free environment.
 */

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import FullscreenQuestionnaire from '@/components/questionnaire/FullscreenQuestionnaire';

export default function QuestionnairePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const handleClose = () => {
    router.push('/dashboard');
  };
  
  const handleComplete = () => {
    router.push('/dashboard');
  };
  
  // Loading state handled by FullscreenQuestionnaire
  if (isLoading) {
    return null;
  }
  
  // Redirect if not logged in
  if (!user) {
    router.push('/');
    return null;
  }
  
  return (
    <FullscreenQuestionnaire
      userId={user.id}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
}
