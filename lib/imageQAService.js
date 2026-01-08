/**
 * Image QA Service
 * 
 * Automated image quality assurance for article images.
 * Uses vision AI to analyze images and score them on quality criteria.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// QA criteria and weights
const QA_CRITERIA = {
  car_completeness: {
    weight: 30,
    description: 'Is the entire car visible without being cut off?',
  },
  car_accuracy: {
    weight: 25,
    description: 'Does the car look like a real, identifiable make/model?',
  },
  realism: {
    weight: 20,
    description: 'Does the image look photorealistic without AI artifacts?',
  },
  composition: {
    weight: 15,
    description: 'Is the framing and composition professional?',
  },
  quality: {
    weight: 10,
    description: 'Is the image sharp, well-lit, and high resolution?',
  },
};

// Thresholds - UPDATED: Raised to 90 for higher quality standards
// Images scoring below 90 need manual review or regeneration
const AUTO_APPROVE_THRESHOLD = 90;
const AUTO_REJECT_THRESHOLD = 60;

/**
 * Analyze an image using Claude Vision
 */
export async function analyzeImage(imageUrl, articleContext = {}) {
  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = response.headers.get('content-type') || 'image/webp';

    const prompt = `You are an expert image quality analyst for an automotive website. Analyze this car image and score it on the following criteria. Be STRICT - we need professional-quality images.

Context: This image is for an article titled "${articleContext.title || 'Unknown'}" about ${articleContext.category || 'cars'}.

Score each criterion from 0-100:

1. CAR_COMPLETENESS (30% weight): Is the entire car visible? Are all parts (wheels, front, back, roof) shown without being cut off? Score 0 if any significant part is missing.

2. CAR_ACCURACY (25% weight): Does this look like a real, identifiable car model? Would a car enthusiast recognize it as a specific make/model? Score low if it's a generic/fake looking car.

3. REALISM (20% weight): Does this look like a real photograph? Check for:
   - AI artifacts (extra limbs, merged objects, weird reflections)
   - Unnatural proportions
   - Impossible physics
   - Strange backgrounds
   Score 0 if there are obvious AI generation artifacts.

4. COMPOSITION (15% weight): Professional framing? Good angle? Interesting but appropriate setting?

5. QUALITY (10% weight): Sharp focus, good lighting, high resolution?

Also identify any CRITICAL ISSUES that should auto-reject the image (score 0 for that criterion):
- Car significantly cut off (missing wheels, bumpers, or large body sections)
- Obvious AI artifacts (extra wheels, merged cars, distorted/warped body panels, impossible physics)
- DISTORTED BODYWORK - warped fenders, bent panels, melted-looking surfaces, wrong proportions
- Wrong type of vehicle for the article (e.g., supercars in budget article)
- Inappropriate content
- ANY embedded text, watermarks, logos, or gibberish text anywhere in image
- Studio/CGI look with fake reflections on dark floor (should be outdoor/natural environment)
- Cars that don't look like real identifiable models (generic/fake looking)

BE EXTREMELY STRICT about body panel distortions - if ANY part of the car looks warped, bent, or physically impossible, this is a CRITICAL rejection.

Respond in this exact JSON format:
{
  "scores": {
    "car_completeness": <0-100>,
    "car_accuracy": <0-100>,
    "realism": <0-100>,
    "composition": <0-100>,
    "quality": <0-100>
  },
  "weighted_total": <0-100>,
  "critical_issues": ["issue1", "issue2"] or [],
  "car_identified": "Make Model Year or 'Unknown'",
  "recommendation": "approve" | "reject" | "review",
  "explanation": "Brief explanation of the scores"
}`;

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = result.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse QA response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      scores: { car_completeness: 0, car_accuracy: 0, realism: 0, composition: 0, quality: 0 },
      weighted_total: 0,
      critical_issues: ['analysis_failed'],
      recommendation: 'review',
      explanation: `Analysis failed: ${error.message}`,
    };
  }
}

/**
 * Run QA on an article's image and update the database
 */
export async function runImageQA(articleId) {
  // Get article
  const { data: article, error } = await supabase
    .from('al_articles')
    .select('id, title, slug, category, hero_image_url')
    .eq('id', articleId)
    .single();

  if (error || !article || !article.hero_image_url) {
    return { success: false, error: 'Article or image not found' };
  }

  console.log(`\n🔍 Analyzing: ${article.title}`);

  // Analyze image
  const analysis = await analyzeImage(article.hero_image_url, {
    title: article.title,
    category: article.category,
  });

  console.log(`   Score: ${analysis.weighted_total}/100`);
  console.log(`   Recommendation: ${analysis.recommendation}`);
  if (analysis.critical_issues.length > 0) {
    console.log(`   Issues: ${analysis.critical_issues.join(', ')}`);
  }

  // Determine status based on analysis
  let status = 'pending';
  if (analysis.critical_issues.length > 0) {
    status = 'rejected';
  } else if (analysis.weighted_total >= AUTO_APPROVE_THRESHOLD) {
    status = 'approved';
  } else if (analysis.weighted_total < AUTO_REJECT_THRESHOLD) {
    status = 'rejected';
  } else {
    status = 'needs_review'; // Human review needed
  }

  // Update database
  const { error: updateError } = await supabase
    .from('al_articles')
    .update({
      image_qa_status: status,
      image_qa_issues: analysis.critical_issues.length > 0 ? analysis.critical_issues : null,
      image_qa_score: analysis.weighted_total,
      image_qa_details: analysis,
      image_qa_reviewed_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return {
    success: true,
    status,
    score: analysis.weighted_total,
    analysis,
  };
}

/**
 * Run QA on all pending articles
 */
export async function runBatchImageQA() {
  const { data: articles, error } = await supabase
    .from('al_articles')
    .select('id, title')
    .eq('is_published', true)
    .or('image_qa_status.eq.pending,image_qa_status.is.null')
    .order('title');

  if (error) {
    return { success: false, error: error.message };
  }

  console.log(`\n📸 Running QA on ${articles.length} articles...\n`);

  const results = {
    approved: 0,
    rejected: 0,
    needs_review: 0,
    failed: 0,
  };

  for (const article of articles) {
    const result = await runImageQA(article.id);
    if (result.success) {
      results[result.status]++;
    } else {
      results.failed++;
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  return { success: true, results };
}

/**
 * Get stock photo alternatives from Unsplash
 */
export async function getStockPhotoAlternatives(searchTerm, count = 5) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return { success: false, error: 'Unsplash API key not configured' };
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm + ' car')}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    const data = await response.json();
    
    return {
      success: true,
      photos: data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        credit: {
          name: photo.user.name,
          link: photo.user.links.html,
        },
        download_url: photo.links.download_location,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

