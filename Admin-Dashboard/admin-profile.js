(() => {
  "use strict";
  const fallback = "../images/user.avif";
  const token = localStorage.getItem("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const update = (user) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "Admin";
    const photo = user.profilePicture?.url && /^https:\/\//i.test(user.profilePicture.url) ? user.profilePicture.url : fallback;
    document.querySelectorAll("aside, #mobileMenu").forEach(panel => {
      panel.querySelectorAll("span").forEach(span => {
        if (span.textContent.trim() === "Admin" && span.children.length === 0) span.textContent = fullName;
      });
      const avatar = panel.querySelector("span.rounded-full");
      if (avatar && avatar.textContent.trim().length <= 2) {
        const img = document.createElement("img");
        img.src = photo;
        img.alt = fullName + " profile";
        img.className = "h-10 w-10 rounded-full object-cover";
        img.onerror = () => { img.onerror = null; img.src = fallback; };
        avatar.replaceWith(img);
      }
    });
    document.querySelectorAll('img[alt="Admin profile"], #NavprofilePicture, #profilePicture').forEach(img => {
      img.src = photo;
      img.alt = fullName + " profile";
      img.onerror = () => { img.onerror = null; img.src = fallback; };
    });
    const name = document.getElementById("NavAdminName");
    if (name) name.textContent = fullName;
  };
  const run = async () => {
    if (!token) return;
    try {
      const response = await fetch("https://verifydoc-api-v1.onrender.com/auth/me", {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" }
      });
      if (!response.ok) return;
      const body = await response.json();
      const user = body.data;
      if (user?.role === "Admin" && user.accountStatus === "Active") update(user);
    } catch (error) {
      console.warn("Unable to load admin profile", error);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
