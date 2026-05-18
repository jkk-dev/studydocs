(() => {
    const messages = window.sdMessages || {};
    const toggle = document.querySelector(".language-toggle");
    const key = "sd-lang";

    function applyLanguage(language) {
        const selected = messages[language] ? language : "pl";
        document.documentElement.lang = selected;
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const text = messages[selected][element.dataset.i18n];
            if (text !== undefined) element.textContent = text;
        });
        if (toggle) toggle.setAttribute("aria-label", messages[selected].label);
        localStorage.setItem(key, selected);
        localStorage.setItem("studydocs-language", selected);
    }

    applyLanguage(localStorage.getItem(key) || localStorage.getItem("studydocs-language") || "pl");
    if (toggle) toggle.addEventListener("click", () => applyLanguage(document.documentElement.lang === "pl" ? "en" : "pl"));
})();
