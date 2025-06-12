import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const ALLOWED_MODELS = [
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-3.5-turbo'
];
const DEFAULT_MODEL = ALLOWED_MODELS[0];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || String(token) !== process.env.AUTH_PASSWORD) {
    res.status(401).json({ error: '未授权，请先登录' });
    return;
  }

  const { prompt, model } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const useModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;
    const stream = await openai.chat.completions.create({
      model: useModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream: true
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    let result = '';
    for await (const part of stream) {
      result += part.choices?.[0]?.delta?.content || '';
    }
    res.status(200).end(result);
  } catch (err) {
    console.error('[OpenAI API Error]', err);
    if (!res.headersSent) {
      const msg = err.message || '服务器错误';
      res.status(500).json({ error: msg });
    }
  }
}
