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

// 引入 youtube 路由（ESM 动态导入）
app.post('/api/youtube', async (req, res) => {
  const { default: ytHandler } = await import('./api/youtube.js');
  return ytHandler(req, res);
});

// 引入 gemini 路由（ESM 动态导入）
app.post('/api/gemini', async (req, res) => {
  const { default: geminiHandler } = await import('./api/gemini.js');
  return geminiHandler(req, res);
});

app.use('/api/blog', async (req, res, next) => {
  const { default: blogHandler } = await import('./api/blog.js');
  return blogHandler(req, res, next);
});

const server = app.listen(PORT, () =>
  console.log(`✔️  jina-reader-app listening on http://localhost:${PORT}`)
);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请更换端口或关闭占用该端口的进程后重试。`);
    process.exit(1);
  } else {
    throw err;
  }
});
