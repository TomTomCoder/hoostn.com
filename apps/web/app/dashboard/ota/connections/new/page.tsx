/**
 * New OTA Connection Page
 * Form to create a new OTA platform connection
 */

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/ota/ConnectionForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Add OTA Connection - Hoostn',
  description: 'Connect a new OTA platform',
};

export default async function NewConnectionPage() {
  const supabase = await createClient();

  // Get user's org
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!userData?.org_id) {
    redirect('/dashboard');
  }

  // Get user's lots
  const { data: lots, error } = await supabase
    .from('lots')
    .select('id, title')
    .eq('org_id', userData.org_id)
    .eq('status', 'active')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching lots:', error);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/ota"
          className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
        >
          ← Back to OTA Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Add OTA Connection</h1>
        <p className="text-gray-600 mt-1">
          Connect a new online travel agency platform to sync bookings
        </p>
      </div>

      {/* Form */}
      <Card className="p-6">
        {!lots || lots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You need to create at least one lot before adding OTA connections.
            </p>
            <Link href="/dashboard/properties">
              <Button>Go to Properties</Button>
            </Link>
          </div>
        ) : (
          <ConnectionForm
            lots={lots}
            onSuccess={() => {
              // Redirect to OTA dashboard on success
              redirect('/dashboard/ota');
            }}
            onCancel={() => {
              redirect('/dashboard/ota');
            }}
          />
        )}
      </Card>

      {/* Platform Guide */}
      <Card className="p-6 bg-gray-50">
        <h2 className="font-semibold mb-4">Platform Setup Guides</h2>

        <div className="space-y-4">
          {/* Airbnb */}
          <div>
            <h3 className="font-medium text-sm mb-2">Airbnb iCal Export</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Log in to your Airbnb hosting account</li>
              <li>Go to Calendar → Availability settings</li>
              <li>Scroll to "Sync calendars"</li>
              <li>Find "Export calendar" and copy the iCal link</li>
              <li>Paste the link in the form above</li>
            </ol>
          </div>

          {/* VRBO */}
          <div>
            <h3 className="font-medium text-sm mb-2">VRBO iCal Export</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Log in to your VRBO account</li>
              <li>Go to Listing → Calendar</li>
              <li>Click "Import/Export"</li>
              <li>Copy the "Export Calendar" URL</li>
              <li>Paste the link in the form above</li>
            </ol>
          </div>

          {/* Coming Soon */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-sm mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-600">
              • Booking.com API (two-way sync)
              <br />
              • Expedia/Vrbo API
              <br />• Direct booking export
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
