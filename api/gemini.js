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
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const useModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;
    
    // For text-only input, use the gemini-pro model
    const geminiModel = ai.getGenerativeModel({ model: useModel });

    // Transform messages to Gemini's `contents` format
    // The user's last message is the prompt
    const lastMessage = messages.pop();
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = geminiModel.startChat({
      history: contents,
      generationConfig: {
        temperature: 0.9,
      },
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    let resultText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      resultText += chunkText;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(resultText);
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
