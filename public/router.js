const app = document.getElementById('app');
const navbar = document.querySelector('.navbar');
const loginLink = document.querySelector('.nav-login');

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
  page1: { path: 'pages/page1.html', script: './page1.js' },
  page2: { path: 'pages/page2.html', script: './page2.js' },
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

  const route = routes[page] || routes.home;
  const res = await fetch(route.path);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  app.innerHTML = doc.body ? doc.body.innerHTML : html;
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });
  if (route.script) {
    const mod = await import(route.script + `?v=${Date.now()}`);
    if (typeof mod.default === 'function') {
      mod.default();
    }
  }
}

window.addEventListener('hashchange', () => loadPage(getPage()));
// Initial load
loadPage(getPage());
