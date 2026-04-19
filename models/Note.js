import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  tags: { type: [String], default: [] },
  color: { type: String, default: "white" },
  pinned: { type: Boolean, default: false },
  priority: { type: String, enum: ["low", "medium", "high"], default: "low" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ removed pre hook entirely — updatedAt is handled in the PUT route directly
delete mongoose.models.Note; // ✅ clears stale cached model
export default mongoose.model("Note", NoteSchema);