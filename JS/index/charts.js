// js/charts.js
(function () {
    function ueHasAnySimulation(state, ue) {
        for (const m of (ue.modules || [])) {
          for (const a of (m.assessments || [])) {
            if (typeof state.sim?.[a.id] === "number") return true;
          }
        }
        return false;
      }      
  
    function renderChart(state) {
      const ues = state?.structure?.ues || [];
      const labels = ues.map(u => u.name);
  
      const dataReal = ues.map(ue => {
        const r = window.CalcAPI.computeUEAverage(state, ue, false);
        return (typeof r.avg === "number") ? window.CalcAPI.round2(r.avg) : null;
      });
  
      const dataScen = ues.map(ue => {
        if (!ueHasAnySimulation(state, ue)) return null; // pas de rouge si pas de simulation utile
        const s = window.CalcAPI.computeUEAverage(state, ue, true);
        return (typeof s.avg === "number") ? window.CalcAPI.round2(s.avg) : null;
      });
  
      const ctx = document.getElementById("ueChart");
      if (!ctx) return;
  
      if (window.__UE_CHART__) window.__UE_CHART__.destroy();
  
      window.__UE_CHART__ = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Réel (/20)", data: dataReal, borderWidth: 1 },
            { label: "Simulation (/20)", data: dataScen, borderWidth: 1 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true, suggestedMax: 20 } },
        },        
      });
    }
  
    window.ChartAPI = { renderChart };
  })();  