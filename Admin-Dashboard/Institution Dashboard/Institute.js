lucide.createIcons();
const mobileMenu = document.getElementById("mobileMenu");
const openBtn = document.getElementById("openBtn");
const closeBtn = document.getElementById("closeBtn");

openBtn.addEventListener("click", () =>{
   mobileMenu.classList.remove("hidden");
})

closeBtn.addEventListener("click", () =>{
    mobileMenu.classList.add("hidden")
})