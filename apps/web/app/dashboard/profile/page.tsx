import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  org_id: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // Fetch user profile from database
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  const user: UserProfile = userProfile || {
    id: authUser.id,
    email: authUser.email || '',
    full_name: null,
    role: 'owner',
    org_id: null,
    avatar_url: null,
    created_at: authUser.created_at || new Date().toISOString(),
  };

  // Fetch organization if user has one
  let organization: Organization | null = null;
  if (user.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.org_id)
      .single();

    organization = orgData;
  }

  // Format dates
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-anthracite">Profile</h2>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>
        <Button variant="outline" size="md" disabled>
          Edit Profile
        </Button>
      </div>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-anthracite">
                  {user.full_name || 'No name set'}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Full Name
                </label>
                <p className="text-base text-gray-anthracite">
                  {user.full_name || 'Not set'}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email Address
                </label>
                <p className="text-base text-gray-anthracite">{user.email}</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Role
                </label>
                <p className="text-base text-gray-anthracite capitalize">
                  {user.role}
                </p>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Member Since
                </label>
                <p className="text-base text-gray-anthracite">{memberSince}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Information Card */}
      {organization ? (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Organization Name
                </label>
                <p className="text-base text-gray-anthracite">
                  {organization.name}
                </p>
              </div>

              {/* Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Plan
                </label>
                <p className="text-base text-gray-anthracite capitalize">
                  {organization.plan}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    organization.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {organization.status}
                </span>
              </div>

              {/* Organization ID */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Organization ID
                </label>
                <p className="text-sm text-gray-500 font-mono">
                  {organization.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">
                You are not currently part of an organization.
              </p>
              <Button variant="outline" size="md" disabled>
                Create Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-anthracite">Password</p>
                <p className="text-sm text-gray-600">
                  Change your password to keep your account secure
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-anthracite">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Enable 2FA
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
