/**
 * Optional Google Gemini 2.5 analysis.
 * Only works if GEMINI_API_KEY env var is provided at build time.
 * Because this is client-side only, we recommend keeping the key on server
 * and proxying instead. For demo purposes, we call via fetch if key present.
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

export async function getCommunityAnalysis(usernames: string[]): Promise<string | null> {
  if (!GEMINI_KEY || usernames.length === 0) return null;
  try {
    const prompt = `Provide a fun "vibe check" summary (<200 words) for this community: ${usernames.slice(0, 30).join(', ')}`;

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });
    if (!res.ok) throw new Error('Gemini API error');
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn('Gemini analysis failed', e);
    return null;
  }
}
