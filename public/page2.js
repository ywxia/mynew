import { getYoutubeDefaultPrompt } from './utils/defaultPrompts.js';

export default function initPage2(container) {
  const ytForm = container.querySelector('#yt-form');
  const ytUrl = container.querySelector('#yt-url');
  const ytPrompt = container.querySelector('#yt-prompt');
  const ytModel = container.querySelector('#yt-model');
  const ytOutput = container.querySelector('#yt-output');
  const ytGenerate = container.querySelector('#yt-generate');

  let rawMd = ''; // 保存原始markdown

  async function loadModels() {
    try {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('无法加载模型列表');
      }
      const models = await response.json();
      
      // 由于page2只使用gemini模型，所以这里只加载gemini
      const geminiModels = models.gemini || [];

      ytModel.innerHTML = ''; // 清空现有选项
      if (geminiModels.length > 0) {
        geminiModels.forEach(model => {
          const option = document.createElement('option');
          option.value = model;
          // 为了显示效果，将模型名称美化一下
          const displayName = model.split('-').slice(0, 2).join(' ') + ' ' + model.split('-').slice(2, -1).join(' ');
          option.textContent = displayName.replace(/\b\w/g, l => l.toUpperCase()); // 首字母大写
          ytModel.appendChild(option);
        });
      } else {
        const option = document.createElement('option');
        option.textContent = '无可用模型';
        option.disabled = true;
        ytModel.appendChild(option);
      }
    } catch (error) {
      console.error('加载模型失败:', error);
      ytModel.innerHTML = '<option>加载模型失败</option>';
      ytModel.disabled = true;
    }
  }

  loadModels();

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

      // 使用流式读取
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let md = '';
      ytOutput.innerHTML = ''; // 清空之前的内容

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        md += decoder.decode(value, { stream: true });
        ytOutput.innerHTML = window.marked ? window.marked.parse(md) : md;
        rawMd = md; // 持续更新原始 markdown
      }
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
