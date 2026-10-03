lucide.createIcons();

  const menuBtn = document.getElementById("menuBtn");
  const closeBtn = document.getElementById("closeBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  function openMenu() {
    mobileMenu.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }
  function closeMenu() {
    mobileMenu.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  menuBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => { if (window.innerWidth >= 1024) closeMenu(); });