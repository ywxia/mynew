const app = document.getElementById('app');

const routes = {
  home: { path: 'pages/home.html', script: './main.js' },
  page1: { path: 'pages/page1.html', script: './page1.js' },
  page2: { path: 'pages/page2.html', script: './page2.js' },
  page3: { path: 'pages/page3.html', script: null },
  auth: { path: 'pages/auth.html', script: './auth.js' }
};

function getPage() {
  return location.hash.replace('#', '') || 'home';
}

async function loadPage(page) {
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
window.addEventListener('DOMContentLoaded', () => loadPage(getPage()));

