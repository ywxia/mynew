export default function initAuth() {
// 只负责身份认证
let authToken = localStorage.getItem('authToken') || '';
let isAuthed = false;

const authDiv = document.createElement('div');
authDiv.className = 'auth-div';
authDiv.innerHTML = `
  <input type="password" id="auth-password" placeholder="请输入密码" style="width:180px;" />
  <button id="auth-login">登录</button>
  <span id="auth-status" style="color:red;margin-left:1em;"></span>
`;
const authSection = document.getElementById('auth-section');
if (authSection) {
  authSection.appendChild(authDiv);
}

const authInput = document.getElementById('auth-password');
const authBtn = document.getElementById('auth-login');
const authStatus = document.getElementById('auth-status');

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
      authInput.disabled = true;
      authBtn.disabled = true;
    } else {
      throw new Error(data.error || '密码错误');
    }
  } catch (e) {
    authStatus.textContent = e.message;
    isAuthed = false;
    authToken = '';
    localStorage.removeItem('authToken');
  }
}

authBtn.addEventListener('click', () => {
  tryLogin(authInput.value.trim());
});
authInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') authBtn.click();
});
if (authToken) {
  tryLogin(authToken);
}
}
