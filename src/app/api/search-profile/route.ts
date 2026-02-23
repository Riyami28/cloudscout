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

    const spacedName = cleanUsername.replace(/-/g, ' ');

    // Run all searches in parallel
    const [broadPostsData, cloudPostsData] = await Promise.all([
      querySerper(
        `site:linkedin.com/in/${cleanUsername} OR site:linkedin.com/posts/${cleanUsername}`,
        { num: 10, tbs }
      ),
      querySerper(
        `site:linkedin.com "${spacedName}" ${CLOUD_TOPIC_TERMS}`,
        { num: 10, tbs }
      ),
    ]);

    // Extract profile info from the broad search (first linkedin.com/in/ result)
    const profileResult = (broadPostsData.organic || []).find((item) =>
      item.link.includes('linkedin.com/in/')
    );

    // Parse profile info from the broad search result
    let profileInfo: ProfileInfo = {
      username: cleanUsername,
      name: spacedName.replace(/\b\w/g, (c) => c.toUpperCase()),
      linkedinUrl: `https://www.linkedin.com/in/${cleanUsername}`,
    };

    if (profileResult) {
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

    // Merge and deduplicate results (cloud-specific first for relevance)
    const allResults = [
      ...(cloudPostsData.organic || []),
      ...(broadPostsData.organic || []),
    ];
    const seenUrls = new Set<string>();
    const uniqueResults = allResults.filter((item) => {
      if (seenUrls.has(item.link)) return false;
      seenUrls.add(item.link);
      return true;
    });

    // Parse posts into leads
    const leads: Lead[] = uniqueResults.map((item) => ({
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
