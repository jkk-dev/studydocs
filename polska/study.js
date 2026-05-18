(() => {
    const content = document.getElementById("content");
    const chapterTabs = document.getElementById("chapterTabs");
    const languageToggle = document.querySelector(".language-toggle");
    const languageKey = "sd-lang";
    const legacyLanguageKey = "studydocs-language";
    const { initial = [], subject = "" } = window.studyConfig || {};
    let selectedLanguage = "pl";
    let currentSection = null;
    let lessonObserver = null;
    let sectionRequestId = 0;

    const pageCopy = {
        polish: {
            messages: {
                pl: {
                    subjectTitle: "Polski",
                    back: "Wróć",
                    menuLabel: "Działy z języka polskiego",
                    tabsLabel: "Zakładki rozdziałów",
                    loading: "Ładowanie materiałów...",
                    error: "Błąd ładowania danych lub plik nie istnieje.",
                    introPrefix: "Materiały z działu",
                    intro: "krótkie zasady i przykłady.",
                    label: "Switch to English"
                },
                en: {
                    subjectTitle: "Polish",
                    back: "Back",
                    menuLabel: "Polish language sections",
                    tabsLabel: "Chapter tabs",
                    loading: "Loading materials...",
                    error: "Could not load the data, or the file does not exist.",
                    introPrefix: "Materials for",
                    intro: "quick rules and examples.",
                    label: "Przełącz na polski"
                }
            },
            sections: {
                "Lektury": { pl: "Lektury", en: "Literature" },
                "Gramatyka": { pl: "Gramatyka", en: "Grammar" },
                "Pisanie": { pl: "Pisanie", en: "Writing" },
                "Ortografia": { pl: "Ortografia", en: "Spelling" },
                "Interpunkcja": { pl: "Interpunkcja", en: "Punctuation" },
                "Środki stylistyczne": { pl: "Środki stylistyczne", en: "Stylistic devices" },
                "Rozprawka": { pl: "Rozprawka", en: "Essay" },
                "Charakterystyka": { pl: "Charakterystyka", en: "Character description" },
                "Opowiadanie": { pl: "Opowiadanie", en: "Story" },
                "Poezja": { pl: "Poezja", en: "Poetry" },
                "Epoki literackie": { pl: "Epoki literackie", en: "Literary periods" },
                "Analiza tekstu": { pl: "Analiza tekstu", en: "Text analysis" }
            }
        },
        english: {
            messages: {
                pl: {
                    subjectTitle: "Angielski",
                    back: "Wróć",
                    menuLabel: "Działy z języka angielskiego",
                    tabsLabel: "Zakładki rozdziałów",
                    loading: "Ładowanie materiałów...",
                    error: "Błąd ładowania danych lub plik nie istnieje.",
                    introPrefix: "Materiały z działu",
                    intro: "najważniejsze struktury i przykłady.",
                    label: "Switch to English"
                },
                en: {
                    subjectTitle: "English",
                    back: "Back",
                    menuLabel: "English sections",
                    tabsLabel: "Chapter tabs",
                    loading: "Loading materials...",
                    error: "Could not load the data, or the file does not exist.",
                    introPrefix: "Materials for",
                    intro: "key structures and examples.",
                    label: "Przełącz na polski"
                }
            },
            sections: {
                "Gramatyka": { pl: "Gramatyka", en: "Grammar" },
                "Słownictwo": { pl: "Słownictwo", en: "Vocabulary" },
                "Czytanie": { pl: "Czytanie", en: "Reading" },
                "Pisanie": { pl: "Pisanie", en: "Writing" },
                "Mówienie": { pl: "Mówienie", en: "Speaking" },
                "Słuchanie": { pl: "Słuchanie", en: "Listening" },
                "Idiomy": { pl: "Idiomy", en: "Idioms" }
            }
        },
        math: {
            messages: {
                pl: {
                    subjectTitle: "Matematyka",
                    back: "Wróć",
                    menuLabel: "Działy z matematyki",
                    tabsLabel: "Zakładki rozdziałów",
                    loading: "Ładowanie materiałów...",
                    error: "Błąd ładowania danych lub plik nie istnieje.",
                    introPrefix: "Materiały z działu",
                    intro: "najważniejsze wzory i przykłady.",
                    label: "Switch to English"
                },
                en: {
                    subjectTitle: "Mathematics",
                    back: "Back",
                    menuLabel: "Mathematics sections",
                    tabsLabel: "Chapter tabs",
                    loading: "Loading materials...",
                    error: "Could not load the data, or the file does not exist.",
                    introPrefix: "Materials for",
                    intro: "key formulas and examples.",
                    label: "Przełącz na polski"
                }
            },
            sections: {
                "Podstawy i zasady": { pl: "Podstawy", en: "Basics" },
                "Algebra": { pl: "Algebra", en: "Algebra" },
                "Geometria": { pl: "Geometria", en: "Geometry" },
                "Ułamki": { pl: "Ułamki", en: "Fractions" },
                "Funkcje": { pl: "Funkcje", en: "Functions" },
                "Równania": { pl: "Równania", en: "Equations" },
                "Prawdopodobieństwo": { pl: "Prawdopodobieństwo", en: "Probability" }
            }
        }
    };

    function detectSubject() {
        if (subject && pageCopy[subject]) return subject;
        if (document.body.classList.contains("subject-polish-page")) return "polish";
        if (document.body.classList.contains("subject-english-page")) return "english";
        if (document.body.classList.contains("subject-math-page")) return "math";
        return "polish";
    }

    const copy = pageCopy[detectSubject()];

    function message(key) {
        return copy.messages[selectedLanguage][key] || copy.messages.pl[key] || "";
    }

    function sectionTitle(title) {
        return copy.sections[title]?.[selectedLanguage] || title;
    }

    function splitTitle(title) {
        const match = String(title).match(/^(\d+)\.\s*(.+)$/);
        return {
            number: match ? match[1] : "",
            text: match ? match[2] : String(title)
        };
    }

    function cleanTitle(title) {
        return splitTitle(title).text
            .replace(/\s*\([^)]*\)/g, "")
            .replace(/\s+[–-]\s+.*$/g, "")
            .replace(/\s+i\s+ich\s+(rodzaje|własności)$/i, "")
            .replace(/^Twierdzenie\s+Pitagorasa$/i, "Pitagoras")
            .replace(/^Twierdzenie\s+Talesa$/i, "Tales")
            .replace(/^Czas\s+/i, "")
            .replace(/^Funkcja\s+/i, "")
            .replace(/^Twierdzenie\s+/i, "")
            .replace(/^Najczęstsze\s+/i, "")
            .trim();
    }

    function compactWords(text, maxLength) {
        const skipped = new Set(["i", "oraz", "z", "ze", "w", "we", "na", "do", "a"]);
        const words = text.split(/\s+/).filter(Boolean);
        const picked = [];

        for (const word of words) {
            const simple = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
            if (picked.length && skipped.has(simple)) continue;

            const next = [...picked, word].join(" ");
            if (next.length > maxLength && picked.length) break;
            picked.push(word);
            if (picked.join(" ").length >= maxLength) break;
        }

        return picked.join(" ") || text;
    }

    function clampTitle(text, maxLength) {
        if (text.length <= maxLength) return text;
        const words = text.split(/\s+/);
        const picked = [];

        for (const word of words) {
            const next = [...picked, word].join(" ");
            if (next.length > maxLength && picked.length) break;
            picked.push(word);
        }

        return picked.join(" ") || text;
    }

    function compactTabTitle(title) {
        const { number } = splitTitle(title);
        const cleaned = cleanTitle(title);
        const text = cleaned.length <= 18 ? cleaned : compactWords(cleaned, 18);
        return number ? `${number}. ${text}` : text;
    }

    function compactLessonTitle(title) {
        return clampTitle(cleanTitle(title), 44);
    }

    function escapeAttribute(value) {
        return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    }

    function getButtonSectionTitle(button) {
        const match = button.getAttribute("onclick")?.match(/loadSection\('([^']+)'/);
        return match ? match[1] : "";
    }

    function getSavedLanguage() {
        return localStorage.getItem(languageKey) || localStorage.getItem(legacyLanguageKey) || "pl";
    }

    function saveLanguage(language) {
        localStorage.setItem(languageKey, language);
        localStorage.setItem(legacyLanguageKey, language);
    }

    function translateStaticPageText() {
        document.title = `${message("subjectTitle")} - StudyDocs`;
        document.querySelector(".back-link").textContent = message("back");
        document.querySelector(".subject-title").textContent = message("subjectTitle");
        document.querySelector(".menu").setAttribute("aria-label", message("menuLabel"));
        chapterTabs.setAttribute("aria-label", message("tabsLabel"));
        languageToggle.setAttribute("aria-label", message("label"));

        document.querySelectorAll(".menu button").forEach((button) => {
            const title = getButtonSectionTitle(button);
            if (title) button.textContent = sectionTitle(title);
        });
    }

    function applyLanguage(language, { reload = true } = {}) {
        selectedLanguage = language === "en" ? "en" : "pl";
        document.documentElement.lang = selectedLanguage;
        translateStaticPageText();
        saveLanguage(selectedLanguage);
        if (reload && currentSection) {
            window.loadSection(currentSection.title, currentSection.jsonFile, currentSection.button);
        }
    }

    function setActiveButton(button) {
        document.querySelectorAll(".menu button").forEach((item) => {
            item.classList.remove("active");
            item.removeAttribute("aria-current");
        });
        if (button) {
            button.classList.add("active");
            button.setAttribute("aria-current", "page");
        }
    }

    function disconnectLessonObserver() {
        if (lessonObserver) {
            lessonObserver.disconnect();
            lessonObserver = null;
        }
    }

    function setActiveTab(index, scrollTab = false) {
        chapterTabs.querySelectorAll(".chapter-tab").forEach((item) => {
            const isActive = Number(item.dataset.index) === index;
            item.classList.toggle("active", isActive);
            if (isActive) {
                item.setAttribute("aria-current", "true");
                if (scrollTab) item.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            } else {
                item.removeAttribute("aria-current");
            }
        });
    }

    function renderTabs(course) {
        chapterTabs.innerHTML = course.map((section, index) => `<button class="chapter-tab${index === 0 ? " active" : ""}" type="button" data-index="${index}" title="${escapeAttribute(section.title)}"${index === 0 ? ' aria-current="true"' : ""}>${compactTabTitle(section.title)}</button>`).join("");
    }

    function observeLessons() {
        disconnectLessonObserver();
        const lessons = content.querySelectorAll(".lesson");
        if (!("IntersectionObserver" in window) || lessons.length === 0) {
            setActiveTab(0);
            return;
        }

        lessonObserver = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio || Number(a.target.dataset.index) - Number(b.target.dataset.index));
            if (visible.length) setActiveTab(Number(visible[0].target.dataset.index), true);
        }, {
            rootMargin: "-20% 0px -55% 0px",
            threshold: [0.1, 0.25, 0.5, 0.75]
        });

        lessons.forEach((lesson) => lessonObserver.observe(lesson));
    }

    chapterTabs.addEventListener("click", (event) => {
        const tab = event.target.closest(".chapter-tab");
        if (!tab) return;
        const index = Number(tab.dataset.index);
        setActiveTab(index);
        const lesson = document.getElementById(`lesson-${index}`);
        if (lesson) lesson.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    languageToggle.addEventListener("click", () => applyLanguage(selectedLanguage === "pl" ? "en" : "pl"));
    applyLanguage(getSavedLanguage(), { reload: false });

    window.loadSection = async (title, jsonFile, button) => {
        const requestId = ++sectionRequestId;
        currentSection = { title, jsonFile, button };
        const displayTitle = sectionTitle(title);

        setActiveButton(button);
        disconnectLessonObserver();
        chapterTabs.innerHTML = "";
        content.innerHTML = `<h2>${displayTitle}</h2><p class="loading">${message("loading")}</p>`;

        try {
            const response = await fetch(jsonFile);
            if (!response.ok) throw new Error("Nie udało się załadować danych");
            const course = await response.json();
            if (requestId !== sectionRequestId) return;
            renderTabs(course);
            const lessons = course.map((section, index) => `<article class="lesson" id="lesson-${index}" data-index="${index}"><span class="tag">${section.tag}</span><h3 title="${escapeAttribute(section.title)}">${compactLessonTitle(section.title)}</h3><p>${section.text}</p><ul>${section.points.map((point) => `<li>${point}</li>`).join("")}</ul><div class="example">${section.example}</div></article>`).join("");
            content.innerHTML = `<h2>${displayTitle}</h2><p class="intro">${message("introPrefix")} <b>${displayTitle}</b>: ${message("intro")}</p><div class="lesson-flow">${lessons}</div>`;
            observeLessons();
        } catch (error) {
            if (requestId !== sectionRequestId) return;
            disconnectLessonObserver();
            chapterTabs.innerHTML = "";
            content.innerHTML = `<h2>${displayTitle}</h2><p class="error">${message("error")}</p>`;
        }
    };

    if (initial.length) {
        window.loadSection(initial[0], initial[1], document.querySelector(".menu button.active"));
    }
})();
