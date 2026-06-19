// Vercel Serverless Function — Anthropic API 프록시
// API 키를 서버에 숨겨서 안전하게 Claude를 호출합니다.
// 키는 Vercel 환경변수(ANTHROPIC_API_KEY)에 저장됩니다.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '서버에 API 키가 설정되지 않았어요' });
  }

  try {
    const { system, userPrompt, maxTokens } = req.body;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens || 4096,
        system: system || '',
        messages: [{ role: 'user', content: userPrompt || '' }],
      }),
    });

    const data = await anthropicRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Anthropic API 오류' });
    }

    const text = (data.content || []).map((c) => c.text || '').join('');
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message || '서버 오류' });
  }
}
