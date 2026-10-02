const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
        mobileMenu.classList.toggle("hidden");
    });
}


const loginBtn = document.getElementById("loginBtn");
const getStartedBtn = document.getElementById("getStartedBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const mobileGetStartedBtn = document.getElementById("mobileGetStartedBtn");


if (loginBtn) {
    loginBtn.addEventListener("click", function () {
        window.location.href = "VerifyRegister.html";
    });
}

if (getStartedBtn) {
    getStartedBtn.addEventListener("click", function () {
        window.location.href = "VerifyRegister.html";
    });
}

if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener("click", function () {
        window.location.href = "VerifyRegister.html";
    });
}

if (mobileGetStartedBtn) {
    mobileGetStartedBtn.addEventListener("click", function () {
        window.location.href = "VerifyRegister.html";
    });
}


        const sections = document.querySelectorAll(".reveal");
       const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {

                if (entry.isIntersecting) {
                    entry.target.classList.add("animate-reveal");
                } else {
                    entry.target.classList.remove("animate-reveal");
                }

            });
        },
        {
            threshold: 0.2,
        }
    );

    sections.forEach((section) => {
        observer.observe(section);
    });





const roleButtons = document.querySelectorAll(".btn-role");

console.log("Number of role buttons:", roleButtons.length);

roleButtons.forEach(function (button) {
    button.addEventListener("click", function () {

        const role = button.dataset.role;

        console.log("Selected role:", role);

        window.location.href = `Login/login.html?role=${role}`;
    });
}); 

