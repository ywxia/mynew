const form = document.getElementById('fetch-form');
const urlInput = document.getElementById('url-input');
const btnFetch = document.getElementById('btn-fetch');
const btnCopy = document.getElementById('btn-copy');
const btnClear = document.getElementById('btn-clear');
const controls = document.getElementById('controls');
const output = document.getElementById('output');
let rawMarkdown = ''; // 保存原始 markdown

// --- 状态持久化 ---
const saveState = () => {
  const state = {
    url: urlInput.value,
    rawMarkdown,
    output: output.innerHTML,
    extra: extraInput ? extraInput.value : '',
    controlsVisible: !controls.hidden
  };
  localStorage.setItem('indexState', JSON.stringify(state));
};

const loadState = () => {
  try {
    const state = JSON.parse(localStorage.getItem('indexState') || '{}');
    if (state.url) urlInput.value = state.url;
    if (state.extra !== undefined && extraInput) extraInput.value = state.extra;
    if (state.rawMarkdown) {
      rawMarkdown = state.rawMarkdown;
      output.innerHTML = window.marked
        ? window.marked.parse(rawMarkdown)
        : rawMarkdown;
      controls.hidden = !state.controlsVisible;
      output.style.whiteSpace = 'pre-wrap';
      output.style.wordBreak = 'break-all';
    }
  } catch {}
};

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
    saveState();
  } catch (err) {
    output.innerHTML = `❌ 出错：${err.message}`;
    rawMarkdown = '';
    saveState();
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
    // 复制 markdown 内容 + 附加文本
    const text = rawMarkdown + '\n\n' + extraInput.value;
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
  // 清空附加文本框为默认值
  if (extraInput) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    extraInput.value = `当前时间是 ${y}年${m}月${d}日，请用简体中文深度分析和解读一下这篇文章，概括其主要内容，并起一个合适的中文标题`;
  }
  output.style.whiteSpace = 'pre-wrap';
  output.style.wordBreak = 'break-all';
  saveState();
});

// 新增：附加文本输入框
let extraInput = document.getElementById('extra-input');
if (!extraInput) {
  extraInput = document.createElement('textarea');
  extraInput.id = 'extra-input';
  extraInput.rows = 3;
  extraInput.style.width = '100%';
  extraInput.style.marginTop = '0.5em';
  // 获取当前时间
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  extraInput.value = `当前时间是 ${y}年${m}月${d}日，请用简体中文深度分析和解读一下这篇文章，概括其主要内容，并起一个合适的中文标题`;
  // 插入到 extra-section
  const extraSection = document.getElementById('extra-section');
  if (extraSection) {
    extraSection.appendChild(extraInput);
  } else {
    output.parentNode.insertBefore(extraInput, output.nextSibling);
  }
}

// 输入内容变化时保存状态
urlInput.addEventListener('input', saveState);
if (extraInput) extraInput.addEventListener('input', saveState);

// 页面加载时恢复状态
loadState();

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
