(() => {
  "use strict";
  function signOut(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    localStorage.removeItem("authorization");
    localStorage.removeItem("user");
    window.location.replace("../Authentication/Login/login.html");
  }
  function bind() {
    document.querySelectorAll('button[aria-label="Log out"], button#logout').forEach(button => {
      button.addEventListener("click", signOut, { capture: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
