// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons globally
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. Mobile Sidebar & Drawer Controls
  const menuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      if (overlay) overlay.classList.toggle('hidden');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    });
  }

  // 3. Highlight Active Link in Navigation Sidebar
  const currentPath = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('aside nav a');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'dashboard.html')) {
      link.classList.add('bg-blue-600', 'text-white');
      link.classList.remove('hover:bg-slate-800', 'hover:text-white');
    }
  });
});