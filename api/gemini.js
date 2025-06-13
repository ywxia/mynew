import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';

const ALLOWED_MODELS = [
  'gemini-2.5-pro-preview-06-05',
  'gemini-2.5-flash-preview-05-20'
];
const DEFAULT_MODEL = ALLOWED_MODELS[0];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  // 简单认证
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || String(token) !== process.env.AUTH_PASSWORD) {
    res.status(401).json({ error: '未授权，请先登录' });
    return;
  }

  const { messages, model } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: '参数 "messages" 不完整或格式不正确' });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const config = {
      temperature: 0.9,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
      responseMimeType: 'text/plain',
    };
    const useModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;
    
    // Transform messages to Gemini's `contents` format
    const contents = messages.map(msg => ({
      // Gemini uses 'model' for the assistant's role
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContentStream({
      model: useModel,
      config,
      contents,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    let result = '';
    for await (const chunk of response) {
      result += chunk.text || '';
    }
    res.status(200).end(result);
  } catch (err) {
    console.error('[Gemini API Error]', err, err.cause);
    if (!res.headersSent) {
      let msg = err.message || '服务器错误';
      if (msg.includes('fetch failed')) {
        msg += '。请检查服务器能否访问 Google API（如需科学上网），或 API Key 是否正确。';
      }
      res.status(500).json({ error: msg });
    }
  }
}
