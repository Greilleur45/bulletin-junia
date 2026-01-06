// js/structure.aéro.js
/* =========================
   STRUCTURE (AERO + TRONC COMMUN)
   type: "AERO" ou "TRONC"
   ========================= */
window.DEFAULT_STRUCTURE = {
  specialization: "Aéronautique",
  ues: [
    // ====== AERO ======
    {
      type: "AERO",
      id: "UE1",
      name: "UE1 : Robotique I",
      modules: [
        {
          id: "UE1-M1",
          name: "Initiation à la robotique",
          teacher: "M. BELHARET",
          assessments: [
            { id: "UE1-M1-A1", name: "DS", coeff: 40 },
            { id: "UE1-M1-A2", name: "TP", coeff: 10 },
          ],
        },
        {
          id: "UE1-M2",
          name: "Vision pour la robotique",
          teacher: "M. BELHARET",
          assessments: [{ id: "UE1-M2-A1", name: "Rapport", coeff: 25 }],
        },
        {
          id: "UE1-M3",
          name: "Commande pour les robots",
          teacher: "M. DELOUCHE",
          assessments: [{ id: "UE1-M3-A1", name: "Rapport", coeff: 25 }],
        },
      ],
    },

    {
      type: "AERO",
      id: "UE2",
      name: "UE2 : Ingénierie de Conception Aéronautique I",
      modules: [
        {
          id: "UE2-M1",
          name: "Introduction à l’ingénierie aéronautique",
          teacher: "N. NAMARI",
          assessments: [{ id: "UE2-M1-A1", name: "DS", coeff: 10 }],
        },
        {
          id: "UE2-M2",
          name: "Normes et réglementation aéronautique",
          teacher: "B. SIONG",
          assessments: [{ id: "UE2-M2-A1", name: "DS", coeff: 30 }],
        },
        {
          id: "UE2-M3",
          name: "Turbomachine",
          teacher: "A. FIRRITO",
          assessments: [{ id: "UE2-M3-A1", name: "DS", coeff: 20 }],
        },
        {
          id: "UE2-M4",
          name: "Aérodynamique",
          teacher: "E. DUPIRE",
          assessments: [
            { id: "UE2-M4-A1", name: "DS", coeff: 20 },
            { id: "UE2-M4-A2", name: "TP1", coeff: 4 },
            { id: "UE2-M4-A3", name: "TP2", coeff: 4 },
            { id: "UE2-M4-A4", name: "Rapport", coeff: 12 },
          ],
        },
      ],
    },

    {
      type: "AERO",
      id: "UE3",
      name: "UE3 : Système avionique I",
      modules: [
        {
          id: "UE3-M1",
          name: "Commande multivariable",
          teacher: "L. LAMARI",
          assessments: [{ id: "UE3-M1-A1", name: "DS", coeff: 25 }],
        },
        {
          id: "UE3-M2",
          name: "Mécanique du vol",
          teacher: "M. LARRACHE-JOUBERT",
          assessments: [{ id: "UE3-M2-A1", name: "DS", coeff: 20 }],
        },
        {
          id: "UE3-M3",
          name: "Conception avion",
          teacher: "A. SGUÉGLIA",
          assessments: [
            { id: "UE3-M3-A1", name: "DS", coeff: 20 },
            { id: "UE3-M3-A2", name: "Rapport", coeff: 30 },
          ],
        },
        {
          id: "UE3-M4",
          name: "Modélisation et conception d’actionneur",
          teacher: "J.-C. MARÉ",
          assessments: [
            { id: "UE3-M4-A1", name: "Rapport", coeff: 25 },
          ],
        },
      ],
    },

    {
      type: "AERO",
      id: "UE4",
      name: "UE4 : Outils pour l’industrie du futur I",
      modules: [
        {
          id: "UE4-M1",
          name: "Prototypage et système embarqué",
          teacher: "F. DUCULTY",
          assessments: [{ id: "UE4-M1-A1", name: "Projet", coeff: 30 }],
        },
        {
          id: "UE4-M2",
          name: "Intégration robotique",
          teacher: "R. GUENARD",
          assessments: [{ id: "UE4-M2-A1", name: "Projet", coeff: 40 }],
        },
        {
          id: "UE4-M3",
          name: "CAO et fabrication additive",
          teacher: "Anwar SARAH",
          assessments: [{ id: "UE4-M3-A1", name: "Projet", coeff: 30 }],
        },
      ],
    },

    // ====== TRONC COMMUN ======
{
    type: "TRONC",
    id: "TC-UE1-SI",
    name: "UE1 : SI (Sciences d'Ingénieur)",
    modules: [
      {
        id: "TC-UE1-SI-M1",
        name: "Projet Technique",
        teacher: "M. DELOUCHE",
        assessments: [
          { id: "TC-UE1-SI-M1-A1", name: "Projet", coeff: 100 },
        ],
      },
    ],
  },
  {
    type: "TRONC",
    id: "TC-UE2-OME",
    name: "UE2 : OME (Organisation et Management des Entreprises)",
    modules: [
      {
        id: "TC-UE2-OME-M1",
        name: "Comptabilité",
        teacher: "Mme. AMBROSIO",
        assessments: [
          { id: "TC-UE2-OME-M1-A1", name: "DS", coeff: 33 },
        ],
      },
      {
        id: "TC-UE2-OME-M2",
        name: "Lean Manufacturing",
        teacher: "M. TESTU",
        assessments: [
          { id: "TC-UE2-OME-M2-A1", name: "DS", coeff: 34 },
        ],
      },
      {
        id: "TC-UE2-OME-M3",
        name: "Qualité en entreprise",
        teacher: "M. DACHE",
        assessments: [
          { id: "TC-UE2-OME-M3-A1", name: "DS", coeff: 33 },
        ],
      },
    ],
  },
  {
    type: "TRONC",
    id: "TC-UE3-HL",
    name: "UE3 : HL (Humanité Langues)",
    modules: [
      {
        id: "TC-UE3-HL-M1",
        name: "Anglais",
        teacher: "M. LOMBARTEIX",
        assessments: [
          { id: "TC-UE3-HL-M1-A1", name: "Contrôle continu Période 1 (septembre)", coeff: 33.33 },
          { id: "TC-UE3-HL-M1-A2", name: "Contrôle continu Pédiode 2 (janvier)", coeff: 33.33 },
          { id: "TC-UE3-HL-M1-A3", name: "Contrôle continu Période 3 (mai)", coeff: 33.33 },
        ],
      },
  
      // Le tableau ne montre pas de coeff pour "Conférences".
      {
        id: "TC-UE3-HL-M2",
        name: "Conférences",
        teacher: "Mme. BOSSUT",
        assessments: [
          { id: "TC-UE3-HL-M2-A1", name: "Évaluation", coeff: 0 },
        ],
      },
  
      // "Projet Personnel et Professionnel et simulation d'entretiens"
      {
        id: "TC-UE3-HL-M3",
        name: "Projet personnel & simulation d'entretiens",
        teacher: "M. POMME",
        assessments: [
          { id: "TC-UE3-HL-M3-A1", name: "Évaluation", coeff: 0 },
        ],
      },
    ],
  },
  
    // DOM : le tableau liste UE 1 DOM, UE 2 DOM, UE 3 DOM, UE 4 DOM
    {
        type: "TRONC",
        id: "TC-DOM",
        name: "DOM",
        modules: [
        {
            id: "TC-DOM-M1",
            name: "UE 1 DOM",
            teacher: "—",
            assessments: [
            { id: "TC-DOM-M1-A1", name: "Évaluation", coeff: 0 },
            ],
        },
        {
            id: "TC-DOM-M2",
            name: "UE 2 DOM",
            teacher: "—",
            assessments: [
            { id: "TC-DOM-M2-A1", name: "Évaluation", coeff: 0 },
            ],
        },
        {
            id: "TC-DOM-M3",
            name: "UE 3 DOM",
            teacher: "—",
            assessments: [
            { id: "TC-DOM-M3-A1", name: "Évaluation", coeff: 0 },
            ],
        },
        {
            id: "TC-DOM-M4",
            name: "UE 4 DOM",
            teacher: "—",
            assessments: [
            { id: "TC-DOM-M4-A1", name: "Évaluation", coeff: 0 },
            ],
        },
        ],
    },

    {
        type: "TRONC",
        id: "TC-UE8-VES",
        name: "UE8 : Vie Engagement Sociétal",
        modules: [
        {
            id: "TC-UE8-VES-M1",
            name: "Visite et conférence",
            teacher: "—",
            assessments: [
            { id: "TC-UE8-VES-M1-A1", name: "Évaluation", coeff: 50 },
            ],
        },
        ],
    },

    // UE7 : Entreprise (pas de coeff visible)
    {
        type: "TRONC",
        id: "TC-UE7-ENT",
        name: "UE7 : Entreprise",
        modules: [
        {
            id: "TC-UE7-ENT-M1",
            name: "Entreprise",
            teacher: "—",
            assessments: [
            { id: "TC-UE7-ENT-M1-A1", name: "Évaluation", coeff: 0 },
            ],
        },
        ],
    },  
    ],
  };