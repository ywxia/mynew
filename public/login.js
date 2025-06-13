export default function initLogin() {
  const dots = document.querySelectorAll('.dot');
  const keys = document.querySelectorAll('.key');
  const authStatus = document.getElementById('auth-status');
  let pin = '';

  keys.forEach(key => {
    key.addEventListener('click', () => {
      if (key.classList.contains('backspace')) {
        if (pin.length > 0) {
          pin = pin.slice(0, -1);
        }
      } else if (key.classList.contains('enter')) {
        if (pin.length > 0) {
          tryLogin(pin);
        }
      } else {
        if (pin.length < dots.length) {
          pin += key.textContent;
        }
      }
      updateDots();
    });
  });

  function updateDots() {
    dots.forEach((dot, index) => {
      if (index < pin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

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
        localStorage.setItem('authToken', data.token);
        authStatus.textContent = '登录成功';
        setTimeout(() => {
          location.hash = '#home';
        }, 300);
      } else {
        throw new Error(data.error || '密码错误');
      }
    } catch (e) {
      authStatus.textContent = e.message;
      pin = '';
      updateDots();
    }
  }

  // Check for existing token on load
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    // If there's a token, try to "login" with it to verify.
    // This part of the logic might need adjustment based on how you want to handle expired tokens.
    // For now, we assume if a token exists, we can proceed.
    // A better approach would be a dedicated API endpoint to verify the token.
    location.hash = '#home';
  }
}
