document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Mobile sidebar drawer toggle functionality
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuBtn && sidebar && sidebarOverlay) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebarOverlay.classList.toggle('hidden');
    };

    mobileMenuBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
  }
});