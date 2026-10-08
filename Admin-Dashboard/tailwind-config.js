  tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                inter: ["Inter", "sans-serif"],
            },

            colors: {
                primary: "#2563EB",
                dark: "#0F172A",
                muted: "#64748B",
                cream: "hsl(48, 96%, 89%)",
            },

            boxShadow: {
                soft: "0 10px 40px rgba(15, 23, 42, 0.08)",
            },

            animation: {
                float: "float 6s ease-in-out infinite",
                blob: "blob 12s ease-in-out infinite",
                marquee: "marquee 22s linear infinite",
                pulseSoft: "pulseSoft 3s ease-in-out infinite",
                rotate: "rotate 2s ease-in-out",
                slide: "slide 10s ease-in-out infinite",
                reveal: "reveal 0.8s ease-out forwards",
            },

            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-12px)" },
                },
                blob: {
                    "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                    "33%": { transform: "translate(25px, -30px) scale(1.08)" },
                    "66%": { transform: "translate(-20px, 20px) scale(.94)" },
                },
                marquee: {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(-50%)" },
                },
                pulseSoft: {
                    "0%, 100%": { opacity: ".45" },
                    "50%": { opacity: "1" },
                },
                rotate: {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                },
                slide: {
                    "0%, 100%": { transform: "translateX(0)" },
                    "50%": { transform: "translateX(500px)" },
                },
                reveal: {
                    "0%": { opacity: "0", transform: "translateY(40px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
};