import { NextRequest, NextResponse } from 'next/server';
import { enrichProfile, extractProfileUrl } from '@/lib/proxycurl';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    const profileUrl = extractProfileUrl(linkedinUrl) || linkedinUrl;
    const profile = await enrichProfile(profileUrl);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Enrichment error:', error);
    const message = error instanceof Error ? error.message : 'Enrichment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
