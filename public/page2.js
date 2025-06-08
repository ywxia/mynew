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
    ytOutput.innerHTML = '请先在“身份验证”页面登录';
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
        const data = await res.json();
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
    ytPrompt.value = '请用简体中文总结这段视频的主要内容和核心信息，并给视频起个标题。';
  });
}
