import express from 'express';
import fetch from 'node-fetch';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config(); // 可在 .env 中放 API_KEY

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 允许同域开发测试
import cors from 'cors';
app.use(cors());

/**
 * POST /api/fetch
 * body: { url: "https://example.com" }
 * 返回 markdown 文本
 */
app.post('/api/fetch', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const target = `https://r.jina.ai/${url}`;
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        'X-Return-Format': 'markdown'
      }
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `jina.ai responded ${response.status}` });
    }

    const markdown = await response.text();
    res.json({ markdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 引入 auth 路由（ESM 动态导入）
app.post('/api/auth', async (req, res) => {
  const { default: authHandler } = await import('./api/auth.js');
  return authHandler(req, res);
});

app.listen(PORT, () =>
  console.log(`✔️  jina-reader-app listening on http://localhost:${PORT}`)
);
