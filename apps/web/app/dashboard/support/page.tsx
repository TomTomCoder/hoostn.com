import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getHandoffs } from '@/lib/actions/handoff';
import { HandoffList } from './HandoffList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SupportPageProps {
  searchParams: {
    status?: 'pending' | 'assigned' | 'resolved' | 'all';
  };
}

async function SupportContent({ status }: { status?: 'pending' | 'assigned' | 'resolved' | 'all' }) {
  const supabase = await createClient();

  // Get current user's org
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return <div>Please log in to view support console</div>;
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', userData.user.id)
    .single();

  if (!userProfile?.org_id) {
    return <div>Organization not found</div>;
  }

  // Check if user is admin (you may want to adjust this)
  // For now, we'll allow all users to see handoffs

  // Fetch handoffs
  const { handoffs, error } = await getHandoffs(
    userProfile.org_id,
    status || 'all'
  );

  if (error) {
    return <div>Error loading handoffs: {error}</div>;
  }

  const pending = handoffs.filter((h) => !h.assigned_to && !h.resolved_at);
  const assigned = handoffs.filter((h) => h.assigned_to && !h.resolved_at);
  const resolved = handoffs.filter((h) => h.resolved_at);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pending.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {assigned.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Being handled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolved.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Successfully handled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Escalations</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={!status || status === 'all' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <a href="/dashboard/support">All</a>
              </Button>
              <Button
                variant={status === 'pending' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <a href="/dashboard/support?status=pending">Pending</a>
              </Button>
              <Button
                variant={status === 'assigned' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <a href="/dashboard/support?status=assigned">Assigned</a>
              </Button>
              <Button
                variant={status === 'resolved' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <a href="/dashboard/support?status=resolved">Resolved</a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <HandoffList handoffs={handoffs} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Support Console</h1>
        <p className="text-gray-600 mt-1">
          Manage AI escalations and guest issues
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        }
      >
        <SupportContent status={searchParams.status} />
      </Suspense>
    </div>
  );
}
