/**
 * Safety Data API Route
 * 
 * GET /api/cars/[slug]/safety
 * 
 * Fetches comprehensive safety data from:
 * - NHTSA (FREE API): Recalls, complaints, investigations, TSBs, crash test ratings
 * - IIHS (scraped): Crash test ratings, Top Safety Pick status
 * 
 * @module app/api/cars/[slug]/safety
 */

import { NextResponse } from 'next/server';
import { fetchCarBySlug } from '@/lib/carsClient';
import * as nhtsaService from '@/lib/nhtsaSafetyService';
import * as iihsScraper from '@/lib/scrapers/iihsScraper';

/**
 * Parse year/make/model from car data
 */
function parseCarIdentifiers(car) {
  if (!car) return { year: null, make: null, model: null };
  
  const yearMatch = car.years?.match(/(\d{4})(?:-(\d{4}))?/);
  let year = null;
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1]);
    const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : startYear;
    year = Math.floor((startYear + endYear) / 2);
  }
  
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '')
    .replace(/E\d{2}|F\d{2}|G\d{2}|W\d{3}/gi, '')
    .trim();
  
  return { year, make, model };
}

/**
 * GET /api/cars/[slug]/safety
 * Fetch comprehensive safety data for a car
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // Optional: nhtsa, iihs
    const includeDetails = searchParams.get('details') !== 'false';
    
    // Find the car in our database via carsClient
    const car = await fetchCarBySlug(slug);
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found', slug },
        { status: 404 }
      );
    }
    
    const { year, make, model } = parseCarIdentifiers(car);
    
    if (!year || !make || !model) {
      return NextResponse.json(
        { error: 'Could not parse vehicle identifiers', slug },
        { status: 400 }
      );
    }
    
    const safetyData = {
      car: {
        slug: car.slug,
        name: car.name,
        year,
        make,
        model,
      },
      nhtsa: null,
      iihs: null,
      summary: null,
    };
    
    const fetchPromises = [];
    
    // Fetch NHTSA data (free API)
    if (!source || source === 'nhtsa') {
      fetchPromises.push(
        nhtsaService.fetchComprehensiveSafetyData({ year, make, model }).then(data => {
          if (data && !data.error) {
            safetyData.nhtsa = {
              // Crash test ratings
              crashTestRatings: data.safetyRatings ? {
                overall: data.safetyRatings.overallRating,
                frontCrash: data.safetyRatings.overallFrontCrashRating,
                sideCrash: data.safetyRatings.overallSideCrashRating,
                rollover: data.safetyRatings.rolloverRating,
                hasRatings: data.safetyRatings.hasRatings,
              } : null,
              
              // Recalls
              recalls: {
                count: data.recalls?.length || 0,
                items: includeDetails ? data.recalls?.slice(0, 10) : undefined,
                hasOpenRecalls: data.recalls?.some(r => r.incomplete),
              },
              
              // Complaints
              complaints: {
                count: data.complaints?.length || 0,
                items: includeDetails ? data.complaints?.slice(0, 10) : undefined,
                topComponents: nhtsaService.groupComplaintsByComponent(data.complaints)
                  .slice(0, 3)
                  .map(g => ({ component: g.component, count: g.count })),
              },
              
              // Investigations
              investigations: {
                count: data.investigations?.length || 0,
                openCount: data.investigations?.filter(i => i.status === 'Open').length || 0,
                items: includeDetails ? data.investigations : undefined,
              },
              
              // Technical Service Bulletins
              tsbs: {
                count: data.tsbs?.length || 0,
                items: includeDetails ? data.tsbs?.slice(0, 10) : undefined,
                topComponents: nhtsaService.groupTSBsByComponent(data.tsbs)
                  .slice(0, 3)
                  .map(g => ({ component: g.component, count: g.count })),
              },
            };
          }
        }).catch(err => {
          console.warn('[Safety API] NHTSA fetch failed:', err.message);
        })
      );
    }
    
    // Fetch IIHS data (scraped)
    if (!source || source === 'iihs') {
      fetchPromises.push(
        iihsScraper.getIIHSRatings(year, make, model).then(data => {
          if (data) {
            safetyData.iihs = {
              overallAssessment: data.overallAssessment,
              crashworthiness: data.crashworthiness,
              crashAvoidance: data.crashAvoidance,
              headlightRating: data.headlightRating,
              topSafetyPick: data.topSafetyPick,
              topSafetyPickPlus: data.topSafetyPickPlus,
              url: data.url,
            };
          }
        }).catch(err => {
          console.warn('[Safety API] IIHS fetch failed:', err.message);
        })
      );
    }
    
    await Promise.all(fetchPromises);
    
    // Generate summary
    safetyData.summary = generateSafetySummary(safetyData);
    
    return NextResponse.json({
      success: true,
      slug,
      safety: safetyData,
      sources: {
        nhtsa: 'FREE - api.nhtsa.gov',
        iihs: 'Scraped - iihs.org',
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Safety API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch safety data', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * Generate a safety summary from NHTSA and IIHS data
 */
function generateSafetySummary(data) {
  const summary = {
    overallScore: null,
    grade: null,
    highlights: [],
    concerns: [],
  };
  
  let scoreTotal = 0;
  let scoreCount = 0;
  
  // NHTSA crash test ratings
  if (data.nhtsa?.crashTestRatings?.hasRatings) {
    const rating = parseInt(data.nhtsa.crashTestRatings.overall);
    if (rating) {
      scoreTotal += rating * 2; // Scale 1-5 to 2-10
      scoreCount++;
      
      if (rating >= 5) {
        summary.highlights.push('5-star NHTSA overall safety rating');
      } else if (rating >= 4) {
        summary.highlights.push('4-star NHTSA overall safety rating');
      } else if (rating <= 2) {
        summary.concerns.push(`Low ${rating}-star NHTSA safety rating`);
      }
    }
  }
  
  // IIHS ratings
  if (data.iihs) {
    if (data.iihs.topSafetyPickPlus) {
      summary.highlights.push('IIHS Top Safety Pick+ award');
      scoreTotal += 10;
      scoreCount++;
    } else if (data.iihs.topSafetyPick) {
      summary.highlights.push('IIHS Top Safety Pick award');
      scoreTotal += 9;
      scoreCount++;
    } else if (data.iihs.overallAssessment) {
      const assessmentScores = {
        'Excellent': 10,
        'Very Good': 8,
        'Good': 7,
        'Average': 5,
        'Below Average': 3,
      };
      const score = assessmentScores[data.iihs.overallAssessment];
      if (score) {
        scoreTotal += score;
        scoreCount++;
      }
    }
    
    // Check for poor ratings in specific tests
    const poorRatings = [];
    if (data.iihs.crashworthiness) {
      for (const [test, rating] of Object.entries(data.iihs.crashworthiness)) {
        if (rating === 'Poor' || rating === 'Marginal') {
          poorRatings.push(test.replace(/([A-Z])/g, ' $1').trim());
        }
      }
    }
    if (poorRatings.length > 0) {
      summary.concerns.push(`Poor/Marginal IIHS ratings: ${poorRatings.join(', ')}`);
    }
  }
  
  // Recalls
  if (data.nhtsa?.recalls?.hasOpenRecalls) {
    summary.concerns.push('Has open (incomplete) recalls');
  }
  if (data.nhtsa?.recalls?.count > 10) {
    summary.concerns.push(`High recall count (${data.nhtsa.recalls.count} total)`);
  }
  
  // Complaints
  if (data.nhtsa?.complaints?.count > 100) {
    summary.concerns.push(`High complaint volume (${data.nhtsa.complaints.count} total)`);
  }
  
  // Open investigations
  if (data.nhtsa?.investigations?.openCount > 0) {
    summary.concerns.push(`${data.nhtsa.investigations.openCount} open NHTSA investigation(s)`);
  }
  
  // Calculate overall score
  if (scoreCount > 0) {
    summary.overallScore = Math.round(scoreTotal / scoreCount * 10) / 10;
    summary.grade = summary.overallScore >= 9 ? 'A' :
                    summary.overallScore >= 8 ? 'B+' :
                    summary.overallScore >= 7 ? 'B' :
                    summary.overallScore >= 6 ? 'C+' :
                    summary.overallScore >= 5 ? 'C' :
                    summary.overallScore >= 4 ? 'D' : 'F';
  }
  
  return summary;
}















