(() => {
  /**
   * IMPORTANT :
   * - STORAGE_KEY doit correspondre à la clé utilisée par ton app (index.html) dans localStorage.
   * - APP_URL = route vers index.html (comme tu l’as demandé).
   */
  const STORAGE_KEY = "junia_bulletin_v5_full";
  const APP_URL = "bulletin.html";

  // Clé dédiée au choix de spécialité (utile pour adapter la structure plus tard)
  const SPEC_KEY = "junia_bulletin_specialite";

  const letters = Array.from(document.querySelectorAll(".letter"));

  // Screens
  const screenMain = document.getElementById("screenMain");
  const screenSpec = document.getElementById("screenSpec");

  // Accueil
  const actions = document.getElementById("actions");
  const btnNew = document.getElementById("btnNew");
  const btnOpen = document.getElementById("btnOpen");
  const fileJson = document.getElementById("fileJson");

  // Spécialité
  const btnBack = document.getElementById("btnBack");
  const btnSpecContinue = document.getElementById("btnSpecContinue");
  const choiceCards = Array.from(document.querySelectorAll(".choiceCard"));

  let selectedSpec = null;

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function showScreen(which) {
    const map = { main: screenMain, spec: screenSpec };
    Object.values(map).forEach(el => el.classList.remove("show"));
    map[which].classList.add("show");
  }

  async function flickerPhase() {
    const order = shuffle(letters);
    for (const el of order) {
      el.classList.add("flicker");
      el.classList.add("on");
      await sleep(70 + Math.random() * 120);
      el.classList.remove("flicker");
      if (Math.random() < 0.35) el.classList.remove("on");
    }
  }

  async function powerUpPhase() {
    const order = shuffle(letters);
    for (const el of order) {
      el.classList.add("on");
      await sleep(90 + Math.random() * 90);
    }
    await sleep(220);
  }

  function showActions() {
    actions.classList.add("show");
  }

  // --- Nouveau bulletin -> choix spécialité ---
  btnNew.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);

    selectedSpec = null;
    btnSpecContinue.disabled = true;
    choiceCards.forEach(c => c.classList.remove("selected"));

    showScreen("spec");
  });

  // --- Import JSON -> ouvre l'app ---
  btnOpen.addEventListener("click", () => fileJson.click());

  fileJson.addEventListener("change", async () => {
    const file = fileJson.files && fileJson.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = (parsed && parsed.state) ? parsed.state : parsed;

      const spec =
        parsed?.meta?.specialization ||
        incoming?.structure?.specialization ||
        null;

        if (spec) localStorage.setItem("junia_bulletin_specialite", spec);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming, null, 2));
      window.location.href = APP_URL;
    } catch (e) {
      alert("Fichier JSON invalide ou illisible.");
      console.error(e);
    } finally {
      fileJson.value = "";
    }
  });

  // --- Sélection spécialité ---
  choiceCards.forEach(card => {
    card.addEventListener("click", () => {
      choiceCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      selectedSpec = card.getAttribute("data-spec");
      btnSpecContinue.disabled = false;

      localStorage.setItem(SPEC_KEY, selectedSpec);
    });
  });

  // --- Retour ---
  btnBack.addEventListener("click", () => showScreen("main"));

  // --- Continuer -> bulletin.html ---
  btnSpecContinue.addEventListener("click", () => {
    if (!selectedSpec) return;
    window.location.href = APP_URL;
  });

  // --- Boot animation ---
  (async function boot() {
    letters.forEach((l) => l.classList.remove("on", "flicker"));

    await sleep(200);
    await flickerPhase();
    await sleep(140);
    await powerUpPhase();

    showActions();
    showScreen("main");
  })();
})();