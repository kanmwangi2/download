"use client";

import { useEffect, useState } from 'react';
import { getSupabaseClientAsync } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = await getSupabaseClientAsync();
        
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        setAuthInfo({
          session: {
            exists: !!session,
            user: session?.user ? {
              id: session.user.id,
              email: session.user.email,
              metadata: session.user.user_metadata,
              role: session.user.user_metadata?.role,
            } : null,
            error: sessionError?.message,
          },
          user: {
            exists: !!user,
            data: user ? {
              id: user.id,
              email: user.email,
              metadata: user.user_metadata,
              role: user.user_metadata?.role,
            } : null,
            error: userError?.message,
          },
          environment: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            isBrowser: typeof window !== 'undefined',
          }
        });
      } catch (error) {
        setAuthInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/select-company">← Back to Company Selection</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/application">Application Settings</Link>
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
          {authInfo?.session?.error && (
            <p className="text-destructive">Session Error: {authInfo.session.error}</p>
          )}
          {authInfo?.session?.user && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-semibold mb-2">Session User:</h4>
              <pre className="text-sm overflow-auto">
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
              <pre className="text-sm overflow-auto">
                {JSON.stringify(authInfo.user.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {authInfo?.session?.user && (
            <>
              <div className="flex items-center gap-2">
                <span>Current Role:</span>
                <Badge variant="outline">
                  {authInfo.session.user.role || 'No role set'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Can Access Application Settings:</span>
                <Badge variant={
                  authInfo.session.user.role === 'Primary Admin' || authInfo.session.user.role === 'App Admin' 
                    ? "default" 
                    : "destructive"
                }>
                  {authInfo.session.user.role === 'Primary Admin' || authInfo.session.user.role === 'App Admin' 
                    ? "Yes" 
                    : "No"}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
