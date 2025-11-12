import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getThreads } from '@/lib/actions/chat';
import { ThreadList } from '@/components/chat/ThreadList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, MessageSquare } from 'lucide-react';
import type { ThreadStatus } from '@/types/chat';

interface MessagesPageProps {
  searchParams: {
    status?: ThreadStatus;
  };
}

async function MessagesContent({ status }: { status?: ThreadStatus }) {
  const supabase = await createClient();

  // Get current user's org
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return <div>Please log in to view messages</div>;
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userData.user.id)
    .single();

  if (!userProfile?.org_id) {
    return <div>Organization not found</div>;
  }

  // Fetch threads
  const { result, error } = await getThreads({
    org_id: userProfile.org_id,
    status,
  });

  if (error) {
    return <div>Error loading messages: {error}</div>;
  }

  const threads = result?.threads || [];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threads.filter((t) => t.status === 'open').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Escalated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {threads.filter((t) => t.status === 'escalated').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threads.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Messages</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-2">
                <Button
                  variant={!status ? 'default' : 'outline'}
                  size="sm"
                  asChild
                >
                  <a href="/dashboard/messages">All</a>
                </Button>
                <Button
                  variant={status === 'open' ? 'default' : 'outline'}
                  size="sm"
                  asChild
                >
                  <a href="/dashboard/messages?status=open">Open</a>
                </Button>
                <Button
                  variant={status === 'escalated' ? 'default' : 'outline'}
                  size="sm"
                  asChild
                >
                  <a href="/dashboard/messages?status=escalated">Escalated</a>
                </Button>
                <Button
                  variant={status === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  asChild
                >
                  <a href="/dashboard/messages?status=closed">Closed</a>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ThreadList threads={threads} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Guest Messages</h1>
        <p className="text-gray-600 mt-1">
          AI-powered chat with your guests
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        }
      >
        <MessagesContent status={searchParams.status} />
      </Suspense>
    </div>
  );
}
