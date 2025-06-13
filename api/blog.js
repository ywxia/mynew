import fs from 'fs/promises';
import path from 'path';

const BLOG_DIR = path.resolve(process.cwd(), 'data/blogs');

async function ensureDir() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
}

export default async function handler(req, res) {
  await ensureDir();

  // 新增文章
  if (req.method === 'POST') {
    const { title, content, id: providedId } = req.body || {}; // Allow providing an ID
    if (!title || !content) return res.status(400).json({ error: '缺少标题或内容' });
    const id = providedId || Date.now().toString(); // Use provided ID or generate a new one
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
    const id = req.url.split('/').pop();
    if (!id) return res.status(400).json({ error: '缺少id' });
    await fs.rm(path.join(BLOG_DIR, id + '.json'), { force: true });
    res.json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
