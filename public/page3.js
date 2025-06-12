export default function initPage3() {
  const form = document.getElementById('blog-form');
  const titleInput = document.getElementById('blog-title');
  const contentInput = document.getElementById('blog-content');
  const submitBtn = document.getElementById('blog-create');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const authToken = localStorage.getItem('authToken') || '';
    if (!authToken) {
      alert('请先在“身份验证”页面登录');
      return;
    }
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      alert('请输入标题和内容');
      return;
    }
    submitBtn.textContent = '创建中...';
    submitBtn.disabled = true;
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
        titleInput.value = '';
        contentInput.value = '';
      }
    } catch (err) {
      alert('创建失败: ' + err.message);
    } finally {
      submitBtn.textContent = '创建博客';
      submitBtn.disabled = false;
    }
  });
}
