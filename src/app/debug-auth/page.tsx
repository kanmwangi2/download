"use client";

import { useEffect, useState } from 'react';
import { getSupabaseClientAsync } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      setLoading(true);
      const supabase = await getSupabaseClientAsync();
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Try to get a profile if we have a user
      let profile = null;
      let profileError = null;
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profile = data;
          profileError = error?.message;
        } catch (err: unknown) {
          profileError = 'Profile query failed';
        }
      }
      
      setAuthInfo({
        session: {
          exists: !!session,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata,
            role: session.user.user_metadata?.role,
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
          } : null,
          error: sessionError?.message,
          expires_at: session?.expires_at,
          access_token: session?.access_token ? 'Present' : 'Missing',
        },
        user: {
          exists: !!user,
          data: user ? {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata,
            role: user.user_metadata?.role,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
          } : null,
          error: userError?.message,
        },
        profile: {
          exists: !!profile,
          data: profile,
          error: profileError,
        },
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          isBrowser: typeof window !== 'undefined',
          timestamp: new Date().toISOString(),
        },
        permissions: {
          isPrimaryAdmin: user?.user_metadata?.role === 'Primary Admin',
          isAppAdmin: user?.user_metadata?.role === 'App Admin',
          isAdmin: ['Primary Admin', 'App Admin'].includes(user?.user_metadata?.role),
          canAccessApplicationSettings: ['Primary Admin', 'App Admin'].includes(user?.user_metadata?.role),
        }
      });
            } catch (err: unknown) {
      console.error('Auth debug error:', error);
      setAuthInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [refreshCount]);

  const refreshAuth = () => {
    setRefreshCount(count => count + 1);
  };

  const testApplicationSettings = () => {
    router.push('/settings/application');
  };

  const testCompanySettings = () => {
    router.push('/app/settings/company');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p>Loading authentication debug info...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Information</CardTitle>
          <CardDescription>
            This page helps debug authentication issues for Primary Admin access to Application Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline">
              <Link href="/select-company">← Back to Company Selection</Link>
            </Button>
            <Button onClick={refreshAuth} variant="outline">
              🔄 Refresh Auth Info
            </Button>
            <Button onClick={testApplicationSettings} variant="outline">
              Test Application Settings
            </Button>
            <Button onClick={testCompanySettings} variant="outline">
              Test Company Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {authInfo?.error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{authInfo.error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Permissions Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Is Primary Admin:</span>
            <Badge variant={authInfo?.permissions?.isPrimaryAdmin ? "default" : "destructive"}>
              {authInfo?.permissions?.isPrimaryAdmin ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Is App Admin:</span>
            <Badge variant={authInfo?.permissions?.isAppAdmin ? "default" : "secondary"}>
              {authInfo?.permissions?.isAppAdmin ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Can Access Application Settings:</span>
            <Badge variant={authInfo?.permissions?.canAccessApplicationSettings ? "default" : "destructive"}>
              {authInfo?.permissions?.canAccessApplicationSettings ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Supabase URL:</span>
            <Badge variant={authInfo?.environment?.hasSupabaseUrl ? "default" : "destructive"}>
              {authInfo?.environment?.hasSupabaseUrl ? "Configured" : "Missing"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Supabase Anon Key:</span>
            <Badge variant={authInfo?.environment?.hasSupabaseKey ? "default" : "destructive"}>
              {authInfo?.environment?.hasSupabaseKey ? "Configured" : "Missing"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Browser Environment:</span>
            <Badge variant={authInfo?.environment?.isBrowser ? "default" : "secondary"}>
              {authInfo?.environment?.isBrowser ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Last checked: {authInfo?.environment?.timestamp}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Session Exists:</span>
            <Badge variant={authInfo?.session?.exists ? "default" : "destructive"}>
              {authInfo?.session?.exists ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Access Token:</span>
            <Badge variant={authInfo?.session?.access_token === 'Present' ? "default" : "destructive"}>
              {authInfo?.session?.access_token || "Missing"}
            </Badge>
          </div>
          {authInfo?.session?.expires_at && (
            <div className="text-xs text-muted-foreground">
              Expires: {new Date(authInfo.session.expires_at * 1000).toLocaleString()}
            </div>
          )}
          {authInfo?.session?.error && (
            <p className="text-destructive">Session Error: {authInfo.session.error}</p>
          )}
          {authInfo?.session?.user && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-semibold mb-2">Session User:</h4>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(authInfo.session.user, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Information (getUser)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span>User Exists:</span>
            <Badge variant={authInfo?.user?.exists ? "default" : "destructive"}>
              {authInfo?.user?.exists ? "Yes" : "No"}
            </Badge>
          </div>
          {authInfo?.user?.error && (
            <p className="text-destructive">User Error: {authInfo.user.error}</p>
          )}
          {authInfo?.user?.data && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-semibold mb-2">User Data:</h4>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(authInfo.user.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Profile Exists:</span>
            <Badge variant={authInfo?.profile?.exists ? "default" : "secondary"}>
              {authInfo?.profile?.exists ? "Yes" : "No"}
            </Badge>
          </div>
          {authInfo?.profile?.error && (
            <p className="text-muted-foreground">Profile Error: {authInfo.profile.error}</p>
          )}
          {authInfo?.profile?.data && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-semibold mb-2">Profile Data:</h4>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(authInfo.profile.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
