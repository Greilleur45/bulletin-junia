// js/storage.js
(function () {
    const STORAGE_KEY = "junia_bulletin_v5_full";
  
    function safeParse(raw, fallback) {
      try { return JSON.parse(raw); } catch { return fallback; }
    }
  
    function deepClone(obj) {
      return structuredClone
        ? structuredClone(obj)
        : JSON.parse(JSON.stringify(obj));
    }

  
    function normalizeState(s) {
      const st = s && typeof s === "object" ? s : {};
      return {
        version: 5,
        structure: st.structure && st.structure.ues ? st.structure : deepClone(window.DEFAULT_STRUCTURE),
        grades: st.grades ?? {},
        sim: st.sim ?? {},
        coeffOverrides: st.coeffOverrides ?? {},
        selectedUE: st.selectedUE ?? (window.DEFAULT_STRUCTURE.ues?.[0]?.id ?? null),
      };
    }
  
    function loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return normalizeState(deepClone(window.DEFAULT_STRUCTURE));
      }

      try {
        const parsed = JSON.parse(raw);
        return normalizeState(parsed);
      } catch (e) {
        console.warn("State localStorage invalide, reset sur DEFAULT_STRUCTURE.", e);
        localStorage.removeItem(STORAGE_KEY);
        return normalizeState(deepClone(window.DEFAULT_STRUCTURE));
      }
    }

    function saveState(state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
    }

    function applySpecialization(specValue) {
      if (!specValue) return;

      // 1) Stockage (source de vérité)
      localStorage.setItem("junia_bulletin_specialite", specValue);

      // 2) Dataset pour l'affichage immédiat
      const s = String(specValue).toLowerCase();
      const isAero = s.includes("aéro") || s.includes("aero");
      document.documentElement.dataset.spec = isAero ? "aero" : "meca";

      // 3) Switch des thèmes si présents (id=themeMeca/themeAero)
      const themeMeca = document.getElementById("themeMeca");
      const themeAero = document.getElementById("themeAero");
      if (themeMeca && themeAero) {
        themeMeca.disabled = isAero;
        themeAero.disabled = !isAero;
      }
    }

  
    function exportFullJSON(state) {
      const now = new Date();
      const dateString = now.toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, "-");
      const spec =
        state?.structure?.specialization ||
        localStorage.getItem("junia_bulletin_specialite") ||
        "Mécatronique-Robotique";

      const payload = {
        meta: {
          app: "junia-bulletin",
          version: 5,
          exportedAt: now.toISOString(),
          specialization: spec,
        },
        state,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bulletin_note_${dateString}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  
    async function importFullJSON(file) {
      const text = await file.text();
      const parsed = safeParse(text, null);
      if (!parsed) throw new Error("JSON invalide.");

      // 1) Spécialité (priorité: meta, sinon structure)
      const spec =
        parsed?.meta?.specialization ||
        parsed?.state?.structure?.specialization ||
        parsed?.structure?.specialization ||
        null;

      applySpecialization(spec);

      // 2) État
      const incoming = parsed.state ?? parsed;
      return normalizeState(incoming);
    }

  
    window.StorageAPI = { loadState, saveState, exportFullJSON, importFullJSON };
  })();  