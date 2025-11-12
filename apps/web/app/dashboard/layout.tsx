import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Navbar } from '@/components/dashboard/navbar';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  org_id: string | null;
  created_at: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication check
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (authError || !authUser) {
    redirect('/login');
  }

  // Fetch user profile from database
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  const user: User = userProfile || {
    id: authUser.id,
    email: authUser.email || '',
    full_name: null,
    role: 'owner',
    org_id: null,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="flex min-h-screen bg-gray-light">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <Navbar
          userEmail={user.email}
          userName={user.full_name}
        />

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
