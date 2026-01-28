/**
 * Article Image Strategy V2
 * 
 * DEPRECATED: This module now re-exports from articleImageService.js
 * which contains the optimized approach.
 * 
 * The main articleImageService.js has been updated with:
 * - Environment diversity (no repetitive mountain overlooks)
 * - Specific car models with colors for realistic rendering
 * - Anti-CGI instructions for photorealistic output
 * - Canon R5 camera specification for documentary style
 * - The gemini-2.0-flash-exp-image-generation model
 * 
 * Use articleImageService.js directly for all new code.
 * 
 * @module lib/articleImageStrategyV2
 * @deprecated Use lib/articleImageService instead
 */

import {
  generateImagePrompt as _generateImagePrompt,
  generateInlineImagePrompts as _generateInlineImagePrompts,
  generateArticleImage as _generateArticleImage,
  uploadToBlob as _uploadToBlob,
  createArticleHeroImage as _createArticleHeroImage,
  createArticleInlineImages as _createArticleInlineImages,
  createAllArticleImages as _createAllArticleImages,
  batchGenerateImages as _batchGenerateImages,
  getSubjectForArticle as _getSubjectForArticle,
  ENVIRONMENTS as _ENVIRONMENTS,
  MODEL_NAME as _MODEL_NAME,
} from './articleImageService.js';

// Re-export everything from the main service for backwards compatibility
export const generateImagePrompt = _generateImagePrompt;
export const generateInlineImagePrompts = _generateInlineImagePrompts;
export const generateArticleImage = _generateArticleImage;
export const uploadToBlob = _uploadToBlob;
export const createArticleHeroImage = _createArticleHeroImage;
export const createArticleInlineImages = _createArticleInlineImages;
export const createAllArticleImages = _createAllArticleImages;
export const batchGenerateImages = _batchGenerateImages;
export const getSubjectForArticle = _getSubjectForArticle;
export const ENVIRONMENTS = _ENVIRONMENTS;
export const MODEL_NAME = _MODEL_NAME;

// Legacy V2 function name mapping
export const generateArticleImageV2 = async (article, _options = {}) => {
  return _createArticleHeroImage(article);
};

// Legacy function for getting relevant cars
export async function getRelevantCarsForImage(article, _supabase) {
  // Extract car names from the subject string
  const subject = _getSubjectForArticle(article);
  
  // Parse out car names from the subject
  const carMatches = subject.match(/(?:A |and a |, a )([A-Z][a-zA-Z0-9\s-]+?)(?= and| parked| ,|$)/g);
  if (!carMatches) return [];
  
  return carMatches.map(match => ({
    name: match.replace(/^(A |and a |, a )/, '').trim(),
  }));
}
