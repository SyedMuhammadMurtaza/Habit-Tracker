const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 10000 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

const BrainSchema = new mongoose.Schema({
  userId: { type: String, default: "default", unique: true },

  // ── Dashboard habits ──────────────────────────────────────────────────────
  morningHabits: { type: [String], default: ["Cold Shower", "Daily Journal", "Gym", "Yoga"] },
  eveningHabits: { type: [String], default: ["Read", "Study", "Wash Face"] },
  nightHabits:   { type: [String], default: ["Meditate", "Plan Tomorrow", "Sleep by 11pm"] },
  habitData:     { type: mongoose.Schema.Types.Mixed, default: {} },
  todos: {
    type: [{ id: Number, text: String, tag: String, done: Boolean }],
    default: [
      { id: 1, text: "Run 2.5km",              tag: "Medium", done: false },
      { id: 2, text: "Meet with Sarah",         tag: "Urgent", done: false },
      { id: 3, text: "Post on Instagram Today", tag: "Medium", done: false },
      { id: 4, text: "Start Building Website",  tag: "Medium", done: false },
      { id: 5, text: "Plan for new website",    tag: "Urgent", done: false },
    ]
  },
  priorities: { type: [String], default: ["Start on new business", "Post on social media", "Apply to new job"] },

  // ── Workout tab ───────────────────────────────────────────────────────────
  workoutMonday:    { type: [String], default: ["Push-ups 3x15", "Pull-ups 3x8", "Bench Press"] },
  workoutTuesday:   { type: [String], default: ["Squats 4x10", "Lunges 3x12", "Leg Press"] },
  workoutWednesday: { type: [String], default: ["Rest / Stretch", "Foam Roll", "Walk 20min"] },
  workoutThursday:  { type: [String], default: ["Deadlift 3x5", "Rows 3x10", "Face Pulls"] },
  workoutFriday:    { type: [String], default: ["Shoulders Press", "Lateral Raises", "Tricep Dips"] },
  workoutSaturday:  { type: [String], default: ["Cardio 30min", "Core Circuit", "Stretching"] },
  workoutHabitData: { type: mongoose.Schema.Types.Mixed, default: {} },
  workoutPriorities: { type: [String], default: ["Hit 10k steps daily", "Increase bench press weight", "Drink 3L water"] },

  // ── Skin Care tab ─────────────────────────────────────────────────────────
  skincareMonday:    { type: [String], default: ["Cleanser", "Toner", "Moisturiser", "SPF"] },
  skincareTuesday:   { type: [String], default: ["Cleanser", "Vitamin C Serum", "Moisturiser", "SPF"] },
  skincareWednesday: { type: [String], default: ["Cleanser", "Exfoliate", "Hydrating Mask", "Moisturiser"] },
  skincareThursday:  { type: [String], default: ["Cleanser", "Niacinamide", "Moisturiser", "SPF"] },
  skincareFriday:    { type: [String], default: ["Cleanser", "Retinol", "Moisturiser"] },
  skincareSaturday:  { type: [String], default: ["Deep Cleanse", "Clay Mask", "Facial Oil", "Moisturiser"] },
  skincareHabitData: { type: mongoose.Schema.Types.Mixed, default: {} },
  skincarePriorities: { type: [String], default: ["Stay consistent with SPF", "Finish current Retinol bottle", "Drink more water for skin"] },

  // ── Diet tab ──────────────────────────────────────────────────────────────
  dietMonday:    { type: [String], default: ["High Protein Breakfast", "No Sugar", "2L Water", "Vegetables"] },
  dietTuesday:   { type: [String], default: ["Meal Prep Lunch", "No Processed Food", "2L Water"] },
  dietWednesday: { type: [String], default: ["Intermittent Fast", "High Fibre Meal", "2L Water"] },
  dietThursday:  { type: [String], default: ["High Protein Breakfast", "No Junk Food", "2L Water", "Fruits"] },
  dietFriday:    { type: [String], default: ["Cheat Meal (controlled)", "2L Water", "Vegetables"] },
  dietSaturday:  { type: [String], default: ["Meal Prep Sunday", "Healthy Snacks Only", "2L Water"] },
  dietHabitData: { type: mongoose.Schema.Types.Mixed, default: {} },
  dietPriorities: { type: [String], default: ["Hit daily protein goal", "Cut out late night snacking", "Cook at home 5x a week"] },

}, { timestamps: true });

const Brain = mongoose.model("Brain", BrainSchema);

app.get("/api/brain/:userId", async (req, res) => {
  try {
    let doc = await Brain.findOne({ userId: req.params.userId });
    if (!doc) doc = await Brain.create({ userId: req.params.userId });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/brain/:userId", async (req, res) => {
  try {
    const doc = await Brain.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
