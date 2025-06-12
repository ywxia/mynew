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
  const btnToggleRaw = document.getElementById('btn-toggle-raw');
  const btnEdit = document.getElementById('btn-edit');
  const outputEditor = document.getElementById('output-editor');

  let rawMarkdown = '';
  let aiMarkdown = '';
  let showingAI = false;
  let editing = false;

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
      btnAIClean.textContent = 'AI处理中...';
      btnAIClean.disabled = true;
      try {
        const authToken = localStorage.getItem('authToken') || '';
        if (!authToken) {
          alert('请先在“身份验证”页面登录');
          btnAIClean.textContent = 'AI清理';
          btnAIClean.disabled = false;
          return;
        }
        // 从提示词输入框获取
        const extraPrompt = extraInput.value || '';
        const userInput = rawMarkdown + '\n\n' + extraPrompt;
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({
            prompt: userInput
          })
        });
        if (!res.ok) {
          let msg = '请求失败';
          try {
            const data = await res.json();
            msg = data.error || msg;
          } catch {
            msg = await res.text();
          }
          output.innerHTML = '❌ ' + msg;
          aiMarkdown = '';
          btnAIClean.textContent = 'AI清理';
          btnAIClean.disabled = false;
          return;
        }
        const aiText = await res.text();
        aiMarkdown = aiText;
        output.innerHTML = window.marked ? window.marked.parse(aiMarkdown) : aiMarkdown;
        showingAI = true;
        btnToggleRaw.style.display = '';
        if (outputEditor) outputEditor.style.display = 'none';
        if (btnEdit) btnEdit.textContent = '编辑文本';
        editing = false;
      } catch (err) {
        output.innerHTML = '❌ ' + err.message;
        aiMarkdown = '';
      } finally {
        btnAIClean.textContent = 'AI清理';
        btnAIClean.disabled = false;
      }
    });
  }

  // 切换原文/AI按钮事件
  if (btnToggleRaw) {
    btnToggleRaw.addEventListener('click', () => {
      if (editing) {
        // 如果正在编辑，先退出编辑模式
        btnEdit.click();
      }
      if (showingAI) {
        output.innerHTML = window.marked ? window.marked.parse(rawMarkdown) : rawMarkdown;
        showingAI = false;
        btnToggleRaw.textContent = '切换原文/AI';
      } else {
        output.innerHTML = window.marked ? window.marked.parse(aiMarkdown) : aiMarkdown;
        showingAI = true;
        btnToggleRaw.textContent = '切换原文/AI';
      }
    });
  }

  // 编辑文本按钮事件
  if (btnEdit && outputEditor) {
    btnEdit.addEventListener('click', () => {
      if (!editing) {
        const text = showingAI ? aiMarkdown : rawMarkdown;
        outputEditor.value = text;
        output.style.display = 'none';
        outputEditor.style.display = '';
        btnEdit.textContent = '保存';
        editing = true;
      } else {
        const newText = outputEditor.value;
        if (showingAI) {
          aiMarkdown = newText;
        } else {
          rawMarkdown = newText;
        }
        output.innerHTML = window.marked ? window.marked.parse(newText) : newText;
        output.style.display = '';
        outputEditor.style.display = 'none';
        btnEdit.textContent = '编辑文本';
        editing = false;
      }
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
        aiMarkdown = '';
        showingAI = false;
        btnToggleRaw.style.display = 'none';
        if (outputEditor) outputEditor.style.display = 'none';
        if (btnEdit) btnEdit.textContent = '编辑文本';
        editing = false;
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
        // 复制当前显示内容（不加提示词）
        const text = editing
          ? outputEditor.value
          : showingAI
            ? aiMarkdown
            : rawMarkdown;
        await navigator.clipboard.writeText(text);
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
      aiMarkdown = ''; // 清空AI内容
      showingAI = false; // 重置显示状态
      urlInput.value = '';
      controls.hidden = true;
      urlInput.focus();
      // 清空提示词输入框为默认值
      if (extraInput) {
        extraInput.value = getDefaultPrompt(); // 重新设置默认提示词
      }
      if (btnToggleRaw) {
        btnToggleRaw.style.display = 'none'; // 隐藏切换按钮
        btnToggleRaw.textContent = '切换原文/AI';
      }
      if (outputEditor) outputEditor.style.display = 'none';
      if (btnEdit) btnEdit.textContent = '编辑文本';
      editing = false;
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
      const content = editing
        ? outputEditor.value
        : showingAI
          ? aiMarkdown
          : rawMarkdown;
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
