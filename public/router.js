const app = document.getElementById('app');
const navbar = document.querySelector('.navbar');
const loginLink = document.querySelector('.nav-login');
const pageCache = {}; // 页面缓存

function isAuthed() {
  return !!localStorage.getItem('authToken');
}

function toggleNavbar(show) {
  if (navbar) {
    navbar.style.display = show ? '' : 'none';
  }
}

const routes = {
  home: { path: 'pages/home.html', script: './main.js' },
  page1: { path: 'pages/page1.html', script: './page1.js' }, // Blog List page
  page2: { path: 'pages/page2.html', script: './page2.js' }, // YouTube page
  page3: { path: 'pages/page3.html', script: './page3.js' },
  login: { path: 'pages/login.html', script: './login.js' }
};

function getPage() {
  // Handles both #page and #/page formats
  return location.hash.replace(/^#\/?/, '') || 'home';
}

async function loadPage(page) {
  // If not authenticated, always redirect to login page
  if (!isAuthed() && page !== 'login') {
    page = 'login';
    if (location.hash !== '#login') {
      location.hash = '#login';
      return;
    }
  }

  // Toggle navbar visibility based on auth state
  const authed = isAuthed();
  toggleNavbar(authed);
  if (authed && loginLink) {
    loginLink.style.display = 'none';
  }

  // 隐藏所有页面
  Object.values(pageCache).forEach(pageContainer => {
    if (pageContainer.style) {
      pageContainer.style.display = 'none';
    }
  });

  let pageContainer = pageCache[page];
  const route = routes[page] || routes.home;

  const needsReInit = 
    (page === 'home' && localStorage.getItem('blogForAI')) ||
    (page === 'page3' && localStorage.getItem('blogToEdit')) ||
    (page === 'page1' && localStorage.getItem('refreshBlogList'));

  if (pageContainer) {
    // Page is in cache
    pageContainer.style.display = '';
    if (needsReInit) {
      // Needs to re-run script (e.g., to fetch new data)
      if (route.script) {
        const mod = await import(route.script + `?v=${Date.now()}`);
        if (typeof mod.default === 'function') {
          mod.default(pageContainer);
        }
      }
    }
  } else {
    // Page is not in cache, load for the first time
    const res = await fetch(route.path);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    pageContainer = document.createElement('div');
    pageContainer.id = `page-${page}`;
    pageContainer.innerHTML = doc.body ? doc.body.innerHTML : html;
    app.appendChild(pageContainer);
    pageCache[page] = pageContainer;

    // Always run script on first load
    if (route.script) {
      const mod = await import(route.script + `?v=${Date.now()}`);
      if (typeof mod.default === 'function') {
        mod.default(pageContainer);
      }
    }
  }

  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });
}

window.addEventListener('hashchange', () => loadPage(getPage()));
// Initial load
loadPage(getPage());
