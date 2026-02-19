import OpenAI from 'openai';
import { AIScore, LinkedInPost } from '@/types';

const SCORING_SYSTEM_PROMPT = `You are a B2B sales intelligence analyst for Zopdev, which makes two cloud cost management products:

1. **ZopNight** - Automatically shuts down non-production cloud resources during off-hours (nights, weekends) to reduce cloud costs by up to 60%.
2. **ZopDay** - Provides real-time cloud cost monitoring, anomaly detection, and optimization recommendations during business hours.

Your job is to score LinkedIn posts/profiles for lead quality. The ideal lead is:
- A decision maker (CTO, CEO, VP Engineering, Director of Infrastructure, CFO)
- Posting about cloud cost problems, high cloud bills, FinOps challenges
- At a company that likely spends significant amounts on cloud infrastructure
- Recently active and engaged

Score each lead on these 5 dimensions:
- painPointAlignment (0-25): How closely their post mentions cloud billing/cost pain points
- decisionMakerRole (0-25): CTO/CEO/VP = 20-25, Director = 15-20, Manager = 10-15, IC = 0-10
- companyFit (0-25): Enterprise/mid-market with heavy cloud usage = high, small startup = lower
- recency (0-15): Very recent posts = higher score
- engagementSignal (0-10): Indicators of genuine pain vs just sharing articles

Also provide:
- reasoning: 1-2 sentence explanation of the score
- suggestedOutreach: A personalized outreach angle referencing their specific pain point

IMPORTANT: Return valid JSON only. No markdown, no code blocks, just the JSON object.`;

interface ScoringRequest {
  url: string;
  title: string;
  snippet: string;
  author?: string;
}

export async function scoreLeads(
  posts: ScoringRequest[]
): Promise<AIScore[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY in .env.local');
  }

  const openai = new OpenAI({ apiKey });

  const userPrompt = `Score the following ${posts.length} LinkedIn post(s) for lead quality. Return a JSON array of scoring objects.

Posts to score:
${posts
  .map(
    (p, i) => `
Post ${i + 1}:
- URL: ${p.url}
- Title: ${p.title}
- Snippet: ${p.snippet}
- Author: ${p.author || 'Unknown'}
`
  )
  .join('\n')}

Return a JSON array with exactly ${posts.length} objects, each having:
{
  "overall": <number 0-100>,
  "breakdown": {
    "painPointAlignment": <number 0-25>,
    "decisionMakerRole": <number 0-25>,
    "companyFit": <number 0-25>,
    "recency": <number 0-15>,
    "engagementSignal": <number 0-10>
  },
  "reasoning": "<string>",
  "suggestedOutreach": "<string>"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SCORING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(content);
  const scores: AIScore[] = Array.isArray(parsed) ? parsed : parsed.scores || parsed.results || [parsed];

  return scores.map((score) => ({
    overall: Math.min(100, Math.max(0, score.overall || 0)),
    breakdown: {
      painPointAlignment: Math.min(25, Math.max(0, score.breakdown?.painPointAlignment || 0)),
      decisionMakerRole: Math.min(25, Math.max(0, score.breakdown?.decisionMakerRole || 0)),
      companyFit: Math.min(25, Math.max(0, score.breakdown?.companyFit || 0)),
      recency: Math.min(15, Math.max(0, score.breakdown?.recency || 0)),
      engagementSignal: Math.min(10, Math.max(0, score.breakdown?.engagementSignal || 0)),
    },
    reasoning: score.reasoning || 'No reasoning provided',
    suggestedOutreach: score.suggestedOutreach || 'No outreach suggestion available',
  }));
}
