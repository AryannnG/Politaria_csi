// Policy catalog. Policies stay active until repealed and apply their
// effects every month via the simulation engine (see engine/simulation.js).
module.exports = [
  {
    id: "universal_healthcare",
    name: "Universal Healthcare Subsidy",
    monthlyCost: 600,
    monthlyEffects: { healthcare: 1.5, approval: 0.5 },
  },
  {
    id: "free_education",
    name: "Free Public Education",
    monthlyCost: 700,
    monthlyEffects: { education: 1.5, approval: 0.5 },
  },
  {
    id: "green_initiative",
    name: "Green City Initiative",
    monthlyCost: 500,
    monthlyEffects: { environment: 1.5, approval: 0.5 },
  },
  {
    id: "business_tax_breaks",
    name: "Business Tax Breaks",
    monthlyCost: 0,
    monthlyEffects: { economy: 2, approval: -0.5 },
    taxRateModifier: -2,
  },
  {
    id: "anti_corruption_task_force",
    name: "Anti-Corruption Task Force",
    monthlyCost: 400,
    monthlyEffects: { governance: 1.5 },
  },
];
