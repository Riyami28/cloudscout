import { NextRequest, NextResponse } from 'next/server';
import { scoreLeads } from '@/lib/ai-scorer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'At least one lead is required for analysis' },
        { status: 400 }
      );
    }

    if (leads.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 leads per analysis request' },
        { status: 400 }
      );
    }

    const posts = leads.map((lead: { post: { url: string; title: string; snippet: string; author?: string } }) => ({
      url: lead.post.url,
      title: lead.post.title,
      snippet: lead.post.snippet,
      author: lead.post.author,
    }));

    const scores = await scoreLeads(posts);

    const analyzedLeads = leads.map((lead: { id: string }, index: number) => ({
      ...lead,
      score: scores[index] || null,
      status: 'analyzed',
    }));

    return NextResponse.json({ leads: analyzedLeads });
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
