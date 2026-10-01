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