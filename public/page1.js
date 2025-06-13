import { formatDate } from './utils/dateFormat.js';

export default function initPage1(container) {
  const blogList = container.querySelector('#blog-list');

  if (!blogList) return;

  // Check if a refresh is needed
  if (localStorage.getItem('refreshBlogList')) {
    localStorage.removeItem('refreshBlogList');
  }

  async function fetchBlogs() {
    try {
      const res = await fetch('/api/blog');
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

      // 根据返回的 createdAt 解析日期
      const rawDate = blog.createdAt;
      const date = rawDate
        ? new Date(isNaN(rawDate) ? rawDate : Number(rawDate))
        : new Date();
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
          <div class="blog-icons">
            <div class="blog-icon-row">
              <button class="blog-edit-icon" title="编辑">✏️</button>
              <button class="blog-ai-icon" title="AI对话">🤖</button>
            </div>
            <div class="blog-icon-row">
              <button class="blog-copy-icon" title="复制">📋</button>
              <button class="blog-delete-icon" title="删除">🗑️</button>
            </div>
          </div>
        </div>
        <div class="blog-date">${dateStr}</div>
      `;

      const detailDiv = document.createElement('div');
      detailDiv.className = 'blog-detail';
      detailDiv.style.display = 'none'; // Initially hidden

      block.appendChild(titleDiv);
      block.appendChild(detailDiv);

      const deleteIcon = titleDiv.querySelector('.blog-delete-icon');
      const copyIcon = titleDiv.querySelector('.blog-copy-icon');
      const aiIcon = titleDiv.querySelector('.blog-ai-icon');
      const editIcon = titleDiv.querySelector('.blog-edit-icon');

      // Edit
      editIcon.onclick = () => {
        const blogToEdit = {
          id: blog.id,
          title: blog.title,
          content: blog.content
        };
        localStorage.setItem('blogToEdit', JSON.stringify(blogToEdit));
        window.location.hash = 'page3';
      };

      // Send to AI
      aiIcon.onclick = () => {
        const blogForAI = {
          title: blog.title,
          content: blog.content
        };
        localStorage.setItem('blogForAI', JSON.stringify(blogForAI));
        window.location.hash = 'home';
      };

      // 复制
      copyIcon.onclick = async () => {
        const textToCopy = `# ${blog.title}\n\n${blog.content}`;
        try {
          await navigator.clipboard.writeText(textToCopy);
          copyIcon.textContent = '✅';
          setTimeout(() => (copyIcon.textContent = '📋'), 1500);
        } catch (err) {
          console.error('复制失败:', err);
        }
      };

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
            titleDiv.querySelector('.blog-icons').style.display = '';
          };

          detailDiv.innerHTML = ''; // Clear previous content
          detailDiv.appendChild(backButton);
          const contentRender = document.createElement('div');
          contentRender.innerHTML = window.marked ? window.marked.parse(blog.content) : blog.content;
          detailDiv.appendChild(contentRender);

          detailDiv.style.display = 'block';
          titleDiv.querySelector('.blog-icons').style.display = 'none';
        } else {
          detailDiv.style.display = 'none';
          detailDiv.innerHTML = ''; // Clear content
          titleDiv.querySelector('.blog-icons').style.display = '';
        }
      };

      // 删除
      deleteIcon.onclick = async () => {
        // Removing confirm dialog per user request
        try {
          const res = await fetch(`/api/blog/${encodeURIComponent(blog.id)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchBlogs();
          } else {
            console.error('删除失败:', await res.text());
          }
        } catch (err) {
          console.error('删除请求失败:', err);
        }
      };
      blogList.appendChild(block);
    });
  }

  fetchBlogs();
}
