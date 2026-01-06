// js/calc.js
(function () {
    const SCALE = 20;
    const PASS_MARK = 10;
  
    function coeffOf(state, assessment) {
      // Si tu as un système d'override, applique-le ici
      const ov = state.coeffOverrides?.[assessment.id];
      const c = (typeof ov === "number" && Number.isFinite(ov)) ? ov : assessment.coeff;
      return Number(c);
    }
  
    function flattenUEAssessments(state, ue) {
      return ue.modules.flatMap(m => m.assessments.map(a => ({ m, a })));
    }
  
    function computeUEAverage(state, ue, useScenario) {
      const items = flattenUEAssessments(state, ue);
      let doneW = 0, sum = 0, totalW = 0;
  
      for (const { a } of items) {
        const w = coeffOf(state, a);
        totalW += w;
  
        const real = state.grades[a.id];
        const sim = state.sim[a.id];
  
        const g = (typeof real === "number")
          ? real
          : (useScenario && typeof sim === "number" ? sim : null);
  
        if (typeof g === "number") {
          doneW += w;
          sum += g * w;
        }
      }
      const avg = doneW > 0 ? sum / doneW : null;
      return { avg, doneW, totalW };
    }
  
    function computeGlobalAverage(state, useScenario) {
      const all = state.structure.ues.flatMap(ue => flattenUEAssessments(state, ue));
      let doneW = 0, sum = 0, totalW = 0;
  
      for (const { a } of all) {
        const w = coeffOf(state, a);
        totalW += w;
  
        const real = state.grades[a.id];
        const sim = state.sim[a.id];
        const g = (typeof real === "number") ? real : (useScenario && typeof sim === "number" ? sim : null);
  
        if (typeof g === "number") {
          doneW += w;
          sum += g * w;
        }
      }
      const avg = doneW > 0 ? sum / doneW : null;
      return { avg, doneW, totalW };
    }
  
    function round2(x) { return Math.round(x * 100) / 100; }

    function requiredAverageForUE(state, ue, passMark = PASS_MARK, useScenarioDone = true) {
      // Objectif: obtenir passMark sur la moyenne UE pondérée, sur l'ensemble des coeffs
      // "done" = notes déjà connues. Si useScenarioDone=true: réel prioritaire, sinon réel only.
      const items = flattenUEAssessments(state, ue);
    
      let doneW = 0;
      let doneSum = 0;
      let totalW = 0;
    
      for (const { a } of items) {
        const w = coeffOf(state, a);
        totalW += w;
    
        const real = state.grades[a.id];
        const sim  = state.sim[a.id];
    
        const g = (typeof real === "number")
          ? real
          : (useScenarioDone && typeof sim === "number" ? sim : null);
    
        if (typeof g === "number") {
          doneW += w;
          doneSum += g * w;
        }
      }
    
      const remainingW = totalW - doneW;
    
      // Si rien à faire (ou coeff total nul)
      if (totalW <= 0) return { possible: false, remainingW: 0, reqAvg: null };
      if (remainingW <= 0) return { possible: true, remainingW: 0, reqAvg: null };
    
      const targetTotal = passMark * totalW;
      const neededOnRemaining = targetTotal - doneSum;
    
      const reqAvg = neededOnRemaining / remainingW; // peut être <0 ou >20
      return { possible: true, remainingW, reqAvg };
    }    

    const MIN_GRADE = 0.5;

    // Plan "équilibré" pour valider l'UE:
    // - On considère "fait" tout ce qui a une note réelle, ou (si pas réel) une note sim.
    // - On calcule la moyenne uniforme à mettre sur le restant pour atteindre PASS_MARK.
    function buildBalancedPlanForUE(state, ue) {
      const items = flattenUEAssessments(state, ue);

      let totalW = 0;
      let doneW = 0;
      let doneWeighted = 0;

      for (const { a } of items) {
        const w = coeffOf(state, a);
        if (!(w > 0)) continue; // ignore coeff 0 (DOM etc.)

        totalW += w;

        const real = state.grades?.[a.id];
        const sim = state.sim?.[a.id];
        const g =
          (typeof real === "number")
            ? real
            : (typeof sim === "number" ? sim : null);

        if (typeof g === "number") {
          doneW += w;
          doneWeighted += g * w;
        }
      }

      const remainingW = totalW - doneW;

      // Si rien à évaluer (totalW=0) -> cas UE "sans coeff"
      if (totalW <= 0) {
        return {
          possible: true,
          reqAvg: null,
          remainingW: 0,
          totalW: 0,
        };
      }

      // UE complète côté scénario
      if (remainingW <= 0) {
        const finalAvg = doneWeighted / totalW;
        return {
          possible: finalAvg >= PASS_MARK,
          reqAvg: null,
          remainingW: 0,
          totalW,
          finalAvg,
        };
      }

      const targetTotal = PASS_MARK * totalW;
      const neededOnRemaining = targetTotal - doneWeighted;

      // Si même avec MIN_GRADE partout tu valides déjà
      const minPossibleTotalOnRemaining = MIN_GRADE * remainingW;
      if (neededOnRemaining <= minPossibleTotalOnRemaining) {
        return {
          possible: true,
          reqAvg: MIN_GRADE,
          remainingW,
          totalW,
        };
      }

      let reqAvg = neededOnRemaining / remainingW;

      // Si on demande > 20 -> impossible
      if (!Number.isFinite(reqAvg) || reqAvg > SCALE) {
        return {
          possible: false,
          reqAvg,
          remainingW,
          totalW,
        };
      }

      // Clamp bas à MIN_GRADE
      if (reqAvg < MIN_GRADE) reqAvg = MIN_GRADE;

      return {
        possible: true,
        reqAvg,
        remainingW,
        totalW,
      };
    }

    window.CalcAPI = {
      SCALE, PASS_MARK,
      round2,
      coeffOf,
      flattenUEAssessments,
      computeUEAverage,
      computeGlobalAverage,
      requiredAverageForUE,
      buildBalancedPlanForUE,
    };
  })();  