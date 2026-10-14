 tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ["Inter", "system-ui", "sans-serif"],
            inter: ["Inter", "system-ui", "sans-serif"],
          },
          /* Sizes match the design at 1600px wide and shrink smoothly on smaller screens */
          fontSize: {
            admin:    ["clamp(18px, 1.625vw, 26px)", "1.2"],
            greeting: ["clamp(26px, 2.75vw, 44px)", "1.15"],
            sub:      ["clamp(15px, 1.5vw, 24px)", "1.35"],
            statnum:  ["clamp(32px, 2.75vw, 44px)", "1.1"],
            statlbl:  ["clamp(16px, 1.5vw, 24px)", "1.25"],
            heading:  ["clamp(24px, 2.375vw, 38px)", "1.2"],
            th:       ["clamp(16px, 1.375vw, 22px)", "1.3"],
            td:       ["clamp(15px, 1.19vw, 19px)", "1.4"],
            qtitle:   ["clamp(20px, 2.125vw, 34px)", "1.2"],
            qdesc:    ["clamp(15px, 1.375vw, 22px)", "1.35"],
          },

           colors: {
                primary: "#2563EB",
                dark: "#0F172A",
                muted: "#64748B",
                cream: "hsl(48, 96%, 89%)",
            },

        },
      },
    };