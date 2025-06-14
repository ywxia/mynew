import { getYoutubeDefaultPrompt } from './utils/defaultPrompts.js';

export default function initPage2(container) {
const ytForm = container.querySelector('#yt-form');
const ytUrl = container.querySelector('#yt-url');
const ytPrompt = container.querySelector('#yt-prompt');
const ytModel = container.querySelector('#yt-model');
const ytOutput = container.querySelector('#yt-output');
const ytGenerate = container.querySelector('#yt-generate');

let rawMd = ''; // 保存原始markdown

ytForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ytOutput.innerHTML = '⏳ 正在生成...';
  ytGenerate.disabled = true;


  try {
    const res = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: ytUrl.value.trim(),
        prompt: ytPrompt.value.trim(),
        model: ytModel.value
      })
    });

    if (!res.ok) {
      let msg = '请求失败';
      try {
        const clone = res.clone();
        const data = await clone.json();
        msg = data.error || msg;
      } catch {
        msg = await res.text();
      }
      ytOutput.innerHTML = '❌ ' + msg;
      ytGenerate.disabled = false;
      rawMd = '';
      return;
    }

    // 只用一次性读取
    const md = await res.text();
    ytOutput.innerHTML = window.marked ? window.marked.parse(md) : md;
    rawMd = md;
  } catch (err) {
    ytOutput.innerHTML = '❌ ' + err.message;
    rawMd = '';
  } finally {
    ytGenerate.disabled = false;
  }
});

// 新增：复制和清空按钮功能
const ytCopy = container.querySelector('#yt-copy');
const ytClear = container.querySelector('#yt-clear');

if (ytCopy) {
  ytCopy.addEventListener('click', async () => {
    if (rawMd) {
      await navigator.clipboard.writeText(rawMd);
      ytCopy.textContent = '已复制 ✅';
      setTimeout(() => (ytCopy.textContent = '复制'), 1500);
    }
  });
}

if (ytClear) {
  ytClear.addEventListener('click', () => {
    ytOutput.innerHTML = '';
    rawMd = '';
    ytUrl.value = '';
    ytPrompt.value = getYoutubeDefaultPrompt();
  });
}

// 新增：创建博客功能
const ytBlogTitle = container.querySelector('#yt-blog-title');
const ytBtnCreateBlog = container.querySelector('#yt-btn-create-blog');

if (ytBtnCreateBlog) {
  ytBtnCreateBlog.addEventListener('click', async () => {
    const title = ytBlogTitle.value.trim();
    if (!title) {
      console.error('Blog title is empty.');
      ytBlogTitle.focus();
      return;
    }
    const content = rawMd;
    if (!content) {
      console.error('No content to save.');
      return;
    }
    ytBtnCreateBlog.textContent = '创建中...';
    ytBtnCreateBlog.disabled = true;
    try {
      const createdAt = new Date().toISOString();
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content, createdAt })
      });
      if (!res.ok) {
        let msg = '创建失败';
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {
          msg = await res.text();
        }
        console.error('创建失败:', msg);
      } else {
        // Silently clear title after creation
        ytBlogTitle.value = '';
        // Set flag and navigate to page1 to see the new blog
        localStorage.setItem('refreshBlogList', 'true');
        window.location.hash = 'page1';
      }
    } catch (err) {
      console.error('创建失败:', err);
    } finally {
      ytBtnCreateBlog.textContent = '创建博客';
      ytBtnCreateBlog.disabled = false;
    }
  });
}
}
