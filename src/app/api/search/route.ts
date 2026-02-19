import { NextRequest, NextResponse } from 'next/server';
import { searchLinkedInPosts } from '@/lib/google-cse';
import { Lead } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords = [], roles = [], dateRange = 'all', page = 1 } = body;

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    const { posts, totalResults } = await searchLinkedInPosts(
      keywords,
      roles,
      dateRange,
      page
    );

    const leads: Lead[] = posts.map((post) => ({
      id: uuidv4(),
      post,
      status: 'new' as const,
      searchQuery: keywords.join(', '),
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      leads,
      totalResults,
      query: keywords.join(', '),
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
