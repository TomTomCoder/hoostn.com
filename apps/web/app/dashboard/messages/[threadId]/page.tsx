import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getThread } from '@/lib/actions/chat';
import { ThreadView } from './ThreadView';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ThreadPageProps {
  params: {
    threadId: string;
  };
}

async function ThreadContent({ threadId }: { threadId: string }) {
  const { thread, error } = await getThread(threadId);

  if (error || !thread) {
    notFound();
  }

  return <ThreadView initialThread={thread} />;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/messages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Link>
          </Button>
        </div>
      </div>

      {/* Thread content */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          }
        >
          <ThreadContent threadId={params.threadId} />
        </Suspense>
      </div>
    </div>
  );
}
