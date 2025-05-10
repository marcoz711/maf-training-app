import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- CONFIG ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const FITNESS_SYNCER_API_BASE = 'https://api.fitnesssyncer.com/api/providers/sources';
const MIN_DATE = new Date('2024-12-03');

// --- HELPERS ---
function logInfo(...args: any[]) { console.log('[SyncActivities]', ...args); }
function logError(...args: any[]) { console.error('[SyncActivities][ERROR]', ...args); }

function calculatePace(durationSeconds: number, distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return null;
  const paceSec = durationSeconds / distanceKm;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function calculatePaceMinPerKm(durationSeconds: number, distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return null;
  const paceSec = durationSeconds / distanceKm;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function calculatePaceSecPerKm(durationSeconds: number, distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return null;
  return durationSeconds / distanceKm;
}

function calculateMafZones(hrPoints: any[], mafLower: number, mafUpper: number) {
  let inZone = 0, above = 0, below = 0;
  const validPoints = hrPoints.filter(p => typeof p.heartRate === 'number');
  for (const p of validPoints) {
    if (p.heartRate >= mafLower && p.heartRate <= mafUpper) inZone++;
    else if (p.heartRate > mafUpper) above++;
    else below++;
  }
  const total = validPoints.length || 1;
  return {
    maf_zone_percent: (inZone / total) * 100,
    above_maf_zone_percent: (above / total) * 100,
    below_maf_zone_percent: (below / total) * 100,
    maf_zone_seconds: inZone,
    above_maf_zone_seconds: above,
    below_maf_zone_seconds: below,
  };
}

function calculateMafZonesByTime(hrPoints: any[], mafLower: number, mafUpper: number) {
  if (!Array.isArray(hrPoints) || hrPoints.length < 2) {
    return {
      maf_zone_seconds: null,
      above_maf_zone_seconds: null,
      below_maf_zone_seconds: null,
      maf_zone_percent: null,
      above_maf_zone_percent: null,
      below_maf_zone_percent: null,
    };
  }
  let inZone = 0, above = 0, below = 0, total = 0;
  for (let i = 0; i < hrPoints.length - 1; i++) {
    const p = hrPoints[i];
    const next = hrPoints[i + 1];
    if (typeof p.heartRate !== 'number' || typeof next.time !== 'number' || typeof p.time !== 'number') continue;
    const dt = Math.max(1, Math.round((next.time - p.time) / 1000)); // at least 1s
    total += dt;
    if (p.heartRate >= mafLower && p.heartRate <= mafUpper) inZone += dt;
    else if (p.heartRate > mafUpper) above += dt;
    else below += dt;
  }
  // Optionally handle the last point (assume 1s duration)
  const last = hrPoints[hrPoints.length - 1];
  if (typeof last.heartRate === 'number') {
    total += 1;
    if (last.heartRate >= mafLower && last.heartRate <= mafUpper) inZone += 1;
    else if (last.heartRate > mafUpper) above += 1;
    else below += 1;
  }
  if (total === 0) return {
    maf_zone_seconds: null,
    above_maf_zone_seconds: null,
    below_maf_zone_seconds: null,
    maf_zone_percent: null,
    above_maf_zone_percent: null,
    below_maf_zone_percent: null,
  };
  return {
    maf_zone_seconds: inZone,
    above_maf_zone_seconds: above,
    below_maf_zone_seconds: below,
    maf_zone_percent: (inZone / total) * 100,
    above_maf_zone_percent: (above / total) * 100,
    below_maf_zone_percent: (below / total) * 100,
  };
}

// Add a helper to safely parse and format dates
function safeDateIso(val: any, label: string = '') {
  if (!val) {
    logError('Missing date/time value', label, val);
    return null;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    logError('Invalid date/time value', label, val);
    return null;
  }
  return d.toISOString();
}

// --- MAIN HANDLER ---
export async function POST(req: NextRequest) {
  try {
    // 1. Get user (assume user ID is sent in header for now)
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Missing user ID' }, { status: 401 });
    logInfo('Sync started for user', userId);

    // Extra: Log the full data_sources table for debugging
    const { data: allSources, error: allSourcesErr } = await supabase
      .from('data_sources')
      .select('*');
    logInfo('Full data_sources table:', allSources);

    // 2. Get FitnessSyncer data sources for user
    const { data: sources, error: dsErr } = await supabase
      .from('data_sources')
      .select('id, source_id, api_connection_id, name, api_connections!inner(user_id, provider)')
      .eq('api_connections.user_id', userId)
      .eq('api_connections.provider', 'fitnesssyncer');
    logInfo('Supabase data_sources query result for user', userId, ':', sources);
    if (dsErr) throw new Error('Failed to fetch data sources: ' + dsErr.message);
    if (!sources || sources.length === 0) {
      logError('No FitnessSyncer data source found for user', userId, 'Query result:', sources);
      return NextResponse.json({ error: 'No FitnessSyncer data source found' }, { status: 404 });
    }

    // 4. Fetch activities from FitnessSyncer
    const allActivities: any[] = [];
    for (const src of sources) {
      // Fetch the access token for this data source
      const { data: apiConn, error: apiErr } = await supabase
        .from('api_connections')
        .select('access_token, provider')
        .eq('id', src.api_connection_id)
        .single();
      if (apiErr) {
        logError('Failed to fetch API connection for source', src.id, apiErr.message);
        continue;
      }
      const accessToken = apiConn?.access_token;
      const provider = apiConn?.provider || 'fitnesssyncer';
      if (!accessToken) {
        logError('No access token found for source', src.id);
        continue;
      }
      // 1. Get latest activity date for this user/source
      const { data: latestActivity, error: latestErr } = await supabase
        .from('activities')
        .select('start_time')
        .eq('user_id', userId)
        .eq('source', `${provider}-${src.name}`)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
      if (latestErr && latestErr.code !== 'PGRST116') {
        logError('Failed to fetch latest activity for source', src.id, latestErr.message);
        continue;
      }
      const latestDate = latestActivity?.start_time ? new Date(latestActivity.start_time) : null;
      logInfo('Latest activity date for source', `${provider}-${src.name}:`, latestDate);
      // 2. Paginated fetch: get only new items for this data source
      let offset = 0;
      let moreItems = true;
      let itemsToFetch: any[] = [];
      const batchSize = 10;
      while (moreItems) {
        const listUrl = `${FITNESS_SYNCER_API_BASE}/${src.source_id}/items/?offset=${offset}`;
        logInfo('Fetching item IDs from FitnessSyncer URL:', listUrl);
        const listResp = await fetch(listUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!listResp.ok) {
          logError('FitnessSyncer API error (list)', listResp.status, await listResp.text());
          break;
        }
        const { items } = await listResp.json();
        logInfo('Raw items array from FitnessSyncer:', { source: `${provider}-${src.name}`, offset, items });
        // Write items array to a new file per sync and offset
        try {
          const logsDir = path.join(process.cwd(), 'logs');
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
          }
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const safeSource = `${provider}-${src.name}`.replace(/[^a-zA-Z0-9-_]/g, '_');
          const fileName = `fitnesssyncer-items-${safeSource}-offset${offset}-${timestamp}.json`;
          const filePath = path.join(logsDir, fileName);
          fs.writeFileSync(filePath, JSON.stringify({ source: `${provider}-${src.name}`, offset, timestamp: new Date().toISOString(), items }, null, 2));
        } catch (err) {
          logError('Failed to write items array to file:', err);
        }
        if (!Array.isArray(items) || items.length === 0) break;
        let stop = false;
        for (const item of items) {
          // Defensive: skip items with invalid itemId
          const itemId = item.itemId || item.id;
          if (!itemId || !(typeof itemId === 'number' || (typeof itemId === 'string' && /^\d+$/.test(itemId)))) {
            logError('Skipping item: invalid itemId for detail fetch', { itemId, source: `${provider}-${src.name}` });
            continue;
          }
          // Defensive: skip items with missing/invalid date
          const itemDate = item.date ? new Date(item.date) : null;
          if (!itemDate || isNaN(itemDate.getTime())) {
            logError('Skipping item: invalid date for detail fetch', { itemId, date: item.date, source: `${provider}-${src.name}` });
            continue;
          }
          // If latestDate exists and this item is not newer, stop fetching further batches
          if (latestDate && itemDate <= latestDate) {
            stop = true;
            break;
          }
          itemsToFetch.push(item);
        }
        if (stop || items.length < batchSize) {
          break;
        } else {
          offset += batchSize;
        }
      }
      logInfo('Total new items to fetch details for source:', { source: `${provider}-${src.name}`, count: itemsToFetch.length });
      for (const item of itemsToFetch) {
        const itemId = item.itemId || item.id;
        const detailUrl = `${FITNESS_SYNCER_API_BASE}/${src.source_id}/items/${itemId}/`;
        logInfo('Fetching item details from FitnessSyncer URL:', detailUrl);
        const detailResp = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!detailResp.ok) {
          logError('FitnessSyncer API error (detail)', detailResp.status, await detailResp.text());
          continue;
        }
        const detail = await detailResp.json();
        if (detail) allActivities.push({ ...detail, _source: `${provider}-${src.name}` });
      }
    }
    logInfo('Fetched', allActivities.length, 'activities');

    // 5. Filter activities
    const filtered = [];
    for (const act of allActivities) {
      const activity = act.item || act;
      const external_id = String(activity.itemId || activity.id);
      const source = act._source || 'fitnesssyncer';
      let reason = '';
      if (!activity.date) {
        reason = 'missing date';
      } else {
        const actDate = new Date(activity.date);
        if (isNaN(actDate.getTime())) {
          reason = 'invalid date';
        } else if (actDate < MIN_DATE) {
          reason = 'too old';
        } else if (activity.activity === 'Generic') {
          reason = 'type Generic';
        }
      }
      if (reason) {
        logInfo('Filtered/skipped activity:', { itemId: external_id, source, reason });
        continue;
      }
      filtered.push(act);
    }
    logInfo('Filtered to', filtered.length, 'activities');

    // 6. Get already stored (external_id, source) pairs
    const extSourcePairs = filtered.map(a => {
      const activity = a.item || a;
      return { external_id: String(activity.itemId || activity.id), source: a._source || 'fitnesssyncer' };
    });
    // Remove duplicates
    const uniquePairs = Array.from(new Set(extSourcePairs.map(p => p.external_id + '|' + p.source)))
      .map(key => {
        const [external_id, source] = key.split('|');
        return { external_id, source };
      });
    const { data: existing, error: existErr } = await supabase
      .from('activities')
      .select('external_id, source')
      .in('external_id', uniquePairs.map(p => p.external_id))
      .in('source', uniquePairs.map(p => p.source));
    if (existErr) throw new Error('Failed to check existing activities: ' + existErr.message);
    const existingSet = new Set((existing || []).map(e => `${e.external_id}|${e.source}`));
    logInfo('Existing activities in DB:', existing);

    // 7. Get user MAF HR
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('maf_hr')
      .eq('id', userId)
      .single();
    if (profErr) throw new Error('Failed to fetch user profile: ' + profErr.message);
    const mafHr = profile?.maf_hr;

    // 8. Prepare new activities
    const toInsert = [];
    const skippedDuplicates = [];
    const inBatchSet = new Set();
    const inBatchDuplicates = [];
    for (const act of filtered) {
      const activity = act.item || act;
      const external_id = String(activity.itemId || activity.id);
      const source = act._source || 'fitnesssyncer';
      const key = `${external_id}|${source}`;
      if (existingSet.has(key)) {
        skippedDuplicates.push({ external_id, source });
        continue; // skip duplicates already in DB
      }
      if (inBatchSet.has(key)) {
        inBatchDuplicates.push({ external_id, source });
        continue; // skip in-batch duplicates
      }
      inBatchSet.add(key);
      const startTime = safeDateIso(activity.date, 'start_time');
      const endTime = safeDateIso(activity.endDate, 'end_time');
      const isRun = (activity.activity || '').toLowerCase().includes('run');
      type MafMetrics = {
        maf_zone_seconds: number | null,
        above_maf_zone_seconds: number | null,
        below_maf_zone_seconds: number | null,
        maf_zone_percent: number | null,
        above_maf_zone_percent: number | null,
        below_maf_zone_percent: number | null,
      };
      let mafMetrics: MafMetrics = {
        maf_zone_seconds: null,
        above_maf_zone_seconds: null,
        below_maf_zone_seconds: null,
        maf_zone_percent: null,
        above_maf_zone_percent: null,
        below_maf_zone_percent: null,
      };
      let paceSecPerKm = null;
      let maxHeartRate = activity.maxHeart || activity.max_heart_rate || null;
      // Calculate max HR from points if not present
      if (!maxHeartRate) {
        const points = activity.gps?.lap?.[0]?.points || activity.hr_data || [];
        maxHeartRate = points.reduce((max: number, p: any) => (typeof p.heartRate === 'number' && p.heartRate > max ? p.heartRate : max), 0) || null;
      }
      if (isRun && mafHr) {
        const points = activity.gps?.lap?.[0]?.points || activity.hr_data || [];
        mafMetrics = calculateMafZonesByTime(points, mafHr - 10, mafHr) as MafMetrics;
        // Adjust below_maf_zone_seconds to match duration_seconds
        const totalZoneSeconds = (mafMetrics.maf_zone_seconds || 0) + (mafMetrics.above_maf_zone_seconds || 0) + (mafMetrics.below_maf_zone_seconds || 0);
        if (activity.duration && totalZoneSeconds < activity.duration) {
          const diff = activity.duration - totalZoneSeconds;
          mafMetrics.below_maf_zone_seconds = (mafMetrics.below_maf_zone_seconds || 0) + diff;
          logInfo('Adjusted below_maf_zone_seconds to match duration_seconds for activity', external_id, 'added', diff, 'seconds');
        }
        if (!activity.pace_sec_per_km && activity.duration && activity.distanceKM) {
          paceSecPerKm = calculatePaceSecPerKm(activity.duration, activity.distanceKM);
        } else if (activity.pace_sec_per_km) {
          paceSecPerKm = activity.pace_sec_per_km;
        }
        logInfo('MAF metrics for activity', external_id, mafMetrics, 'pace_sec_per_km:', paceSecPerKm);
      }
      toInsert.push({
        user_id: userId,
        external_id,
        source,
        activity_type: activity.activity,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: activity.duration || null,
        distance_meters: activity.distanceKM ? activity.distanceKM * 1000 : null,
        avg_heart_rate: activity.avgHeartrate || null,
        max_heart_rate: maxHeartRate,
        maf_zone_seconds: mafMetrics.maf_zone_seconds,
        above_maf_zone_seconds: mafMetrics.above_maf_zone_seconds,
        below_maf_zone_seconds: mafMetrics.below_maf_zone_seconds,
        maf_zone_percent: mafMetrics.maf_zone_percent,
        above_maf_zone_percent: mafMetrics.above_maf_zone_percent,
        below_maf_zone_percent: mafMetrics.below_maf_zone_percent,
        hr_data: activity.gps?.lap?.[0]?.points || null,
        pace_sec_per_km: paceSecPerKm,
        route_data: activity.gps || null,
        notes: activity.comment || '',
        is_maf_test: false,
        exclude_from_progress_metrics: activity.exclude_from_progress_metrics || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    logInfo('Activities to insert:', toInsert.map(a => ({ external_id: a.external_id, source: a.source })));
    logInfo('Activities skipped as duplicates (DB):', skippedDuplicates);
    logInfo('Activities skipped as in-batch duplicates:', inBatchDuplicates);

    // 9. Insert new activities
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from('activities').insert(toInsert);
      if (insErr) {
        logError('Failed to insert activities:', insErr.message, insErr.details);
        return NextResponse.json({ error: 'Failed to insert activities', details: insErr.details }, { status: 500 });
      }
    }
    logInfo('Sync complete for user', userId);
    return NextResponse.json({ message: 'Sync complete', inserted: toInsert.length });
  } catch (err: any) {
    logError('Unexpected error:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 