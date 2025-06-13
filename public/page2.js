import { getYoutubeDefaultPrompt } from './utils/defaultPrompts.js';

export default function initPage2() {
const ytForm = document.getElementById('yt-form');
const ytUrl = document.getElementById('yt-url');
const ytPrompt = document.getElementById('yt-prompt');
const ytModel = document.getElementById('yt-model');
const ytOutput = document.getElementById('yt-output');
const ytGenerate = document.getElementById('yt-generate');

let rawMd = ''; // 保存原始markdown

ytForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ytOutput.innerHTML = '⏳ 正在生成...';
  ytGenerate.disabled = true;

  const authToken = localStorage.getItem('authToken') || '';
  if (!authToken) {
    ytOutput.innerHTML = '请先登录后再操作';
    ytGenerate.disabled = false;
    return;
  }

  try {
    const res = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
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
const ytCopy = document.getElementById('yt-copy');
const ytClear = document.getElementById('yt-clear');

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
const ytBlogTitle = document.getElementById('yt-blog-title');
const ytBtnCreateBlog = document.getElementById('yt-btn-create-blog');

if (ytBtnCreateBlog) {
  ytBtnCreateBlog.addEventListener('click', async () => {
    const authToken = localStorage.getItem('authToken') || '';
    if (!authToken) {
      alert('请先登录后再操作');
      return;
    }
    const title = ytBlogTitle.value.trim();
    if (!title) {
      alert('请输入博客标题');
      ytBlogTitle.focus();
      return;
    }
    const content = rawMd;
    if (!content) {
      alert('没有可保存的内容');
      return;
    }
    ytBtnCreateBlog.textContent = '创建中...';
    ytBtnCreateBlog.disabled = true;
    try {
      const createdAt = new Date().toISOString();
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken
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
        alert(msg);
      } else {
        alert('博客已创建，可在“博客文章”页面查看');
        ytBlogTitle.value = '';
      }
    } catch (err) {
      alert('创建失败: ' + err.message);
    } finally {
      ytBtnCreateBlog.textContent = '创建博客';
      ytBtnCreateBlog.disabled = false;
    }
  });
}
}
