const menuBtn = document.getElementById("menuBtn");
        const mobileMenu = document.getElementById("mobileMenu");

        menuBtn.addEventListener("click", function () {

            mobileMenu.classList.toggle("hidden");

        });
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


    const loginBtn = document.getElementById("loginBtn");
const getStartedBtn = document.getElementById("getStartedBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const mobileGetStartedBtn = document.getElementById("mobileGetStartedBtn");


loginBtn.addEventListener("click", function () {
    window.location.href = "VerifyRegister.html";
});

getStartedBtn.addEventListener("click", function () {
    window.location.href = "VerifyRegister.html";
});

mobileLoginBtn.addEventListener("click", function () {
    window.location.href = "VerifyRegister.html";
});

mobileGetStartedBtn.addEventListener("click", function () {
    window.location.href = "VerifyRegister.html";
});


const roleButtons = document.querySelectorAll(".btn-role");

roleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const role = button.dataset.role;

        window.location.href = `login.html?role=${role}`;
    });
});