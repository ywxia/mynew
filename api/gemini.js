import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';

const ALLOWED_MODELS = (process.env.GEMINI_ALLOWED_MODELS || '').split(',').filter(Boolean);
const DEFAULT_MODEL = ALLOWED_MODELS[0];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { messages, model } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: '参数 "messages" 不完整或格式不正确' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const useModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;

    const config = {
      temperature: 0.9,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      responseMimeType: 'text/plain',
    };

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContentStream({
      model: useModel,
      config,
      contents,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    for await (const chunk of response.stream) {
      const text = chunk.text();
      if (text) {
        res.write(text);
      }
    }
    res.end();
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
