import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * POST /api/users/[userId]/track-times/analyze
 * Request AL analysis of user's track times
 * Returns insights, recommendations, and skill assessment
 */
async function handlePost(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { carSlug, trackName } = body;
    
    const TRACK_TIME_COLS = 'id, user_id, user_vehicle_id, car_slug, track_name, track_slug, session_date, best_lap_seconds, average_lap_seconds, conditions, tires, mods_at_time, notes, video_url, created_at';
    
    // Fetch user's track times for analysis
    let query = supabase
      .from('user_track_times')
      .select(TRACK_TIME_COLS)
      .eq('user_id', userId)
      .order('session_date', { ascending: true });
    
    if (carSlug) query = query.eq('car_slug', carSlug);
    if (trackName) query = query.eq('track_name', trackName);
    
    const { data: trackTimes, error: fetchError } = await query;
    
    if (fetchError) {
      // Table might not exist yet
      if (fetchError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Track times feature not yet enabled',
          analysis: null 
        }, { status: 200 });
      }
      console.error('[TrackTimes] Error fetching for analysis:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch track times' }, { status: 500 });
    }
    
    if (!trackTimes || trackTimes.length === 0) {
      return NextResponse.json({ 
        error: 'No track times found to analyze',
        analysis: null 
      }, { status: 200 });
    }
    
    // Generate analysis
    const analysis = generateTrackTimeAnalysis(trackTimes);
    
    // Store analysis on the most recent track time
    if (trackTimes.length > 0) {
      const mostRecent = trackTimes[trackTimes.length - 1];
      await supabase
        .from('user_track_times')
        .update({ 
          al_analysis: analysis,
          al_analyzed_at: new Date().toISOString()
        })
        .eq('id', mostRecent.id);
    }
    
    return NextResponse.json({ analysis });
    
  } catch (err) {
    console.error('[TrackTimes] Analysis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withErrorLogging(handlePost, { route: 'users/track-times/analyze', feature: 'lap-times' });

/**
 * Generate comprehensive analysis of track times
 */
function generateTrackTimeAnalysis(trackTimes) {
  const analysis = {
    summary: {},
    progress: [],
    insights: [],
    recommendations: [],
    skillAssessment: {},
    generatedAt: new Date().toISOString()
  };
  
  // Group by track
  const byTrack = {};
  trackTimes.forEach(tt => {
    if (!byTrack[tt.track_name]) byTrack[tt.track_name] = [];
    byTrack[tt.track_name].push(tt);
  });
  
  // Summary stats
  analysis.summary = {
    totalSessions: trackTimes.length,
    uniqueTracks: Object.keys(byTrack).length,
    dateRange: {
      first: trackTimes[0]?.session_date,
      last: trackTimes[trackTimes.length - 1]?.session_date
    }
  };
  
  // Per-track progress analysis
  Object.entries(byTrack).forEach(([trackName, times]) => {
    if (times.length < 1) return;
    
    const sortedTimes = times.sort((a, b) => 
      new Date(a.session_date) - new Date(b.session_date)
    );
    
    const firstTime = sortedTimes[0].lap_time_seconds;
    const bestTime = Math.min(...times.map(t => t.lap_time_seconds));
    const latestTime = sortedTimes[sortedTimes.length - 1].lap_time_seconds;
    const avgTime = times.reduce((sum, t) => sum + t.lap_time_seconds, 0) / times.length;
    
    const trackProgress = {
      track: trackName,
      sessions: times.length,
      firstTime,
      bestTime,
      latestTime,
      avgTime,
      totalImprovement: firstTime - bestTime,
      improvementPercent: ((firstTime - bestTime) / firstTime * 100).toFixed(1),
      consistencyScore: calculateConsistency(times.map(t => t.lap_time_seconds))
    };
    
    analysis.progress.push(trackProgress);
    
    // Generate track-specific insights
    if (times.length >= 2) {
      const improvement = firstTime - latestTime;
      if (improvement > 0) {
        analysis.insights.push({
          type: 'progress',
          track: trackName,
          message: `You've improved ${improvement.toFixed(2)}s at ${trackName} over ${times.length} sessions!`
        });
      } else if (improvement < -2) {
        analysis.insights.push({
          type: 'regression',
          track: trackName,
          message: `Your recent times at ${trackName} are slower than before. Consider reviewing your approach or checking for issues.`
        });
      }
    }
    
    // Check consistency
    if (trackProgress.consistencyScore < 70 && times.length >= 3) {
      analysis.insights.push({
        type: 'consistency',
        track: trackName,
        message: `Your lap times at ${trackName} vary significantly. Focus on consistent braking points and lines.`
      });
    }
  });
  
  // Analyze estimated vs actual times
  const withEstimates = trackTimes.filter(t => t.estimated_time_seconds && t.lap_time_seconds);
  if (withEstimates.length > 0) {
    const avgDelta = withEstimates.reduce((sum, t) => 
      sum + (t.lap_time_seconds - t.estimated_time_seconds), 0
    ) / withEstimates.length;
    
    if (avgDelta > 5) {
      analysis.skillAssessment.estimatedVsActual = {
        avgDelta,
        message: 'Your actual times are slower than estimates. This is normal - focus on seat time!',
        suggestedSkillLevel: avgDelta > 15 ? 'beginner' : avgDelta > 8 ? 'intermediate' : 'advanced'
      };
    } else if (avgDelta < -2) {
      analysis.skillAssessment.estimatedVsActual = {
        avgDelta,
        message: 'You\'re beating the estimates! You may be more skilled than you selected.',
        suggestedSkillLevel: 'advanced'
      };
    }
  }
  
  // Analyze notes for patterns
  const notesWithContent = trackTimes.filter(t => t.notes && t.notes.length > 0);
  if (notesWithContent.length > 0) {
    const notePatterns = analyzeNotes(notesWithContent.map(t => t.notes));
    if (notePatterns.length > 0) {
      analysis.insights.push(...notePatterns);
    }
  }
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis, trackTimes);
  
  return analysis;
}

/**
 * Calculate consistency score (0-100)
 * Lower variance = higher score
 */
function calculateConsistency(times) {
  if (times.length < 2) return 100;
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / avg) * 100;
  
  // Convert to 0-100 score (lower CV = higher score)
  // CV of 0 = 100, CV of 10+ = 0
  return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 10)));
}

/**
 * Analyze notes for common patterns
 */
function analyzeNotes(notes) {
  const patterns = [];
  const allNotes = notes.join(' ').toLowerCase();
  
  // Braking issues
  if ((allNotes.match(/brak/g) || []).length >= 2) {
    patterns.push({
      type: 'pattern',
      category: 'brakes',
      message: 'You\'ve mentioned braking issues multiple times. Consider brake upgrades (pads, fluid, or BBK) or focus on braking technique.'
    });
  }
  
  // Understeer
  if ((allNotes.match(/understeer|push|tight/g) || []).length >= 2) {
    patterns.push({
      type: 'pattern',
      category: 'handling',
      message: 'Understeer is a recurring theme. Try adjusting tire pressures (lower front, higher rear) or consider suspension upgrades.'
    });
  }
  
  // Oversteer
  if ((allNotes.match(/oversteer|loose|snap|slide/g) || []).length >= 2) {
    patterns.push({
      type: 'pattern',
      category: 'handling',
      message: 'Oversteer/loose handling mentioned often. Check rear tire pressures or consider stiffer rear sway bar.'
    });
  }
  
  // Tire issues
  if ((allNotes.match(/tire|grip|traction/g) || []).length >= 2) {
    patterns.push({
      type: 'pattern',
      category: 'tires',
      message: 'Tire/grip issues come up frequently. Upgrading to a grippier compound could make a significant difference.'
    });
  }
  
  return patterns;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(analysis, trackTimes) {
  const recommendations = [];
  
  // Low session count
  if (analysis.summary.totalSessions < 3) {
    recommendations.push({
      priority: 'high',
      category: 'experience',
      title: 'Get More Seat Time',
      message: 'With only a few logged sessions, the best investment is more track time. Aim for at least 5-10 sessions before making major modifications.'
    });
  }
  
  // Skill-based recommendations
  if (analysis.skillAssessment.suggestedSkillLevel === 'beginner') {
    recommendations.push({
      priority: 'high',
      category: 'training',
      title: 'Consider Professional Instruction',
      message: 'A half-day with a driving coach can improve your times more than any modification. Look for HPDE schools in your area.'
    });
  }
  
  // Consistency issues
  const inconsistentTracks = analysis.progress.filter(p => p.consistencyScore < 60);
  if (inconsistentTracks.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'technique',
      title: 'Focus on Consistency',
      message: `Your times vary significantly at ${inconsistentTracks.map(t => t.track).join(', ')}. Work on hitting the same braking points and apexes every lap.`
    });
  }
  
  // Progress plateau
  const plateauTracks = analysis.progress.filter(p => 
    p.sessions >= 4 && 
    Math.abs(p.latestTime - p.bestTime) < 1
  );
  if (plateauTracks.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'improvement',
      title: 'Breaking Through Plateaus',
      message: `You've plateaued at ${plateauTracks.map(t => t.track).join(', ')}. Try data logging, video review, or coaching to find the next level.`
    });
  }
  
  return recommendations;
}
