import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth-utils';

export async function GET(_request: NextRequest) {
  try {
    const profile = await getUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
