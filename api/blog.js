import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const BLOG_DIR = path.resolve(process.cwd(), 'data/blogs');

async function ensureDir() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
}

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token && token === process.env.AUTH_PASSWORD;
}

export default async function handler(req, res) {
  await ensureDir();

  // 新增文章
  if (req.method === 'POST') {
    if (!checkAuth(req)) return res.status(401).json({ error: '未授权' });
    const { title, content } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: '缺少标题或内容' });
    const id = Date.now().toString();
    const createdAt = new Date().toISOString(); // 添加创建时间
    await fs.writeFile(
      path.join(BLOG_DIR, id + '.json'),
      JSON.stringify(
        {
          title,
          content,
          createdAt, // 保存创建时间
        },
        null,
        2
      )
    );
    res.json({ ok: true, id });
    return;
  }

  // 获取所有文章
  if (req.method === 'GET') {
    const files = await fs.readdir(BLOG_DIR);
    const blogs = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf-8');
      const blog = JSON.parse(raw);
      blogs.push({
        id: file.replace(/\.json$/, ''),
        title: blog.title,
        content: blog.content,
        createdAt: blog.createdAt || file.replace('.json', ''), // 如果没有createdAt则使用文件名(时间戳)
      });
    }
    // 按创建时间降序排序
    blogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json({ blogs });
    return;
  }

  // 删除文章
  if (req.method === 'DELETE') {
    if (!checkAuth(req)) return res.status(401).json({ error: '未授权' });
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: '缺少id' });
    await fs.rm(path.join(BLOG_DIR, id + '.json'), { force: true });
    res.json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
