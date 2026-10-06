const mongoose = require("mongoose");

// Stats match plan.md Section 0.1: the systems the player must balance.
const statsSchema = new mongoose.Schema(
  {
    population: { type: Number, default: 10000 },
    treasury: { type: Number, default: 50000 },
    economy: { type: Number, default: 50, min: 0, max: 100 },
    healthcare: { type: Number, default: 50, min: 0, max: 100 },
    education: { type: Number, default: 50, min: 0, max: 100 },
    infrastructure: { type: Number, default: 50, min: 0, max: 100 },
    environment: { type: Number, default: 50, min: 0, max: 100 },
    governance: { type: Number, default: 50, min: 0, max: 100 },
    approval: { type: Number, default: 60, min: 0, max: 100 },
  },
  { _id: false }
);

const buildingInstanceSchema = new mongoose.Schema(
  {
    buildingId: { type: String, required: true },
    builtOnMonth: { type: Number, required: true },
  },
  { _id: false }
);

const activePolicySchema = new mongoose.Schema(
  {
    policyId: { type: String, required: true },
    enactedOnMonth: { type: Number, required: true },
  },
  { _id: false }
);

const missionProgressSchema = new mongoose.Schema(
  {
    missionId: { type: String, required: true },
    status: { type: String, enum: ["active", "completed", "failed"], default: "active" },
    startedOnMonth: { type: Number, required: true },
    completedOnMonth: { type: Number, default: null },
  },
  { _id: false }
);

const pendingEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    choices: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    triggeredOnMonth: { type: Number, required: true },
  },
  { _id: false }
);

const logEntrySchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    type: { type: String, required: true }, // revenue | expense | event | consequence | mission | status
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mayor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    month: { type: Number, default: 0 },
    taxRate: { type: Number, default: 10, min: 0, max: 40 }, // percent

    stats: { type: statsSchema, default: () => ({}) },

    buildings: { type: [buildingInstanceSchema], default: [] },
    activePolicies: { type: [activePolicySchema], default: [] },
    missions: { type: [missionProgressSchema], default: [] },
    pendingEvents: { type: [pendingEventSchema], default: [] },

    log: { type: [logEntrySchema], default: [] },

    status: { type: String, enum: ["active", "won", "lost"], default: "active" },
    outcomeReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("City", citySchema);
