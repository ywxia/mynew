export default function initPage3() {
  const form = document.getElementById('blog-form');
  const titleInput = document.getElementById('blog-title');
  const contentInput = document.getElementById('blog-content');
  const submitBtn = document.getElementById('blog-create');

  if (!form) return;

  let editingBlogId = null;

  // Check for blog to edit when page loads
  const blogToEditData = localStorage.getItem('blogToEdit');
  if (blogToEditData) {
    try {
      const blogToEdit = JSON.parse(blogToEditData);
      titleInput.value = blogToEdit.title;
      contentInput.value = blogToEdit.content;
      editingBlogId = blogToEdit.id;
      submitBtn.textContent = '保存更改';
      // Clean up local storage immediately after use
      localStorage.removeItem('blogToEdit');
    } catch (e) {
      console.error("Failed to parse blog data from localStorage", e);
      localStorage.removeItem('blogToEdit');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const authToken = localStorage.getItem('authToken') || '';
    if (!authToken) {
      alert('请先登录后再操作');
      return;
    }
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      alert('请输入标题和内容');
      return;
    }

    const isEditing = !!editingBlogId;
    submitBtn.textContent = isEditing ? '保存中...' : '创建中...';
    submitBtn.disabled = true;

    try {
      if (isEditing) {
        // Step 1: Delete the old file
        const deleteRes = await fetch(`/api/blog/${encodeURIComponent(editingBlogId)}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (!deleteRes.ok) {
          const data = await deleteRes.json().catch(() => ({ error: '删除旧文件失败' }));
          throw new Error(data.error);
        }

        // Step 2: Create a new file with the same ID
        const createRes = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ id: editingBlogId, title, content })
        });

        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({ error: '创建新文件失败' }));
          throw new Error(data.error);
        }
        
        alert('博客已成功保存！');
        window.location.hash = 'page1';

      } else {
        // Original create logic
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ title, content })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: '创建失败' }));
          throw new Error(data.error);
        }

        alert('博客已创建，可在“博客文章”页面查看');
        titleInput.value = '';
        contentInput.value = '';
      }
    } catch (err) {
      alert('操作失败: ' + err.message);
    } finally {
      submitBtn.textContent = isEditing ? '保存更改' : '创建博客';
      submitBtn.disabled = false;
    }
  });
}
