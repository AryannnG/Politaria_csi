const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema({
  population: { type: Number, default: 10000, min: 0 },
  treasury: { type: Number, default: 50000 },
  economy: { type: Number, default: 50, min: 0, max: 100 },
  healthcare: { type: Number, default: 50, min: 0, max: 100 },
  education: { type: Number, default: 50, min: 0, max: 100 },
  infrastructure: { type: Number, default: 50, min: 0, max: 100 },
  environment: { type: Number, default: 50, min: 0, max: 100 },
  governance: { type: Number, default: 50, min: 0, max: 100 },
  approval: { type: Number, default: 50, min: 0, max: 100 },
}, { _id: false });

const buildingInstanceSchema = new mongoose.Schema({ buildingId: { type: String, required: true }, builtOnMonth: { type: Number, required: true }, constructionEndsOnMonth: { type: Number, default: 0 }, level: { type: Number, default: 1, min: 1, max: 5 } }, { _id: false });
const activePolicySchema = new mongoose.Schema({ policyId: { type: String, required: true }, enactedOnMonth: { type: Number, required: true } }, { _id: false });
const missionProgressSchema = new mongoose.Schema({
  missionId: { type: String, required: true },
  status: { type: String, enum: ["active", "completed", "failed"], default: "active" },
  startedOnMonth: { type: Number, required: true },
  // Keep legacy saves valid; updateMissions backfills active missions.
  deadlineMonth: { type: Number },
  completedOnMonth: { type: Number, default: null },
  current: { type: Number, default: 0 },
  target: { type: Number, default: 0 },
  startValue: { type: Number },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  challengeTier: { type: Number, default: 0, min: 0 },
  reward: { type: mongoose.Schema.Types.Mixed, default: {} },
  rewardGranted: { type: Boolean, default: false },
}, { _id: false });
const pendingEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true }, title: { type: String, required: true }, description: { type: String, required: true },
  category: { type: String, default: "City crisis" }, icon: { type: String, default: "⚠" }, severity: { type: String, default: "crisis" }, visualType: { type: String, default: "infrastructure" },
  choices: [{ id: { type: String, required: true }, label: { type: String, required: true } }],
  difficultyScale: { type: Number, default: 1, min: 1 },
  triggeredOnMonth: { type: Number, required: true },
}, { _id: false });
const mapEffectSchema = new mongoose.Schema({ eventId: String, visualType: String, title: String, startedOnMonth: Number, endsOnMonth: Number, intensity: { type: Number, default: 1 } }, { _id: false });
const seenEventSchema = new mongoose.Schema({ eventId: String, lastOccurredOnMonth: Number }, { _id: false });
const scheduledEventSchema = new mongoose.Schema({ eventId: String, dueMonth: Number, sourceEventId: String }, { _id: false });
const logEntrySchema = new mongoose.Schema({ month: { type: Number, required: true }, type: { type: String, required: true }, message: { type: String, required: true }, data: { type: mongoose.Schema.Types.Mixed, default: {} } }, { _id: false });
const milestoneRewardSchema = new mongoose.Schema({ month: { type: Number, required: true }, treasury: { type: Number, required: true } }, { _id: false });

const citySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, mayor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, default: 0 }, taxRate: { type: Number, default: 10, min: 0, max: 40 },
  difficulty: { type: String, enum: ["easy", "normal", "hard"], default: "normal" },
  stats: { type: statsSchema, default: () => ({}) },
  buildings: { type: [buildingInstanceSchema], default: [] }, activePolicies: { type: [activePolicySchema], default: [] },
  missions: { type: [missionProgressSchema], default: [] }, pendingEvents: { type: [pendingEventSchema], default: [] },
  milestoneRewards: { type: [milestoneRewardSchema], default: [] },
  mapEffects: { type: [mapEffectSchema], default: [] }, seenEvents: { type: [seenEventSchema], default: [] }, scheduledEvents: { type: [scheduledEventSchema], default: [] },
  warnings: { type: [String], default: [] },
  status: { type: String, enum: ["active", "won", "lost"], default: "active" }, outcomeReason: { type: String, default: null }, outcome: { type: mongoose.Schema.Types.Mixed, default: null },
  log: { type: [logEntrySchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("City", citySchema);
