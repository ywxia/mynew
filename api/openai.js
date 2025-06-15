import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const ALLOWED_MODELS = (process.env.OPENAI_ALLOWED_MODELS || '').split(',').filter(Boolean);
const DEFAULT_MODEL = ALLOWED_MODELS[0];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Per the user's example, we expect a conversational history.
  // The standard parameter name is `messages`, which we'll use.
  const { messages, model } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: '参数 "messages" 不完整或格式不正确' });
    return;
  }

  try {
    // The user's example `content` format is non-standard for the OpenAI API.
    // We will transform it to the expected string format.
    const transformedMessages = messages.map(msg => ({
      role: msg.role,
      content: Array.isArray(msg.content) ? msg.content[0].text : msg.content
    }));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const useModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;

    // Use streaming response
    const stream = await openai.chat.completions.create({
      model: useModel,
      messages: transformedMessages,
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.writeHead(200);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }
    res.end();

  } catch (err) {
    console.error('[OpenAI API Error]', err);
    if (!res.headersSent) {
      const msg = err.message || '服务器错误';
      res.status(500).json({ error: msg });
    }
  }
}
