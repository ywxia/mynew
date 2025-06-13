import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { url, prompt, model } = req.body || {};
  if (!url || !prompt || !model) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const genModel = genAI.getGenerativeModel({ model });

    // 生成内容
    const result = await genModel.generateContent([
      prompt,
      {
        fileData: {
          fileUri: url,
        },
      },
    ]);
    const text = result.response.text();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).end(text);
  } catch (err) {
    // 增加详细日志和友好提示
    console.error('[YouTube Gemini Error]', err);
    if (!res.headersSent) {
      let msg = err.message || '服务器错误';
      if (msg.includes('fetch failed')) {
        msg += '。请检查服务器能否访问 Google API（如需科学上网），或 API Key/模型/视频链接是否正确。';
      }
      res.status(500).json({ error: msg });
    }
  }
}
