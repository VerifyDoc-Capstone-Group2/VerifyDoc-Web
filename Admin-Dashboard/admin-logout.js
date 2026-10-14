(() => {
  "use strict";
  const signOut = (event) => {
    event.preventDefault();
    localStorage.removeItem("authorization");
    localStorage.removeItem("user");
    window.location.replace("../Authentication/Login/login.html");
  };
  const bind = () => {
    document.querySelectorAll('button[aria-label="Log out"]').forEach(button => {
      button.addEventListener("click", signOut);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
