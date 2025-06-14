export default function initPage3(container) {
  let form = container.querySelector('#blog-form');
  if (!form) return;

  // Clone the form and replace it to remove all old event listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  form = newForm;

  const titleInput = form.querySelector('#blog-title');
  const contentInput = form.querySelector('#blog-content');
  const submitBtn = form.querySelector('#blog-create');
  const notionBtn = form.querySelector('#add-to-notion');
  const openNotionBtn = form.querySelector('#open-notion-page');
  const notionPageSelect = form.querySelector('#notion-page-select');
  const clearBtn = form.querySelector('#clear-form');

  let editingBlogId = null;

  async function loadNotionPages() {
    try {
      const res = await fetch('/api/notion/pages');
      if (!res.ok) {
        throw new Error('Failed to load Notion pages');
      }
      const pages = await res.json();
      
      notionPageSelect.innerHTML = ''; // Clear loading option
      if (pages.length === 0) {
        notionPageSelect.innerHTML = '<option value="">无可用页面</option>';
        return;
      }

      pages.forEach(page => {
        const option = document.createElement('option');
        option.value = page.id;
        option.textContent = page.title;
        notionPageSelect.appendChild(option);
      });

    } catch (error) {
      console.error(error);
      notionPageSelect.innerHTML = '<option value="">加载失败</option>';
    }
  }

  loadNotionPages();

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
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      console.error('Title or content is empty.');
      // Silently return, or provide a non-blocking visual cue
      return;
    }

    const isEditing = !!editingBlogId;
    submitBtn.textContent = isEditing ? '保存中...' : '创建中...';
    submitBtn.disabled = true;

    try {
      if (isEditing) {
        // Step 1: Delete the old file
        const deleteRes = await fetch(`/api/blog/${encodeURIComponent(editingBlogId)}`, {
          method: 'DELETE'
        });

        if (!deleteRes.ok) {
          const data = await deleteRes.json().catch(() => ({ error: '删除旧文件失败' }));
          throw new Error(data.error);
        }

        // Step 2: Create a new file with the same ID
        const createRes = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: editingBlogId, title, content })
        });

        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({ error: '创建新文件失败' }));
          throw new Error(data.error);
        }
        localStorage.setItem('refreshBlogList', 'true');
        // Silently redirect after saving
        titleInput.value = '';
        contentInput.value = '';
        window.location.hash = 'page1';

      } else {
        // Original create logic
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, content })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: '创建失败' }));
          throw new Error(data.error);
        }

        // Silently clear form after creation
        titleInput.value = '';
        contentInput.value = '';
        // Optionally, redirect or give a subtle success indicator
        localStorage.setItem('refreshBlogList', 'true');
        window.location.hash = 'page1';
      }
    } catch (err) {
      console.error('操作失败:', err);
    } finally {
      // Reset state after any operation to prevent conflicts
      editingBlogId = null;
      submitBtn.textContent = '创建博客';
      submitBtn.disabled = false;
    }
  });

  notionBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const parentId = notionPageSelect.value;

    if (!title || !content) {
      alert('标题和内容不能为空！');
      return;
    }
    if (!parentId) {
      alert('请选择一个 Notion 页面！');
      return;
    }

    notionBtn.textContent = '添加中...';
    notionBtn.disabled = true;

    try {
      const res = await fetch('/api/notion/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, markdownContent: content, parentId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '添加到 Notion 失败' }));
        throw new Error(data.error);
      }

      alert('成功添加到 Notion！');
      titleInput.value = '';
      contentInput.value = '';

    } catch (err) {
      console.error('添加到 Notion 失败:', err);
      alert(`添加到 Notion 失败: ${err.message}`);
    } finally {
      notionBtn.textContent = '添加到 Notion';
      notionBtn.disabled = false;
      editingBlogId = null;
      submitBtn.textContent = '创建博客';
    }
  });

  openNotionBtn.addEventListener('click', () => {
    const pageId = notionPageSelect.value;
    if (pageId) {
      const url = `https://www.notion.so/${pageId.replace(/-/g, '')}`;
      window.open(url, '_blank');
    } else {
      alert('请先选择一个 Notion 页面！');
    }
  });

  clearBtn.addEventListener('click', () => {
    titleInput.value = '';
    contentInput.value = '';
    editingBlogId = null;
    submitBtn.textContent = '创建博客';
    submitBtn.disabled = false;
    notionBtn.textContent = '添加到 Notion';
    notionBtn.disabled = false;
  });
}
