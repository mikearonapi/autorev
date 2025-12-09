import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/internal/qa-report
 * 
 * Internal QA endpoint for reviewing expert coverage and score discrepancies.
 * Returns per-car analysis of external sentiment vs internal scores.
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Database not configured',
        cars: [] 
      });
    }

    // Fetch all cars with their scores
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select(`
        slug,
        name,
        score_sound,
        score_interior,
        score_track,
        score_reliability,
        score_value,
        score_driver_fun,
        score_aftermarket,
        expert_review_count,
        expert_consensus_summary
      `)
      .order('name');

    if (carsError) {
      throw carsError;
    }

    // Fetch all video-car links with sentiment data
    const { data: links, error: linksError } = await supabase
      .from('youtube_video_car_links')
      .select(`
        car_slug,
        sentiment_sound,
        sentiment_interior,
        sentiment_track,
        sentiment_reliability,
        sentiment_value,
        sentiment_driver_fun,
        sentiment_aftermarket,
        stock_strength_tags,
        stock_weakness_tags
      `);

    if (linksError) {
      throw linksError;
    }

    // Aggregate sentiment per car
    const carSentiments = {};
    for (const link of (links || [])) {
      if (!carSentiments[link.car_slug]) {
        carSentiments[link.car_slug] = {
          reviewCount: 0,
          sentiments: {},
          strengths: {},
          weaknesses: {}
        };
      }
      
      const cs = carSentiments[link.car_slug];
      cs.reviewCount++;
      
      // Aggregate category sentiments
      const categories = ['sound', 'interior', 'track', 'reliability', 'value', 'driver_fun', 'aftermarket'];
      for (const cat of categories) {
        const sentKey = `sentiment_${cat}`;
        if (link[sentKey] !== null && link[sentKey] !== undefined) {
          if (!cs.sentiments[cat]) cs.sentiments[cat] = [];
          cs.sentiments[cat].push(link[sentKey]);
        }
      }
      
      // Aggregate tags
      (link.stock_strength_tags || []).forEach(tag => {
        cs.strengths[tag] = (cs.strengths[tag] || 0) + 1;
      });
      (link.stock_weakness_tags || []).forEach(tag => {
        cs.weaknesses[tag] = (cs.weaknesses[tag] || 0) + 1;
      });
    }

    // Build QA report for each car
    const qaReport = (cars || []).map(car => {
      const external = carSentiments[car.slug] || { reviewCount: 0, sentiments: {}, strengths: {}, weaknesses: {} };
      
      // Calculate average sentiments
      const avgSentiments = {};
      for (const [cat, values] of Object.entries(external.sentiments)) {
        if (values.length > 0) {
          avgSentiments[cat] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      }

      // Compare with internal scores
      const discrepancies = [];
      const categoryMap = {
        sound: car.score_sound,
        interior: car.score_interior,
        track: car.score_track,
        reliability: car.score_reliability,
        value: car.score_value,
        driver_fun: car.score_driver_fun,
        aftermarket: car.score_aftermarket
      };

      for (const [cat, internalScore] of Object.entries(categoryMap)) {
        const externalSentiment = avgSentiments[cat];
        
        if (internalScore !== undefined && externalSentiment !== undefined) {
          // Normalize internal score to -1 to 1 range
          const normalizedInternal = (internalScore - 5) / 5;
          const divergence = externalSentiment - normalizedInternal;
          
          if (Math.abs(divergence) >= 0.25) {
            discrepancies.push({
              category: cat.replace('_', ' '),
              internalScore,
              externalSentiment: Math.round(externalSentiment * 100) / 100,
              divergence: Math.round(divergence * 100) / 100,
              direction: divergence > 0 ? 'up' : 'down',
              suggestion: divergence > 0 
                ? 'Consider raising score' 
                : 'Consider lowering score'
            });
          }
        }
      }

      // Sort strengths and weaknesses by count
      const topStrengths = Object.entries(external.strengths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      const topWeaknesses = Object.entries(external.weaknesses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      return {
        slug: car.slug,
        name: car.name,
        reviewCount: external.reviewCount,
        hasDiscrepancies: discrepancies.length > 0,
        discrepancyCount: discrepancies.length,
        discrepancies,
        topStrengths,
        topWeaknesses,
        internalScores: categoryMap,
        externalSentiments: avgSentiments
      };
    });

    // Sort: cars with discrepancies first, then by review count
    qaReport.sort((a, b) => {
      if (a.hasDiscrepancies !== b.hasDiscrepancies) {
        return a.hasDiscrepancies ? -1 : 1;
      }
      return b.discrepancyCount - a.discrepancyCount;
    });

    // Summary stats
    const summary = {
      totalCars: qaReport.length,
      carsWithReviews: qaReport.filter(c => c.reviewCount > 0).length,
      carsWithDiscrepancies: qaReport.filter(c => c.hasDiscrepancies).length,
      totalReviews: qaReport.reduce((sum, c) => sum + c.reviewCount, 0),
      totalDiscrepancies: qaReport.reduce((sum, c) => sum + c.discrepancyCount, 0)
    };

    return NextResponse.json({
      summary,
      cars: qaReport
    });

  } catch (error) {
    console.error('[qa-report] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

