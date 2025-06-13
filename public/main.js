import { getDefaultPrompt } from './utils/defaultPrompts.js';

export default function initHome() {
  console.log('initHome function is called.'); // 调试信息

  const form = document.getElementById('fetch-form');
  const urlInput = document.getElementById('url-input');
  const btnFetch = document.getElementById('btn-fetch');
  const btnCopy = document.getElementById('btn-copy');
  const btnClear = document.getElementById('btn-clear');
  const controls = document.getElementById('controls');
  const output = document.getElementById('output');
  const extraInput = document.getElementById('extra-input'); // 获取提示词输入框
  const blogTitleInput = document.getElementById('blog-title');
  const btnCreateBlog = document.getElementById('btn-create-blog');
  const siteSelect = document.getElementById('site-select');
  const btnOpenSite = document.getElementById('btn-open-site');
  const btnAIClean = document.getElementById('btn-ai-clean');
  const aiModelSelect = document.getElementById('ai-model');
  const btnToggleRaw = document.getElementById('btn-toggle-raw');

  let rawMarkdown = '';
  let aiResponses = [];
  let currentDisplayIndex = -1; // -1 for raw, 0 and up for AI responses

  // Check for content passed from the blog page
  const blogContent = localStorage.getItem('blogContentForAI');
  if (blogContent) {
    rawMarkdown = blogContent;
    output.innerHTML = window.marked ? window.marked.parse(rawMarkdown) : rawMarkdown;
    controls.hidden = false;
    localStorage.removeItem('blogContentForAI');
  }

  // 初始化提示词输入框
  if (extraInput) {
    const defaultPromptText = getDefaultPrompt();
    console.log('Setting default prompt:', defaultPromptText); // 调试信息
    extraInput.value = defaultPromptText;
  } else {
    console.error('Element with ID "extra-input" was not found.'); // 调试信息
  }

  // AI清理按钮事件
  if (btnAIClean) {
    btnAIClean.addEventListener('click', async () => {
      if (!rawMarkdown) {
        alert('请先获取网页内容');
        return;
      }
      // If this is the first turn of a new conversation (based on raw markdown), clear previous AI responses.
      if (currentDisplayIndex === -1) {
        aiResponses = [];
      }

      btnAIClean.textContent = 'AI处理中...';
      btnAIClean.disabled = true;
      try {
        const authToken = localStorage.getItem('authToken') || '';
        if (!authToken) {
          throw new Error('请先在“身份验证”页面登录');
        }
        const extraPrompt = extraInput.value || '';
        
        // Use the currently displayed content as the basis for the next conversation turn
        let currentContent;
        if (currentDisplayIndex === -1) {
          currentContent = rawMarkdown;
        } else {
          currentContent = aiResponses[currentDisplayIndex];
        }
        const userInput = currentContent + '\n\n' + extraPrompt;

        const modelValue = aiModelSelect ? aiModelSelect.value : '';
        const endpoint = modelValue.startsWith('gpt-') ? '/api/openai' : '/api/gemini';
        
        const body = JSON.stringify({
          prompt: userInput,
          messages: [{ role: 'user', content: userInput }],
          model: modelValue || undefined
        });

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
          body: body
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(data.error || '请求失败');
        }

        const aiText = await res.text();
        aiResponses.push(aiText);
        currentDisplayIndex = aiResponses.length - 1;
        
        output.innerHTML = window.marked ? window.marked.parse(aiResponses[currentDisplayIndex]) : aiResponses[currentDisplayIndex];
        btnToggleRaw.style.display = 'inline-block';
        updateToggleText();

      } catch (err) {
        output.innerHTML = '❌ ' + err.message;
      } finally {
        btnAIClean.textContent = 'AI对话';
        btnAIClean.disabled = false;
      }
    });
  }

  function updateToggleText() {
    if (currentDisplayIndex === -1) {
      btnToggleRaw.textContent = `切换版本 (原文)`;
    } else {
      btnToggleRaw.textContent = `切换版本 (AI ${currentDisplayIndex + 1}/${aiResponses.length})`;
    }
  }

  // 切换原文/AI按钮事件
  if (btnToggleRaw) {
    btnToggleRaw.addEventListener('click', () => {
      if (aiResponses.length === 0) return;

      currentDisplayIndex++;
      if (currentDisplayIndex >= aiResponses.length) {
        currentDisplayIndex = -1; // Loop back to raw markdown
      }

      if (currentDisplayIndex === -1) {
        output.innerHTML = window.marked ? window.marked.parse(rawMarkdown) : rawMarkdown;
      } else {
        output.innerHTML = window.marked ? window.marked.parse(aiResponses[currentDisplayIndex]) : aiResponses[currentDisplayIndex];
      }
      updateToggleText();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // 检查本地 token
      const authToken = localStorage.getItem('authToken') || '';
      if (!authToken) {
        alert('请先在“身份验证”页面登录');
        return;
      }
      output.innerHTML = '⏳ 正在加载...';
      btnFetch.disabled = true;

      try {
        // 直接把 https://example.com => https://example.com
        const rawUrl = urlInput.value.trim();
        if (!rawUrl) throw new Error('URL 不能为空');

        const res = await fetch('/api/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ url: rawUrl })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');

        rawMarkdown = data.markdown || '';
        output.innerHTML = window.marked ? window.marked.parse(rawMarkdown) : rawMarkdown;
        output.style.whiteSpace = 'pre-wrap';
        output.style.wordBreak = 'break-all';
        controls.hidden = false;
        
        // Reset AI responses when new content is fetched
        aiResponses = [];
        currentDisplayIndex = -1;
        btnToggleRaw.style.display = 'none';
        btnAIClean.textContent = 'AI对话';
      } catch (err) {
        output.innerHTML = `❌ 出错：${err.message}`;
        rawMarkdown = '';
      } finally {
        btnFetch.disabled = false;
      }
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const authToken = localStorage.getItem('authToken') || '';
      if (!authToken) {
        alert('请先在“身份验证”页面登录');
        return;
      }
      try {
        // 复制当前显示内容
        let textToCopy;
        if (currentDisplayIndex === -1) {
          textToCopy = rawMarkdown;
        } else {
          textToCopy = aiResponses[currentDisplayIndex];
        }
        await navigator.clipboard.writeText(textToCopy);
        btnCopy.textContent = '已复制 ✅';
        setTimeout(() => (btnCopy.textContent = '复制文本'), 1500);
      } catch {
        alert('复制失败，请手动选择文本复制');
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      output.innerHTML = '';
      rawMarkdown = '';
      aiResponses = [];
      currentDisplayIndex = -1;
      urlInput.value = '';
      controls.hidden = true;
      urlInput.focus();
      // 清空提示词输入框为默认值
      if (extraInput) {
        extraInput.value = getDefaultPrompt(); // 重新设置默认提示词
      }
      if (btnToggleRaw) {
        btnToggleRaw.style.display = 'none';
        btnToggleRaw.textContent = '切换版本';
      }
      btnAIClean.textContent = 'AI对话';
      if (blogTitleInput) {
        blogTitleInput.value = ''; // 清空博客标题
      }
    });
  }

  // 常用网页下拉列表跳转功能
  if (siteSelect && btnOpenSite) {
    btnOpenSite.addEventListener('click', () => {
      const url = siteSelect.value;
      if (url) window.open(url, '_blank');
    });
    // 支持直接选择后自动跳转（可选，若只需按钮跳转可删除此段）
    // siteSelect.addEventListener('change', () => {
    //   if (siteSelect.value) window.open(siteSelect.value, '_blank');
    // });
  }

  if (btnCreateBlog) {
    btnCreateBlog.addEventListener('click', async () => {
      const authToken = localStorage.getItem('authToken') || '';
      if (!authToken) {
        alert('请先在“身份验证”页面登录');
        return;
      }
      const title = blogTitleInput.value.trim();
      if (!title) {
        alert('请输入博客标题');
        blogTitleInput.focus();
        return;
      }
      const content = currentDisplayIndex === -1 ? rawMarkdown : aiResponses[currentDisplayIndex];
      if (!content) {
        alert('没有可保存的内容');
        return;
      }
      btnCreateBlog.textContent = '创建中...';
      btnCreateBlog.disabled = true;
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
          blogTitleInput.value = '';
        }
      } catch (err) {
        alert('创建失败: ' + err.message);
      } finally {
        btnCreateBlog.textContent = '创建博客';
        btnCreateBlog.disabled = false;
      }
    });
  }
}
