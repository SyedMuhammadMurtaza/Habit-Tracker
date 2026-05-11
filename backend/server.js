const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 10000 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

const BrainSchema = new mongoose.Schema({
  userId: { type: String, default: "default", unique: true },

  // core habits
  morningHabits: { type: [String], default: ["Cold Shower", "Daily Journal", "Gym", "Yoga"] },
  eveningHabits: { type: [String], default: ["Read", "Study", "Wash Face"] },
  nightHabits:   { type: [String], default: ["Meditate", "Plan Tomorrow", "Sleep by 11pm"] },
  habitData:     { type: mongoose.Schema.Types.Mixed, default: {} },

  // todos + priorities
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

  // workout tab
  workoutHabits:      { type: [String], default: ["Warm Up", "Cardio", "Strength Training", "Cool Down", "Protein Intake"] },
  workoutHabitData:   { type: mongoose.Schema.Types.Mixed, default: {} },
  workoutPriorities:  { type: [String], default: ["Train 5 days a week", "Track calories", "Sleep 8 hours"] },

  // skincare tab
  skincareHabits:     { type: [String], default: ["Cleanser", "Toner", "Moisturizer", "Sunscreen", "Eye Cream"] },
  skincareHabitData:  { type: mongoose.Schema.Types.Mixed, default: {} },
  skincarePriorities: { type: [String], default: ["No touching face", "Change pillowcase weekly", "Stay hydrated"] },

  // diet tab
  dietHabits:         { type: [String], default: ["Breakfast", "Lunch", "Dinner", "2L Water", "No Junk Food"] },
  dietHabitData:      { type: mongoose.Schema.Types.Mixed, default: {} },
  dietPriorities:     { type: [String], default: ["Eat whole foods", "No sugar after 6pm", "Meal prep Sunday"] },

}, { timestamps: true });

const Brain = mongoose.model("Brain", BrainSchema);

app.get("/api/brain/:userId", async (req, res) => {
  try {
    let doc = await Brain.findOne({ userId: req.params.userId });
    if (!doc) doc = await Brain.create({ userId: req.params.userId });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/brain/:userId", async (req, res) => {
  try {
    const doc = await Brain.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
