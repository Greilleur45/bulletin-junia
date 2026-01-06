// js/ui.js
(function () {
    const $ = (sel) => document.querySelector(sel);
  
    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  
    function renderUEList(state, query, onSelectUE) {
      const host = document.getElementById("ueList");
      if (!host) return;
      host.innerHTML = "";
    
      const ues = state.structure.ues || [];
    
      // 1) On calcule q AVANT de l’utiliser
      const q = (query || "").trim().toLowerCase();
      const hasQuery = q.length > 0;
    
      // 2) Fonction match (utilise q de l’extérieur)
      const ueMatches = (ue) => {
        if (!hasQuery) return false;
    
        if ((ue.name || "").toLowerCase().includes(q)) return true;
    
        for (const m of (ue.modules || [])) {
          if ((m.name || "").toLowerCase().includes(q)) return true;
          if ((m.teacher || "").toLowerCase().includes(q)) return true;
    
          for (const a of (m.assessments || [])) {
            if ((a.name || "").toLowerCase().includes(q)) return true;
          }
        }
        return false;
      };
    
      // 3) Split spé / tronc commun
      let spec = ues.filter(u => u.type !== "TRONC");
      let tc   = ues.filter(u => u.type === "TRONC");
    
      // 4) Si recherche active -> filtrer
      if (hasQuery) {
        spec = spec.filter(ueMatches);
        tc   = tc.filter(ueMatches);
    
        // 0 résultat
        if (spec.length === 0 && tc.length === 0) {
          const empty = document.createElement("div");
          empty.className = "muted";
          empty.style.padding = "10px 6px";
          empty.textContent = "Aucune UE trouvée.";
          host.appendChild(empty);
          return;
        }
      }
    
      // 5) progress notes réelles
      const countAssessments = (ue) => {
        let total = 0;
        let filledReal = 0;
        for (const m of (ue.modules || [])) {
          for (const a of (m.assessments || [])) {
            total += 1;
            if (typeof state.grades?.[a.id] === "number") filledReal += 1;
          }
        }
        return { total, filledReal };
      };
    
      const makeGroup = (title, dotClass, list) => {
        if (!list || list.length === 0) return;
    
        const h = document.createElement("div");
        h.className = "ue-group-title";
        h.innerHTML = `<span class="dot ${dotClass}"></span><span>${escapeHtml(title)}</span>`;
        host.appendChild(h);
    
        for (const ue of list) {
          const real = window.CalcAPI.computeUEAverage(state, ue, false);
          const realText = (typeof real.avg === "number") ? window.CalcAPI.round2(real.avg).toFixed(2) : "—";
    
          const scen = window.CalcAPI.computeUEAverage(state, ue, true);
          const scenText = (typeof scen.avg === "number") ? window.CalcAPI.round2(scen.avg).toFixed(2) : "—";
    
          const { total, filledReal } = countAssessments(ue);
          const pct = total > 0 ? Math.round((filledReal / total) * 100) : 0;
    
          // si recherche active, toutes les UE affichées sont des match
          const match = hasQuery ? true : false;
    
          const item = document.createElement("div");
          item.className =
            "ue-item" +
            (state.selectedUE === ue.id ? " active" : "") +
            (match ? " match" : "");
    
          item.innerHTML = `
            <div class="ue-item__left">
              <div class="ue-item__name">${escapeHtml(ue.name)}</div>
    
              <div class="muted ue-item__meta">
                ${(ue.modules || []).length} module(s)
              </div>
    
              <div class="ue-item__tiny muted">
                Simulation : <span class="ue-item__tinyval">${scenText}</span> / 20
              </div>
    
              <div class="ue-progress">
                <div class="ue-progress__bar">
                  <div class="ue-progress__fill" style="width:${pct}%"></div>
                </div>
                <div class="ue-progress__txt">${filledReal}/${total}</div>
              </div>
            </div>
    
            <div class="ue-item__right">
              <div class="ue-item__avg">${realText}</div>
            </div>
          `;
    
          item.addEventListener("click", () => onSelectUE(ue.id));
          host.appendChild(item);
        }
      };
    
      const specTitle =
        (state.structure.specialization || "").toLowerCase().includes("aéro")
          ? "Spécialité Aéronautique"
          : "Spécialité";
    
      makeGroup(specTitle, "mec", spec);
      makeGroup("Tronc commun", "tc", tc);
    }
         
  
    window.UIAPI = {
      $,
      escapeHtml,
      renderUEList,
    };
  })();  

// ===============================
// Render Modules (UE sélectionnée)
// + Mode recherche avec CRUD
// + MIN/OK/SIM (min basé sur reqAvg UE)
// ===============================
function renderModules(state, { saveState, renderAll }, query = "") {
  const SCALE = 20;
  const MIN_GRADE = 0.5;
  const PASS_MARK = (window.CalcAPI?.PASS_MARK ?? 10);

  const host = document.getElementById("modules");
  if (!host) return;
  host.innerHTML = "";

  const escapeHtml = window.UIAPI.escapeHtml;
  const round2 = window.CalcAPI.round2;

  const q = (query || "").trim().toLowerCase();
  const hasQuery = q.length > 0;

  function clamp(x, min, max) { return Math.min(max, Math.max(min, x)); }

  function gradeToNumber(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function coeffOf(a) {
    const ov = state.coeffOverrides?.[a.id];
    if (typeof ov === "number" && Number.isFinite(ov) && ov > 0) return ov;
    return a.coeff;
  }

  function moduleAvg(mod, useScenario) {
    let doneW = 0, sum = 0;
    for (const a of (mod.assessments || [])) {
      const w = coeffOf(a);
      const real = state.grades?.[a.id];
      const sim  = state.sim?.[a.id];
      const g = (typeof real === "number")
        ? real
        : (useScenario && typeof sim === "number" ? sim : null);

      if (typeof g === "number") {
        doneW += w;
        sum += g * w;
      }
    }
    return doneW > 0 ? sum / doneW : null;
  }

  function hitsAssessment(a) {
    return ((a.name || "").toLowerCase().includes(q));
  }

  function hitsModule(ue, mod) {
    const ueName = (ue.name || "").toLowerCase();
    const mName  = (mod.name || "").toLowerCase();
    const tName  = (mod.teacher || "").toLowerCase();
    return ueName.includes(q) || mName.includes(q) || tName.includes(q);
  }

  // ------------------------------
  // MIN/OK/SIM (basé sur reqAvg UE)
  // ------------------------------
  const ueReqCache = new Map();

  function getUEReq(ue) {
    if (ueReqCache.has(ue.id)) return ueReqCache.get(ue.id);

    // requiredAverageForUE(state, ue, passMark, useScenarioDone)
    const res = window.CalcAPI.requiredAverageForUE(state, ue, PASS_MARK, true);

    let reqAvgNorm = null;
    if (
      res &&
      res.possible &&
      typeof res.remainingW === "number" &&
      res.remainingW > 0 &&
      typeof res.reqAvg === "number" &&
      Number.isFinite(res.reqAvg)
    ) {
      reqAvgNorm = res.reqAvg;
    }

    const out = { ...(res || {}), reqAvgNorm };
    ueReqCache.set(ue.id, out);
    return out;
  }

  function buildMinBadgeHTML(ue, a) {
    const real = state.grades?.[a.id];
    const sim  = state.sim?.[a.id];

    // Réel prioritaire
    if (typeof real === "number") return `<span class="ok-text">OK</span>`;
    if (typeof sim === "number") return `<span class="warn-text">Sim</span>`;

    const req = getUEReq(ue);

    if (!req || req.possible === false) return `<span class="muted">Min: —</span>`;
    if (typeof req.remainingW !== "number" || req.remainingW <= 0) return `<span class="muted">Min: —</span>`;
    if (typeof req.reqAvgNorm !== "number") return `<span class="muted">Min: —</span>`;

    let m = req.reqAvgNorm;

    // UX : pas de négatif, minimum éliminatoire à 0.5
    if (m <= MIN_GRADE) m = MIN_GRADE;

    // Au-dessus du barème -> impossible
    if (m > SCALE) return `<span class="bad-text">Min: Impossible</span>`;

    const cls =
      m > 16 ? "bad-text" :
      m > 12 ? "warn-text" :
      m > PASS_MARK ? "warn-text" :
      "ok-text";

    return `<span class="${cls}">Min: ${round2(m).toFixed(2)}/20</span>`;
  }

  // -----------------------------------
  // Render d'une épreuve (utilisée partout)
  // -----------------------------------
  function renderAssessmentRow({ ue, mod, a, showMatchTag }) {
    const realNote = state.grades?.[a.id];
    const simNote  = state.sim?.[a.id];

    const isHit = hasQuery && hitsAssessment(a);
    const minHtml = buildMinBadgeHTML(ue, a);

    const row = document.createElement("div");
    row.className = "assessment" + (isHit ? " hit" : "");

    row.innerHTML = `
      <div class="assessment__left">
        <div class="assessment__title">
          ${escapeHtml(a.name)}
          ${showMatchTag && isHit ? `<span class="badge match" style="margin-left:8px;">Match</span>` : ""}
          <span class="ass-tools">
            <button class="btn btn--ghost btn--mini aEdit" title="Renommer / coeff"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn--ghost btn--mini aDel" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
          </span>
        </div>

        <div class="assessment__meta" style="display:flex;gap:10px;align-items:center;justify-content:space-between;">
          <span class="coeff-edit">
            Coeff
            <input class="coeffInput"
              data-assessment-id="${a.id}"
              inputmode="decimal"
              value="${String(round2(coeffOf(a))).replace(".", ",")}"
            />
          </span>
          ${minHtml}
        </div>

        <div class="assessment__meta" style="margin-top:6px;">
          <span class="muted">Simulation</span>
          <input class="simInput"
            data-assessment-id="${a.id}"
            inputmode="decimal"
            placeholder="(rouge)"
            value="${typeof simNote === "number" ? String(round2(simNote)).replace(".", ",") : ""}"
            style="border-color: rgba(255,80,80,0.45);"
          />
        </div>
      </div>

      <input class="noteInput"
        data-assessment-id="${a.id}"
        inputmode="decimal"
        placeholder="—"
        value="${typeof realNote === "number" ? String(round2(realNote)).replace(".", ",") : ""}"
      />
    `;

    // CRUD épreuve
    row.querySelector(".aEdit")?.addEventListener("click", () => {
      window.CRUD.promptEditAssessment(state, ue.id, mod.id, a.id);
      saveState(state);
      renderAll();
    });

    row.querySelector(".aDel")?.addEventListener("click", () => {
      const ok = confirm(`Supprimer l’épreuve "${a.name}" ?\nLes notes associées seront supprimées.`);
      if (!ok) return;
      window.CRUD.deleteAssessmentAndData(state, ue.id, mod.id, a.id);
      saveState(state);
      renderAll();
    });

    // Notes / simu / coeff
    const noteInput  = row.querySelector(".noteInput");
    const simInput   = row.querySelector(".simInput");
    const coeffInput = row.querySelector(".coeffInput");

    noteInput.addEventListener("blur", () => {
      const v = gradeToNumber(noteInput.value);
      if (v === null) delete state.grades[a.id];
      else state.grades[a.id] = clamp(v, MIN_GRADE, SCALE);
      saveState(state);
      renderAll();
    });
    noteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); noteInput.blur(); }
    });

    simInput.addEventListener("blur", () => {
      const v = gradeToNumber(simInput.value);
      if (v === null) delete state.sim[a.id];
      else state.sim[a.id] = clamp(v, MIN_GRADE, SCALE);
      saveState(state);
      renderAll();
    });
    simInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); simInput.blur(); }
    });

    coeffInput.addEventListener("blur", () => {
      const v = gradeToNumber(coeffInput.value);
      if (v === null || v <= 0) delete state.coeffOverrides[a.id];
      else state.coeffOverrides[a.id] = v;
      saveState(state);
      renderAll();
    });
    coeffInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); coeffInput.blur(); }
    });

    return row;
  }

  // -----------------------------------
  // Render d'une carte module (CRUD partout)
  // -----------------------------------
  function renderModuleCard(ue, mod, opts = {}) {
    const { onlyAssessments = null, showUEContext = false, showMatchTag = true } = opts;

    const avg = moduleAvg(mod, true);

    const card = document.createElement("div");
    card.className = "module";
    card.innerHTML = `
      <div class="module__head">
        <div>
          <div class="module__name">${escapeHtml(mod.name)}</div>
          <div class="muted" style="font-size:12px;margin-top:3px;">
            ${showUEContext ? `<i class="fa-solid fa-layer-group"></i> UE : <strong>${escapeHtml(ue.name)}</strong><span class="muted"> • </span>` : ""}
            <i class="fa-solid fa-user"></i> ${escapeHtml(mod.teacher || "—")}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;">
          <div class="module__avg">${typeof avg === "number" ? round2(avg).toFixed(2) : "—"} / 20</div>

          <div class="module__tools">
            <button class="btn btn--outline btn--mini addAssess" title="Ajouter une épreuve">
              <i class="fa-solid fa-plus"></i> Épreuve
            </button>
            <button class="btn btn--ghost btn--mini modEdit" title="Modifier le module"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn--ghost btn--mini modDel" title="Supprimer le module"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
      <div class="assessments"></div>
    `;

    // CRUD module/épreuves (actif même en recherche)
    card.querySelector(".addAssess")?.addEventListener("click", () => {
      const name = prompt("Nom de l’épreuve ?");
      if (name === null) return;
      const coeffRaw = prompt("Coeff ?", "1");
      if (coeffRaw === null) return;

      const coeff = Number(String(coeffRaw).replace(",", "."));
      window.CRUD.addAssessment(state, ue.id, mod.id, { name, coeff });
      saveState(state);
      renderAll();
    });

    card.querySelector(".modEdit")?.addEventListener("click", () => {
      window.CRUD.promptEditModule(state, ue.id, mod.id);
      saveState(state);
      renderAll();
    });

    card.querySelector(".modDel")?.addEventListener("click", () => {
      const ok = confirm(`Supprimer le module "${mod.name}" ?\nLes notes associées seront supprimées.`);
      if (!ok) return;
      window.CRUD.deleteModuleAndData(state, ue.id, mod.id);
      saveState(state);
      renderAll();
    });

    const assHost = card.querySelector(".assessments");

    // Si on est en recherche et qu’on a des épreuves matchées : on affiche seulement celles-ci
    const list = (onlyAssessments && onlyAssessments.length) ? onlyAssessments : (mod.assessments || []);
    for (const a of list) {
      assHost.appendChild(renderAssessmentRow({ ue, mod, a, showMatchTag }));
    }

    return card;
  }

  // ============================
  // MODE RECHERCHE
  // ============================
  if (hasQuery) {
    const results = [];
    for (const ue of (state.structure.ues || [])) {
      for (const mod of (ue.modules || [])) {
        const aHits = (mod.assessments || []).filter(hitsAssessment);
        const modHit = hitsModule(ue, mod);
        if (modHit || aHits.length > 0) results.push({ ue, mod, aHits, modHit });
      }
    }

    if (results.length === 0) {
      const msg = document.createElement("div");
      msg.className = "card";
      msg.style.padding = "14px";
      msg.innerHTML = `
        <div style="font-weight:700;">Aucun résultat</div>
        <div class="muted" style="margin-top:6px;">
          Aucun module / prof / épreuve ne correspond à “${escapeHtml(query)}”.
        </div>
      `;
      host.appendChild(msg);

      // fallback : affiche l’UE sélectionnée
      renderModules(state, { saveState, renderAll }, "");
      return;
    }

    const header = document.createElement("div");
    header.className = "card";
    header.style.padding = "14px";
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;">
        <div style="font-weight:700;">Résultats de recherche</div>
        <div class="muted" style="font-size:12px;">${results.length} module(s)</div>
      </div>
      <div class="muted" style="margin-top:6px;">
        Recherche : <strong>${escapeHtml(query)}</strong>
      </div>
    `;
    host.appendChild(header);

    for (const { ue, mod, aHits } of results) {
      host.appendChild(
        renderModuleCard(ue, mod, {
          onlyAssessments: (aHits.length > 0 ? aHits : null),
          showUEContext: true,
          showMatchTag: true,
        })
      );
    }

    return;
  }

  // ============================
  // MODE NORMAL (UE sélectionnée)
  // ============================
  const ue = window.CRUD.getUEById(state, state.selectedUE);
  if (!ue) {
    host.innerHTML = `<div class="card" style="padding:14px;">Aucune UE sélectionnée.</div>`;
    return;
  }

  const realUE = window.CalcAPI.computeUEAverage(state, ue, false);
  const scenUE = window.CalcAPI.computeUEAverage(state, ue, true);

  const ueBlock = document.createElement("div");
  ueBlock.className = "card ue-block";
  ueBlock.innerHTML = `
    <div class="ue-head">
      <div>
        <h2>${escapeHtml(ue.name)}</h2>

        <div style="margin-top:6px;">
          <div style="font-weight:800;font-size:16px;">
            Moyenne UE (réel) : ${typeof realUE.avg === "number" ? round2(realUE.avg).toFixed(2) : "—"} / 20
          </div>
          <div class="muted" style="margin-top:3px;font-size:12px;">
            Simulation : ${typeof scenUE.avg === "number" ? round2(scenUE.avg).toFixed(2) : "—"} / 20
          </div>
        </div>
      </div>

      <div class="ue-meta">
        <div class="ue-head__actions">
          <button class="btn btn--outline btn--mini" id="btnAddModule">
            <i class="fa-solid fa-plus"></i> Module
          </button>
        </div>
        <span class="badge">Coeff notés : ${round2(realUE.doneW ?? 0)}/${round2(realUE.totalW ?? 0)}</span>
      </div>
    </div>
  `;
  host.appendChild(ueBlock);

  ueBlock.querySelector("#btnAddModule")?.addEventListener("click", () => {
    const name = prompt("Nom du module ?");
    if (name === null) return;
    const teacher = prompt("Prof (optionnel) ?") ?? "";
    window.CRUD.addModule(state, ue.id, { name, teacher });
    saveState(state);
    renderAll();
  });

  for (const mod of (ue.modules || [])) {
    host.appendChild(
      renderModuleCard(ue, mod, {
        onlyAssessments: null,
        showUEContext: false,
        showMatchTag: false,
      })
    );
  }
}

window.UIAPI.renderModules = renderModules;


window.UIAPI.renderModules = renderModules;

  
  window.UIAPI.renderModules = renderModules;  