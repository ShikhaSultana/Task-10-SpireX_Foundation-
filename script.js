/* ============================================
   Country Information App
   Search a country → flag, capital, population,
   region, state, currency
   Data: REST Countries dataset (via jsDelivr CDN)
   Flags: flagcdn.com
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const input       = document.getElementById("searchInput");
  const searchBtn   = document.getElementById("searchBtn");
  const suggestions = document.getElementById("suggestions");
  const chipsBox    = document.getElementById("chips");
  const resultBox   = document.getElementById("result");
  const toastEl     = document.getElementById("toast");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon   = document.getElementById("themeIcon");

  const DATA_URL = "https://cdn.jsdelivr.net/gh/apilayer/restcountries@master/src/main/resources/countriesV2.json";
  const THEME_KEY = "country.theme.v1";

  const POPULAR = ["Japan", "India", "United States", "United Kingdom", "France", "Germany", "Australia", "Brazil", "Canada", "China"];

  let countries = [];       // full dataset
  let activeIndex = -1;     // keyboard nav for suggestions

  /* ---------- Toast ---------- */
  let toastTimer = null;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1900);
  };

  /* ---------- Helpers ---------- */
  const flagUrl = (code, size = "w320") =>
    code ? `https://flagcdn.com/${size}/${code.toLowerCase()}.png` : "";

  const fmtNumber = (n) => {
    if (n == null || isNaN(n)) return "—";
    return new Intl.NumberFormat(undefined).format(n);
  };

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* ---------- Render states ---------- */
  const showLoading = () => {
    resultBox.innerHTML = `<div class="state"><div class="spinner"></div>Loading country data…</div>`;
  };

  const showError = (title, msg) => {
    resultBox.innerHTML = `<div class="state"><span>🔍</span><strong>${esc(title)}</strong>${esc(msg)}</div>`;
  };

  const showWelcome = () => {
    resultBox.innerHTML = `<div class="state"><span>🌐</span><strong>Search for a country</strong>Type a name above or tap a quick pick to see its flag, capital, population, region, state, and currency.</div>`;
  };

  /* ---------- Build the country card ---------- */
  const renderCountry = (c) => {
    const name = c.name || "Unknown";
    const official = c.nativeName && c.nativeName !== name ? c.nativeName : "";
    const capital = Array.isArray(c.capital) ? c.capital.join(", ") : (c.capital || "—");
    const region = c.region || "—";
    const subregion = c.subregion || "";
    const population = c.population;
    const area = c.area;

    // Currencies
    const currencies = Array.isArray(c.currencies) ? c.currencies : [];
    const currencyText = currencies.length
      ? currencies.map((cur) => `${cur.name}${cur.symbol ? ` (${cur.symbol})` : ""}`).join(", ")
      : "—";
    const currencyCodes = currencies.map((cur) => cur.code).filter(Boolean).join(", ");

    // Languages
    const languages = Array.isArray(c.languages)
      ? c.languages.map((l) => l.name).join(", ")
      : "—";

    // Calling code
    const calling = c.callingCodes && c.callingCodes[0] ? "+" + c.callingCodes[0] : "—";

    // Timezones
    const tz = Array.isArray(c.timezones) && c.timezones.length
      ? c.timezones.slice(0, 3).join(", ") + (c.timezones.length > 3 ? " …" : "")
      : "—";

    // Borders
    const borders = Array.isArray(c.borders) && c.borders.length
      ? c.borders.join(", ")
      : "None (island / isolated)";

    // "State" — the dataset has no states, so we surface the closest
    // administrative/geographic subdivision: subregion + demonym.
    const stateText = subregion || region;
    const demonym = c.demonym || "—";

    const tags = [
      c.alpha2Code ? `<span class="tag">${esc(c.alpha2Code)}</span>` : "",
      c.alpha3Code ? `<span class="tag">${esc(c.alpha3Code)}</span>` : "",
      region !== "—" ? `<span class="tag">${esc(region)}</span>` : "",
      c.independent ? `<span class="tag">Independent</span>` : "",
      c.unMember ? `<span class="tag">UN Member</span>` : "",
    ].join("");

    resultBox.innerHTML = `
      <article class="card">
        <div class="card__top">
          <img class="card__flag" src="${flagUrl(c.alpha2Code)}" alt="Flag of ${esc(name)}" loading="lazy" />
          <div class="card__names">
            <h2 class="card__name">${esc(name)}</h2>
            ${official ? `<div class="card__official">Native name: ${esc(official)}</div>` : ""}
            <div class="card__tags">${tags}</div>
          </div>
        </div>

        <div class="grid">
          <div class="detail">
            <div class="detail__icon" aria-hidden="true">🏛️</div>
            <div class="detail__body">
              <div class="detail__label">Capital</div>
              <div class="detail__value">${esc(capital)}</div>
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">👥</div>
            <div class="detail__body">
              <div class="detail__label">Population</div>
              <div class="detail__value">${fmtNumber(population)}</div>
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">🗺️</div>
            <div class="detail__body">
              <div class="detail__label">Region</div>
              <div class="detail__value">${esc(region)}</div>
              ${subregion ? `<div class="detail__sub">${esc(subregion)}</div>` : ""}
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">📍</div>
            <div class="detail__body">
              <div class="detail__label">State / Subregion</div>
              <div class="detail__value">${esc(stateText)}</div>
              <div class="detail__sub">Demonym: ${esc(demonym)}</div>
            </div>
          </div>

          <div class="detail detail--wide">
            <div class="detail__icon" aria-hidden="true">💱</div>
            <div class="detail__body">
              <div class="detail__label">Currency</div>
              <div class="detail__value">${esc(currencyText)}</div>
              ${currencyCodes ? `<div class="detail__sub">Code: ${esc(currencyCodes)}</div>` : ""}
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">🗣️</div>
            <div class="detail__body">
              <div class="detail__label">Languages</div>
              <div class="detail__value">${esc(languages)}</div>
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">📐</div>
            <div class="detail__body">
              <div class="detail__label">Area</div>
              <div class="detail__value">${area ? fmtNumber(area) + " km²" : "—"}</div>
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">📞</div>
            <div class="detail__body">
              <div class="detail__label">Calling Code</div>
              <div class="detail__value">${esc(calling)}</div>
            </div>
          </div>

          <div class="detail">
            <div class="detail__icon" aria-hidden="true">🕒</div>
            <div class="detail__body">
              <div class="detail__label">Timezones</div>
              <div class="detail__value">${esc(tz)}</div>
            </div>
          </div>

          <div class="detail detail--wide">
            <div class="detail__icon" aria-hidden="true">🤝</div>
            <div class="detail__body">
              <div class="detail__label">Bordering Countries</div>
              <div class="detail__value">${esc(borders)}</div>
            </div>
          </div>
        </div>
      </article>
    `;
  };

  /* ---------- Find a country by name ---------- */
  const findCountry = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    // exact match first
    let match = countries.find((c) => c.name.toLowerCase() === q);
    if (match) return match;

    // alpha code match
    match = countries.find(
      (c) =>
        (c.alpha2Code && c.alpha2Code.toLowerCase() === q) ||
        (c.alpha3Code && c.alpha3Code.toLowerCase() === q)
    );
    if (match) return match;

    // starts-with
    match = countries.find((c) => c.name.toLowerCase().startsWith(q));
    if (match) return match;

    // includes
    match = countries.find((c) => c.name.toLowerCase().includes(q));
    return match || null;
  };

  /* ---------- Perform a search ---------- */
  const doSearch = (query) => {
    const q = (query != null ? query : input.value).trim();
    if (!q) {
      toast("Type a country name first ✍️");
      input.focus();
      return;
    }

    if (!countries.length) {
      showLoading();
      return;
    }

    const country = findCountry(q);
    if (country) {
      renderCountry(country);
      hideSuggestions();
      input.blur();
    } else {
      showError("No match found", `We couldn't find a country called "${q}". Try another name.`);
      toast("Country not found ❌");
    }
  };

  /* ---------- Suggestions ---------- */
  const hideSuggestions = () => {
    suggestions.classList.remove("show");
    suggestions.innerHTML = "";
    activeIndex = -1;
  };

  const showSuggestions = (list) => {
    if (!list.length) { hideSuggestions(); return; }

    suggestions.innerHTML = list
      .slice(0, 7)
      .map(
        (c, i) => `
        <li role="option" data-name="${esc(c.name)}" data-index="${i}">
          <img src="${flagUrl(c.alpha2Code, "w40")}" alt="" loading="lazy" />
          <span>${esc(c.name)}</span>
          <span class="sug-region">${esc(c.region || "")}</span>
        </li>`
      )
      .join("");

    suggestions.classList.add("show");
    activeIndex = -1;
  };

  const updateSuggestions = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { hideSuggestions(); return; }
    const list = countries
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      });
    showSuggestions(list);
  };

  /* ---------- Quick chips ---------- */
  const buildChips = () => {
    chipsBox.innerHTML = POPULAR.map(
      (name) => `<button class="chip" type="button" data-name="${esc(name)}">${esc(name)}</button>`
    ).join("");
  };

  /* ============================================
     THEME (Light / Dark)
     ============================================ */
  const SUN = `<circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />`;
  const MOON = `<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />`;

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-checked", String(isDark));
    themeIcon.innerHTML = isDark ? MOON : SUN;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  };

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    toast(next === "dark" ? "Dark theme 🌙" : "Light theme ☀️");
  });

  /* ============================================
     EVENTS
     ============================================ */
  searchBtn.addEventListener("click", () => doSearch());

  input.addEventListener("input", updateSuggestions);

  input.addEventListener("keydown", (e) => {
    const items = [...suggestions.querySelectorAll("li")];

    if (e.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        doSearch(items[activeIndex].dataset.name);
      } else {
        doSearch();
      }
      return;
    }

    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
      items[activeIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
      items[activeIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  suggestions.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-name]");
    if (li) doSearch(li.dataset.name);
  });

  chipsBox.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip[data-name]");
    if (chip) {
      input.value = chip.dataset.name;
      doSearch(chip.dataset.name);
    }
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search__wrap")) hideSuggestions();
  });

  /* ============================================
     INIT
     ============================================ */
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem(THEME_KEY) || "light"; } catch (_) {}
  applyTheme(savedTheme);

  buildChips();
  showLoading();

  (async () => {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      countries = Array.isArray(data) ? data : [];
      if (!countries.length) throw new Error("Empty dataset");

      showWelcome();
      // Auto-load a default country for a nice first impression
      const first = findCountry("Japan") || countries[0];
      if (first) renderCountry(first);
    } catch (err) {
      console.error(err);
      showError("Couldn't load data", "Please check your internet connection and refresh the page.");
    }
  })();
});
