const form = document.getElementById('fetch-form');
const urlInput = document.getElementById('url-input');
const btnFetch = document.getElementById('btn-fetch');
const btnCopy = document.getElementById('btn-copy');
const btnClear = document.getElementById('btn-clear');
const controls = document.getElementById('controls');
const output = document.getElementById('output');
let rawMarkdown = ''; // 保存原始 markdown
let aiMarkdown = '';  // 保存AI生成的markdown
let showingAI = false;

const btnAIClean = document.getElementById('btn-ai-clean');
const btnToggleRaw = document.getElementById('btn-toggle-raw');

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
  } catch (err) {
    output.innerHTML = `❌ 出错：${err.message}`;
    rawMarkdown = '';
  } finally {
    btnFetch.disabled = false;
  }
});

btnCopy.addEventListener('click', async () => {
  const authToken = localStorage.getItem('authToken') || '';
  if (!authToken) {
    alert('请先在“身份验证”页面登录');
    return;
  }
  try {
    // 复制当前显示内容（不加提示词）
    const text = showingAI ? aiMarkdown : rawMarkdown;
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = '已复制 ✅';
    setTimeout(() => (btnCopy.textContent = '复制文本'), 1500);
  } catch {
    alert('复制失败，请手动选择文本复制');
  }
});

btnClear.addEventListener('click', () => {
  output.innerHTML = '';
  rawMarkdown = '';
  urlInput.value = '';
  controls.hidden = true;
  urlInput.focus();
  // 清空提示词输入框为默认值+时间分析段
  if (extraInput) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    extraInput.value =
      '请帮我清理和整理以上网页爬取的内容，仅保留主要内容，并用简体中文分段输出。\n\n' +
      `当前时间是 ${y}年${m}月${d}日，请用简体中文深度分析和解读一下这篇文章。`;
  }
  output.style.whiteSpace = 'pre-wrap';
  output.style.wordBreak = 'break-all';
  aiMarkdown = '';
  showingAI = false;
  btnToggleRaw.style.display = 'none';
});

// 新增：提示词输入框
let extraInput = document.getElementById('extra-input');
if (!extraInput) {
  extraInput = document.createElement('textarea');
  extraInput.id = 'extra-input';
  extraInput.rows = 3;
  extraInput.style.width = '100%';
  extraInput.style.marginTop = '0.5em';
  // 默认提示词 + 当前时间分析段
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  extraInput.value =
    '请帮我清理和整理以上网页爬取的内容，仅保留主要内容，并用简体中文分段输出。\n\n' +
    `当前时间是 ${y}年${m}月${d}日，请用简体中文深度分析和解读一下这篇文章。`;
  // 插入到 extra-section
  const extraSection = document.getElementById('extra-section');
  if (extraSection) {
    extraSection.appendChild(extraInput);
  } else {
    output.parentNode.insertBefore(extraInput, output.nextSibling);
  }
}

// 常用网页下拉列表跳转功能
const siteSelect = document.getElementById('site-select');
const btnOpenSite = document.getElementById('btn-open-site');
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

const blogTitleInput = document.getElementById('blog-title');
const btnCreateBlog = document.getElementById('btn-create-blog');

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
    const content = showingAI ? aiMarkdown : rawMarkdown;
    if (!content) {
      alert('没有可保存的内容');
      return;
    }
    btnCreateBlog.textContent = '创建中...';
    btnCreateBlog.disabled = true;
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ title, content })
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
