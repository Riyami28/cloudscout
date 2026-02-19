import { NextRequest, NextResponse } from 'next/server';
import { parseMultipleUrls } from '@/lib/lead-parser';
import { Lead } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || typeof urls !== 'string') {
      return NextResponse.json(
        { error: 'URLs string is required' },
        { status: 400 }
      );
    }

    const posts = parseMultipleUrls(urls);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No valid LinkedIn URLs found' },
        { status: 400 }
      );
    }

    const leads: Lead[] = posts.map((post) => ({
      id: uuidv4(),
      post,
      status: 'new' as const,
      searchQuery: 'manual import',
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ leads, count: leads.length });
  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
