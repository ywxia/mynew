const form = document.getElementById('fetch-form');
const urlInput = document.getElementById('url-input');
const btnFetch = document.getElementById('btn-fetch');
const btnCopy = document.getElementById('btn-copy');
const btnClear = document.getElementById('btn-clear');
const controls = document.getElementById('controls');
const output = document.getElementById('output');

// ====== 新增：身份密码认证 ======
let authToken = localStorage.getItem('authToken') || '';
let isAuthed = false;

// 创建密码输入框和登录按钮
const authDiv = document.createElement('div');
authDiv.className = 'auth-div';
authDiv.innerHTML = `
  <input type="password" id="auth-password" placeholder="请输入密码" style="width:180px;" />
  <button id="auth-login">登录</button>
  <span id="auth-status" style="color:red;margin-left:1em;"></span>
`;
// 插入到 auth-section
const authSection = document.getElementById('auth-section');
if (authSection) {
  authSection.appendChild(authDiv);
} else {
  document.body.insertBefore(authDiv, document.body.firstChild);
}

const authInput = document.getElementById('auth-password');
const authBtn = document.getElementById('auth-login');
const authStatus = document.getElementById('auth-status');

// 禁用主功能区
function setControlsEnabled(enabled) {
  urlInput.disabled = !enabled;
  btnFetch.disabled = !enabled;
  btnCopy.disabled = !enabled;
  btnClear.disabled = !enabled;
  if (!enabled) controls.hidden = true;
}
setControlsEnabled(false);

// 登录函数
async function tryLogin(pwd) {
  authStatus.textContent = '正在验证...';
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      isAuthed = true;
      authStatus.textContent = '登录成功';
      setControlsEnabled(true);
      authInput.disabled = true;
      authBtn.disabled = true;
    } else {
      throw new Error(data.error || '密码错误');
    }
  } catch (e) {
    authStatus.textContent = e.message;
    setControlsEnabled(false);
    isAuthed = false;
    authToken = '';
    localStorage.removeItem('authToken');
  }
}

// 登录按钮事件
authBtn.addEventListener('click', () => {
  tryLogin(authInput.value.trim());
});

// 回车登录
authInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') authBtn.click();
});

// 自动尝试登录
if (authToken) {
  // 这里假设 token 也可直接作为密码重试
  tryLogin(authToken);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isAuthed) {
    authStatus.textContent = '请先登录';
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
  if (!isAuthed) {
    authStatus.textContent = '请先登录';
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
