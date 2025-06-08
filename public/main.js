const form = document.getElementById('fetch-form');
const urlInput = document.getElementById('url-input');
const btnFetch = document.getElementById('btn-fetch');
const btnCopy = document.getElementById('btn-copy');
const btnClear = document.getElementById('btn-clear');
const controls = document.getElementById('controls');
const output = document.getElementById('output');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // 检查本地 token
  const authToken = localStorage.getItem('authToken') || '';
  if (!authToken) {
    alert('请先在“身份验证”页面登录');
    return;
  }
  output.textContent = '⏳ 正在加载...';
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

    output.textContent = data.markdown;
    controls.hidden = false;
  } catch (err) {
    output.textContent = `❌ 出错：${err.message}`;
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
    // 复制 output 内容 + 附加文本
    const text = output.textContent + '\n\n' + extraInput.value;
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = '已复制 ✅';
    setTimeout(() => (btnCopy.textContent = '复制文本'), 1500);
  } catch {
    alert('复制失败，请手动选择文本复制');
  }
});

btnClear.addEventListener('click', () => {
  output.textContent = '';
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
