const scenarios = [
  { id: "health", label: "Public health", visualType: "virus", metric: "healthcare", icon: "✚", incidents: ["Ward Capacity Alert", "Waterborne Illness Cluster", "Seasonal Flu Surge", "Medicine Supply Shortage", "Food Safety Outbreak", "Heatwave Health Emergency", "Air Quality Respiratory Spike", "Vaccination Gap", "Maternity Care Backlog"], description: "Clinics report {nameLower}; vulnerable neighborhoods need support.", responses: [
    { label: "Open emergency clinics", effects: { treasury: -7200, healthcare: 9, approval: 4 } },
    { label: "Target the highest-risk wards", effects: { treasury: -3900, healthcare: 6, governance: 2, approval: 2 } },
    { label: "Delay a citywide response", effects: { healthcare: -9, approval: -6, population: -160 } },
  ] },
  { id: "flood", label: "Flood and weather", visualType: "flood", metric: "infrastructure", icon: "🌧", incidents: ["River Surge Warning", "Flash Flooded Underpass", "Monsoon Drain Overflow", "Coastal Storm Damage", "Landslide on the Ring Road", "Hailstorm Roof Damage", "Drought Water Restrictions", "Extreme Heat Emergency", "Bridge Washed Out"], description: "Emergency crews report {nameLower}; low-lying routes and homes are at risk.", responses: [
    { label: "Fund a full relief operation", effects: { treasury: -7600, infrastructure: 6, environment: 2, approval: 4 } },
    { label: "Evacuate exposed blocks", effects: { treasury: -4300, governance: 3, approval: 3, population: -35 } },
    { label: "Wait for conditions to improve", effects: { infrastructure: -10, environment: -5, approval: -8, population: -110 } },
  ] },
  { id: "conflict", label: "Conflict and security", visualType: "conflict", metric: "governance", icon: "⚑", incidents: ["Border Tension Briefing", "National Mobilisation Request", "Veterans' Housing Shortfall", "Critical Supply Convoy Delayed", "Civil Defence Readiness Test", "Regional Security Scare", "Refugee Transit Pressure", "Cyberattack on City Services", "Peace Summit Opportunity"], description: "A regional security briefing has raised concern about {nameLower}; civilian services must remain protected.", responses: [
    { label: "Coordinate a civilian protection plan", effects: { treasury: -5600, governance: 5, approval: 4, environment: 1 } },
    { label: "Fund emergency readiness", effects: { treasury: -8700, infrastructure: 4, governance: 5, economy: -3 } },
    { label: "Keep city spending unchanged", effects: { governance: -7, economy: -5, approval: -4 } },
  ] },
  { id: "crime", label: "Public safety", visualType: "crime", metric: "governance", icon: "◈", incidents: ["Night Market Theft Spike", "Transit Pickpocketing Reports", "Warehouse Robbery", "Online Fraud Wave", "Neighborhood Vandalism", "Illegal Arms Seizure", "Emergency Dispatch Backlog", "Fire Station Staffing Gap", "Community Safety Petition"], description: "Residents and local businesses report {nameLower}; trust in public safety is under pressure.", responses: [
    { label: "Fund community policing", effects: { treasury: -4700, governance: 6, approval: 4 } },
    { label: "Invest in prevention and youth services", effects: { treasury: -3600, education: 3, governance: 4, approval: 3 } },
    { label: "Order a high-visibility crackdown", effects: { treasury: -1600, governance: 3, approval: -7 } },
  ] },
  { id: "infrastructure", label: "Infrastructure", visualType: "infrastructure", metric: "infrastructure", icon: "⚒", incidents: ["Main Avenue Sinkhole", "Power Substation Failure", "Water Main Break", "Wastewater Plant Alarm", "Telecom Network Outage", "Public Housing Elevator Failure", "Damaged Rail Switch", "Construction Contract Delay", "Bridge Inspection Failure"], description: "Engineers have flagged {nameLower}; service disruption will spread without intervention.", responses: [
    { label: "Approve urgent repairs", effects: { treasury: -6800, infrastructure: 8, approval: 3 } },
    { label: "Reroute and repair in stages", effects: { treasury: -3500, infrastructure: 5, economy: -1, approval: 1 } },
    { label: "Defer the maintenance", effects: { infrastructure: -10, economy: -4, approval: -5 } },
  ] },
  { id: "diplomacy", label: "International affairs", visualType: "diplomacy", metric: "economy", icon: "✦", incidents: ["International Delegation Visit", "Consulate Security Request", "Twin-City Trade Mission", "Humanitarian Corridor Request", "Foreign Investment Offer", "Regional Trade Dispute", "Embassy Cultural Week", "Climate Partnership Invitation", "International Sports Bid"], description: "An international partner has raised {nameLower}; the city's response could affect trade and its reputation.", responses: [
    { label: "Host and coordinate the visit", effects: { treasury: -4400, economy: 6, governance: 3, approval: 2 } },
    { label: "Negotiate a limited partnership", effects: { treasury: -1800, economy: 4, governance: 2 } },
    { label: "Decline the request", effects: { economy: -4, governance: -2 } },
  ] },
  { id: "protest", label: "Civic unrest", visualType: "protest", metric: "approval", icon: "▤", incidents: ["Transit Fare Demonstration", "Renters' Rights March", "Public Sector Walkout", "Water Access Protest", "Market Vendor Sit-In", "Climate Action Rally", "Students' City Hall March", "Neighborhood Noise Complaint", "Election Integrity Petition"], description: "A peaceful crowd has gathered over {nameLower}; the city must respond without escalating tensions.", responses: [
    { label: "Meet organizers in public", effects: { treasury: -1200, approval: 7, governance: 4 } },
    { label: "Offer a funded compromise", effects: { treasury: -4100, approval: 5, economy: -1, governance: 2 } },
    { label: "Order a forceful dispersal", effects: { governance: 2, approval: -10 } },
  ] },
  { id: "education", label: "Education", visualType: "education", metric: "education", icon: "⌂", incidents: ["School Roof Safety Notice", "Teacher Retention Warning", "Exam Integrity Leak", "Campus Meal Funding Gap", "Digital Learning Outage", "Vocational Skills Shortage", "School Transport Strike", "Library Closure Threat", "University Lab Grant Offer"], description: "Educators report {nameLower}; students could lose learning time this term.", responses: [
    { label: "Fund schools and staff", effects: { treasury: -5100, education: 8, approval: 3 } },
    { label: "Protect essential classes first", effects: { treasury: -2500, education: 5, governance: 2 } },
    { label: "Postpone the investment", effects: { education: -8, approval: -4, economy: -2 } },
  ] },
  { id: "culture", label: "Culture and community", visualType: "culture", metric: "approval", icon: "♫", incidents: ["Historic Theater at Risk", "Festival Permit Dispute", "Museum Collection Loan", "Community Arts Grant", "Local Language Archive Rescue", "Religious Procession Route Dispute", "Public Square Accessibility Need", "Heritage Building Fire Alarm", "City Anniversary Celebration"], description: "Community groups are seeking a decision on {nameLower}; the choice will shape the city's shared spaces.", responses: [
    { label: "Back the community program", effects: { treasury: -2800, approval: 6, governance: 2 } },
    { label: "Share costs with local partners", effects: { treasury: -900, economy: 2, approval: 4 } },
    { label: "Cancel this year's program", effects: { treasury: 1200, approval: -5 } },
  ] },
  { id: "cinema", label: "Film and entertainment", visualType: "culture", metric: "economy", icon: "▶", incidents: ["Major Film Shoot Permit", "Cinema Complex Job Offer", "Location Crew Housing Crunch", "Stunt Safety Inspection", "Film Festival Sponsorship", "Public Road Closure for Filming", "Independent Theater Closure", "Streaming Studio Tax Proposal", "Premiere Night Transit Plan"], description: "A production and entertainment group has asked about {nameLower}; residents expect clear rules and local benefits.", responses: [
    { label: "Approve with local hiring rules", effects: { treasury: 2200, economy: 5, approval: 3 } },
    { label: "Offer a limited city grant", effects: { treasury: -2100, economy: 4, approval: 2 } },
    { label: "Reject the proposal", effects: { economy: -3, approval: -1 } },
  ] },
  { id: "economy", label: "Economy and livelihoods", visualType: "economy", metric: "economy", icon: "₹", incidents: ["Factory Layoff Notice", "Market Price Shock", "Small Business Credit Squeeze", "Port Trade Slowdown", "Tourism Season Windfall", "Food Cooperative Expansion", "Commercial Rent Spike", "Local Currency Fraud Alert", "Night Shift Worker Shortage"], description: "Employers and residents are reacting to {nameLower}; household incomes and the city budget may shift.", responses: [
    { label: "Launch a targeted relief fund", effects: { treasury: -4900, economy: 6, approval: 3 } },
    { label: "Offer temporary tax relief", effects: { treasury: -1800, economy: 4, approval: 2 } },
    { label: "Let the market adjust", effects: { economy: -7, approval: -5, population: -75 } },
  ] },
  { id: "environment", label: "Environment", visualType: "environment", metric: "environment", icon: "♧", incidents: ["River Pollution Reading", "Industrial Emissions Exceedance", "Tree Canopy Loss", "Urban Wildlife Rescue", "Recycling Plant Fire", "Smog Advisory", "Wetland Restoration Grant", "Illegal Dumping Discovery", "Community Garden Water Shortage"], description: "Environmental monitors report {nameLower}; nearby neighborhoods and wildlife could be affected.", responses: [
    { label: "Fund cleanup and monitoring", effects: { treasury: -5300, environment: 8, healthcare: 2, approval: 3 } },
    { label: "Enforce a polluter recovery plan", effects: { economy: -2, environment: 6, governance: 4 } },
    { label: "Issue guidance and defer costs", effects: { environment: -8, healthcare: -3, approval: -5 } },
  ] },
];

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const eventCatalog = scenarios.flatMap((scenario) => scenario.incidents.map((incident, index) => ({
  id: `${scenario.id}_${slug(incident)}`,
  title: incident,
  description: scenario.description.replace("{nameLower}", incident.toLowerCase()),
  category: scenario.label,
  icon: scenario.icon,
  severity: "crisis",
  visualType: scenario.visualType,
  metric: scenario.metric,
  weight: 1 + (index % 3) * 0.2,
  cooldownMonths: 8,
  relevance: (stats) => 0.85 + (100 - Math.max(0, Math.min(100, Number(stats[scenario.metric] ?? 50)))) / 65,
  choices: scenario.responses.map((response, choiceIndex) => ({
    id: ["invest", "target", "defer"][choiceIndex],
    label: response.label,
    effects: Object.fromEntries(Object.entries(response.effects).map(([key, value]) => [key, key === "treasury" ? Math.round(value * 0.32) : value])),
    followUps: choiceIndex === 2 && index % 2 === 0 ? [{ eventId: `${scenario.id}_${slug(scenario.incidents[(index + 1) % scenario.incidents.length])}`, afterMonths: 2 }] : [],
  })),
})));

module.exports = eventCatalog;
