import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Lead, ProfileInfo } from '@/types';
import { querySerper, parseResult, getTimeFilter } from '@/lib/google-cse';
import { CLOUD_TOPIC_TERMS } from '@/lib/search-classifier';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, dateRange } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    const tbs = dateRange ? getTimeFilter(dateRange) : undefined;

    // Run 2 parallel searches: user's cloud posts + profile info
    const [postsData, profileData] = await Promise.all([
      querySerper(
        `site:linkedin.com/posts/${cleanUsername} ${CLOUD_TOPIC_TERMS}`,
        { num: 20, tbs }
      ),
      querySerper(
        `site:linkedin.com/in/${cleanUsername}`,
        { num: 1 }
      ),
    ]);

    // Parse profile info from the profile search result
    let profileInfo: ProfileInfo = {
      username: cleanUsername,
      name: cleanUsername.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      linkedinUrl: `https://www.linkedin.com/in/${cleanUsername}`,
    };

    if (profileData.organic && profileData.organic.length > 0) {
      const profileResult = profileData.organic[0];
      // LinkedIn titles are usually: "John Doe - Title - Company | LinkedIn"
      const titleParts = profileResult.title.split(' - ');
      const name = titleParts[0]?.replace(' | LinkedIn', '').trim();
      const headline = profileResult.snippet;

      profileInfo = {
        username: cleanUsername,
        name: name || profileInfo.name,
        headline,
        linkedinUrl: profileResult.link || profileInfo.linkedinUrl,
      };
    }

    // Parse posts into leads
    const posts = postsData.organic || [];
    const leads: Lead[] = posts.map((item) => ({
      id: uuidv4(),
      post: parseResult(item),
      status: 'new' as const,
      searchQuery: `profile:${cleanUsername}`,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      profileInfo,
      leads,
      totalResults: leads.length,
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Profile search error:', error);
    const message = error instanceof Error ? error.message : 'Failed to search profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
