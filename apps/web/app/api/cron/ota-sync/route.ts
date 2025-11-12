/**
 * OTA Sync Cron Job Endpoint
 * Vercel Cron job to automatically sync all active OTA connections
 * Scheduled to run every 30 minutes via vercel.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAirbnbICal } from '@/lib/ota/sync/airbnb-sync';
import type { OTAConnection } from '@/types/ota';

/**
 * GET /api/cron/ota-sync
 * Triggered by Vercel Cron
 * Authorization: Bearer [CRON_SECRET]
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get all active connections that need syncing
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: connections, error: fetchError } = await supabase
      .from('ota_connections')
      .select('*')
      .eq('status', 'active')
      .lte('next_sync_at', now)
      .order('next_sync_at', { ascending: true })
      .limit(50); // Limit to prevent timeout

    if (fetchError) {
      console.error('Error fetching connections:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connections to sync',
        synced: 0,
      });
    }

    console.log(`Found ${connections.length} connections to sync`);

    // 3. Sync each connection
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const connection of connections as OTAConnection[]) {
      try {
        console.log(
          `Syncing connection ${connection.id} (${connection.platform})`
        );

        let syncResult;

        // Handle different platforms
        if (connection.platform === 'airbnb_ical') {
          syncResult = await syncAirbnbICal(connection.id, 'cron');
        } else {
          console.warn(`Unsupported platform: ${connection.platform}`);
          continue;
        }

        if (syncResult.success) {
          successCount++;
          console.log(
            `Sync successful for ${connection.id}: ${syncResult.items_created} created, ${syncResult.items_updated} updated`
          );
        } else {
          errorCount++;
          console.error(`Sync failed for ${connection.id}:`, syncResult.errors);
        }

        results.push({
          connection_id: connection.id,
          platform: connection.platform,
          success: syncResult.success,
          items_processed: syncResult.items_processed,
          items_created: syncResult.items_created,
          items_updated: syncResult.items_updated,
          items_failed: syncResult.items_failed,
          conflicts: syncResult.conflicts.length,
        });
      } catch (error) {
        errorCount++;
        console.error(`Error syncing connection ${connection.id}:`, error);
        results.push({
          connection_id: connection.id,
          platform: connection.platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 4. Return summary
    return NextResponse.json({
      success: true,
      message: `Synced ${connections.length} connections`,
      synced: connections.length,
      successful: successCount,
      failed: errorCount,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Configure route for Vercel Edge Runtime (optional)
 * Can be moved to Node.js runtime if needed
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time
