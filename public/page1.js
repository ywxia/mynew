import { formatDate } from './utils/dateFormat.js';

export default function initPage1() {
  const blogList = document.getElementById('blog-list');
  const authToken = localStorage.getItem('authToken') || '';

  async function fetchBlogs() {
    try {
      const res = await fetch('/api/blog', {
        headers: { 'Authorization': 'Bearer ' + authToken }
      });
      const data = await res.json();
      console.log('获取到的博客数据:', data.blogs); // 调试用
      renderBlogs(data.blogs || []);
    } catch (err) {
      console.error('获取博客失败:', err);
    }
  }

  function renderBlogs(blogs) {
    blogList.innerHTML = '';
    if (!blogs.length) {
      blogList.innerHTML = '<p style="text-align:center;color:#888;">暂无文章</p>';
      return;
    }

    blogs.forEach(blog => {
      const block = document.createElement('div');
      block.className = 'blog-block';

      // 从时间戳创建日期字符串
      const date = blog.createdAt ? new Date(Number(blog.createdAt)) : new Date();
      const dateStr = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');

      const titleDiv = document.createElement('div');
      titleDiv.className = 'blog-title';
      titleDiv.innerHTML = `
        <div class="blog-title-header">
          <span class="blog-title-text">${blog.title}</span>
          <button class="blog-delete-icon">🗑️</button>
        </div>
        <div class="blog-date">${dateStr}</div>
      `;

      const detailDiv = document.createElement('div');
      detailDiv.className = 'blog-detail';
      detailDiv.style.display = 'none'; // Initially hidden

      block.appendChild(titleDiv);
      block.appendChild(detailDiv);

      const deleteIcon = titleDiv.querySelector('.blog-delete-icon');

      // 展开/收起
      titleDiv.querySelector('.blog-title-text').onclick = () => {
        if (detailDiv.style.display === 'none') {
          // Create back button
          const backButton = document.createElement('button');
          backButton.className = 'blog-back-icon';
          backButton.innerHTML = '⬅️ 返回';
          backButton.onclick = () => {
            detailDiv.style.display = 'none';
            detailDiv.innerHTML = ''; // Clear content
            deleteIcon.style.display = ''; // Show delete icon
          };

          detailDiv.innerHTML = ''; // Clear previous content
          detailDiv.appendChild(backButton);
          const contentRender = document.createElement('div');
          contentRender.innerHTML = window.marked ? window.marked.parse(blog.content) : blog.content;
          detailDiv.appendChild(contentRender);

          detailDiv.style.display = 'block';
          deleteIcon.style.display = 'none'; // Hide delete icon
        } else {
          detailDiv.style.display = 'none';
          detailDiv.innerHTML = ''; // Clear content
          deleteIcon.style.display = ''; // Show delete icon
        }
      };

      // 删除
      deleteIcon.onclick = async () => {
        if (!confirm('确定要删除这篇文章吗？')) return;
        const res = await fetch(`/api/blog/${encodeURIComponent(blog.id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) fetchBlogs();
        else alert('删除失败');
      };
      blogList.appendChild(block);
    });
  }

  fetchBlogs();
}
