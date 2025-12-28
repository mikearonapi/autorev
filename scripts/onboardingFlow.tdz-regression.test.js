/**
 * Regression test: Prevents TDZ (Temporal Dead Zone) bugs in onboarding components
 * 
 * Background: In December 2024, a production outage occurred because `handleDismiss`
 * was referenced in a useEffect dependency array BEFORE it was declared. This caused
 * a ReferenceError during render, crashing the entire app after login.
 * 
 * This test ensures that any callback used in a useEffect dependency array is
 * declared BEFORE the useEffect that references it.
 * 
 * Files covered:
 * - components/onboarding/OnboardingFlow.jsx
 * - components/OnboardingPopup.jsx
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const onboardingFlowPath = path.join(repoRoot, 'components', 'onboarding', 'OnboardingFlow.jsx');

test('OnboardingFlow: handleDismiss must be declared before useEffect that references it', async () => {
  const source = await readFile(onboardingFlowPath, 'utf8');
  
  // Find line where handleDismiss is declared (const handleDismiss = useCallback)
  const declarationMatch = source.match(/const handleDismiss\s*=\s*useCallback/);
  assert.ok(
    declarationMatch,
    'Expected to find "const handleDismiss = useCallback" declaration'
  );
  const declarationIndex = declarationMatch.index;

  // Find the first useEffect that has handleDismiss in its dependency array
  // Pattern: useEffect(..., [..., handleDismiss, ...])
  const useEffectWithHandleDismissRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[[^\]]*handleDismiss[^\]]*\]\s*\)/;
  const useEffectMatch = source.match(useEffectWithHandleDismissRegex);
  
  if (useEffectMatch) {
    const useEffectIndex = useEffectMatch.index;
    
    // The declaration must come BEFORE the useEffect that references it
    assert.ok(
      declarationIndex < useEffectIndex,
      `TDZ BUG DETECTED: "handleDismiss" is declared at character ${declarationIndex} but ` +
      `used in a useEffect dependency array at character ${useEffectIndex}. ` +
      `The declaration MUST come before the useEffect to avoid a ReferenceError. ` +
      `Move the handleDismiss useCallback declaration above the useEffect.`
    );
  }
});

test('OnboardingFlow: saveProgress must be declared before handleDismiss', async () => {
  const source = await readFile(onboardingFlowPath, 'utf8');
  
  // saveProgress is used by handleDismiss, so it must be declared first
  const saveProgressMatch = source.match(/const saveProgress\s*=\s*useCallback/);
  const handleDismissMatch = source.match(/const handleDismiss\s*=\s*useCallback/);
  
  assert.ok(saveProgressMatch, 'Expected to find "const saveProgress = useCallback" declaration');
  assert.ok(handleDismissMatch, 'Expected to find "const handleDismiss = useCallback" declaration');
  
  const saveProgressIndex = saveProgressMatch.index;
  const handleDismissIndex = handleDismissMatch.index;
  
  assert.ok(
    saveProgressIndex < handleDismissIndex,
    `TDZ BUG DETECTED: "saveProgress" is declared at character ${saveProgressIndex} but ` +
    `handleDismiss (which uses saveProgress) is declared at character ${handleDismissIndex}. ` +
    `saveProgress MUST be declared before handleDismiss.`
  );
});

test('OnboardingFlow: no callback referenced in useEffect deps before its declaration', async () => {
  const source = await readFile(onboardingFlowPath, 'utf8');
  
  // This is a more general guard: find all useCallback declarations and ensure
  // they appear before any useEffect that references them
  const callbackDeclarations = [...source.matchAll(/const (\w+)\s*=\s*useCallback/g)];
  
  for (const [, callbackName] of callbackDeclarations) {
    // Find the declaration position
    const declRegex = new RegExp(`const ${callbackName}\\s*=\\s*useCallback`);
    const declMatch = source.match(declRegex);
    const declIndex = declMatch?.index ?? Infinity;
    
    // Find any useEffect with this callback in its dependency array
    const useEffectRegex = new RegExp(
      `useEffect\\s*\\(\\s*\\(\\s*\\)\\s*=>\\s*\\{[\\s\\S]*?\\},\\s*\\[[^\\]]*\\b${callbackName}\\b[^\\]]*\\]\\s*\\)`,
      'g'
    );
    
    const useEffectMatches = [...source.matchAll(useEffectRegex)];
    for (const match of useEffectMatches) {
      assert.ok(
        declIndex < match.index,
        `TDZ BUG: "${callbackName}" appears in useEffect deps at char ${match.index} ` +
        `but is declared at char ${declIndex}. Declaration must come first.`
      );
    }
  }
});

// =============================================================================
// OnboardingPopup.jsx Tests (same pattern)
// =============================================================================

const onboardingPopupPath = path.join(repoRoot, 'components', 'OnboardingPopup.jsx');

test('OnboardingPopup: handleClose must be declared before useEffect that references it', async () => {
  const source = await readFile(onboardingPopupPath, 'utf8');
  
  // Find line where handleClose is declared (const handleClose = useCallback)
  const declarationMatch = source.match(/const handleClose\s*=\s*useCallback/);
  assert.ok(
    declarationMatch,
    'Expected to find "const handleClose = useCallback" declaration'
  );
  const declarationIndex = declarationMatch.index;

  // Find the first useEffect that has handleClose in its dependency array
  const useEffectWithHandleCloseRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[[^\]]*handleClose[^\]]*\]\s*\)/;
  const useEffectMatch = source.match(useEffectWithHandleCloseRegex);
  
  if (useEffectMatch) {
    const useEffectIndex = useEffectMatch.index;
    
    assert.ok(
      declarationIndex < useEffectIndex,
      `TDZ BUG DETECTED in OnboardingPopup: "handleClose" is declared at character ${declarationIndex} but ` +
      `used in a useEffect dependency array at character ${useEffectIndex}. ` +
      `The declaration MUST come before the useEffect to avoid a ReferenceError.`
    );
  }
});

