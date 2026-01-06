/* =========================
   CRUD (UE fixe / Modules & Assessments modifiables)
   Expose: window.CRUD
   ========================= */
   (function () {
    "use strict";
  
    const SCALE = 20;
    const MIN_GRADE = 0.5;
  
    function uid(prefix = "id") {
      if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  
    function clamp(x, min, max) {
      return Math.min(max, Math.max(min, x));
    }
  
    function gradeToNumber(v) {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
  
    function getUEById(state, ueId) {
      return state?.structure?.ues?.find(u => u.id === ueId) ?? state?.structure?.ues?.[0] ?? null;
    }
  
    function findModule(state, ueId, moduleId) {
      const ue = getUEById(state, ueId);
      if (!ue) return null;
      return ue.modules?.find(m => m.id === moduleId) ?? null;
    }
  
    function ensureStateBuckets(state) {
      state.grades = state.grades || {};
      state.sim = state.sim || {};
      state.coeffOverrides = state.coeffOverrides || {};
      state.structure = state.structure || { specialization: "", ues: [] };
      state.structure.ues = state.structure.ues || [];
    }
  
    /* -------------------------
       Cleanup helpers
       ------------------------- */
    function deleteAssessmentData(state, assessmentId) {
      if (!assessmentId) return;
      if (state.grades) delete state.grades[assessmentId];
      if (state.sim) delete state.sim[assessmentId];
      if (state.coeffOverrides) delete state.coeffOverrides[assessmentId];
    }
  
    function deleteModuleData(state, module) {
      if (!module?.assessments) return;
      for (const a of module.assessments) {
        deleteAssessmentData(state, a.id);
      }
    }
  
    /* =========================
       MODULE CRUD
       ========================= */
    function addModule(state, ueId, { name, teacher } = {}) {
      ensureStateBuckets(state);
      const ue = getUEById(state, ueId);
      if (!ue) return null;
  
      ue.modules = ue.modules || [];
  
      const mid = uid(`${ueId}-M`);
      const aid = uid(`${mid}-A`);
  
      const module = {
        id: mid,
        name: (name?.trim() || "Nouveau module"),
        teacher: (teacher?.trim() || ""),
        assessments: [
          { id: aid, name: "Évaluation", coeff: 1 }
        ]
      };
  
      ue.modules.push(module);
      return module;
    }
  
    function editModule(state, ueId, moduleId, { name, teacher } = {}) {
      ensureStateBuckets(state);
      const mod = findModule(state, ueId, moduleId);
      if (!mod) return false;
  
      if (typeof name === "string") mod.name = name.trim() || mod.name;
      if (typeof teacher === "string") mod.teacher = teacher.trim();
  
      return true;
    }
  
    function deleteModuleAndData(state, ueId, moduleId) {
      ensureStateBuckets(state);
      const ue = getUEById(state, ueId);
      if (!ue) return false;
  
      const mod = ue.modules?.find(m => m.id === moduleId);
      if (!mod) return false;
  
      deleteModuleData(state, mod);
      ue.modules = (ue.modules || []).filter(m => m.id !== moduleId);
      return true;
    }
  
    /* =========================
       ASSESSMENT CRUD
       ========================= */
    function addAssessment(state, ueId, moduleId, { name, coeff } = {}) {
      ensureStateBuckets(state);
      const mod = findModule(state, ueId, moduleId);
      if (!mod) return null;
  
      mod.assessments = mod.assessments || [];
      const aid = uid(`${moduleId}-A`);
  
      const c = (typeof coeff === "number" && Number.isFinite(coeff) && coeff > 0) ? coeff : 1;
  
      const assessment = {
        id: aid,
        name: (name?.trim() || "Nouvelle épreuve"),
        coeff: c,
      };
  
      mod.assessments.push(assessment);
      return assessment;
    }
  
    function editAssessment(state, ueId, moduleId, assessmentId, { name, coeff } = {}) {
      ensureStateBuckets(state);
      const mod = findModule(state, ueId, moduleId);
      if (!mod) return false;
  
      const a = (mod.assessments || []).find(x => x.id === assessmentId);
      if (!a) return false;
  
      if (typeof name === "string") a.name = name.trim() || a.name;
  
      // Si tu veux gérer le coeff de base dans l’édition :
      if (typeof coeff === "number" && Number.isFinite(coeff) && coeff > 0) {
        a.coeff = coeff;
        // Optionnel : si override existait, on peut l’aligner ou le supprimer
        // delete state.coeffOverrides[assessmentId];
      }
  
      return true;
    }
  
    function deleteAssessmentAndData(state, ueId, moduleId, assessmentId) {
      ensureStateBuckets(state);
      const mod = findModule(state, ueId, moduleId);
      if (!mod) return false;
  
      deleteAssessmentData(state, assessmentId);
  
      mod.assessments = (mod.assessments || []).filter(a => a.id !== assessmentId);
      return true;
    }
  
    /* =========================
       Quick prompt helpers (optionnels)
       ========================= */
    function promptAddModule(state, ueId) {
      const name = prompt("Nom du module ?");
      if (name === null) return null;
      const teacher = prompt("Prof (optionnel) ?") ?? "";
      return addModule(state, ueId, { name, teacher });
    }
  
    function promptEditModule(state, ueId, moduleId) {
      const mod = findModule(state, ueId, moduleId);
      if (!mod) return false;
  
      const name = prompt("Nom du module :", mod.name ?? "");
      if (name === null) return false;
  
      const teacher = prompt("Prof (optionnel) :", mod.teacher ?? "");
      if (teacher === null) return false;
  
      return editModule(state, ueId, moduleId, { name, teacher });
    }
  
    function promptAddAssessment(state, ueId, moduleId) {
      const name = prompt("Nom de l’épreuve ?");
      if (name === null) return null;
  
      const coeffRaw = prompt("Coeff ?", "1");
      if (coeffRaw === null) return null;
  
      const coeff = gradeToNumber(coeffRaw);
      return addAssessment(state, ueId, moduleId, { name, coeff: (coeff ?? 1) });
    }
  
    function promptEditAssessment(state, ueId, moduleId, assessmentId) {
      const mod = findModule(state, ueId, moduleId);
      const a = mod?.assessments?.find(x => x.id === assessmentId);
      if (!a) return false;
  
      const name = prompt("Nom de l’épreuve :", a.name ?? "");
      if (name === null) return false;
  
      const coeffRaw = prompt("Coeff (base) :", String(a.coeff ?? 1).replace(".", ","));
      if (coeffRaw === null) return false;
  
      const coeff = gradeToNumber(coeffRaw);
      return editAssessment(state, ueId, moduleId, assessmentId, { name, coeff: (coeff ?? a.coeff) });
    }
  
    window.CRUD = {
      // basic helpers
      uid, clamp, gradeToNumber,
      getUEById, findModule,
  
      // module CRUD
      addModule, editModule, deleteModuleAndData,
  
      // assessment CRUD
      addAssessment, editAssessment, deleteAssessmentAndData,
  
      // optional prompts
      promptAddModule, promptEditModule,
      promptAddAssessment, promptEditAssessment,
  
      // constants (if you want)
      SCALE, MIN_GRADE,
    };
  })();  