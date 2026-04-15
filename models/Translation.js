// models/Translation.js
import mongoose from "mongoose";

const TranslationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inputText: String,
  fromLang: String,
  toLang: String,
  outputText: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Translation ||
  mongoose.model("Translation", TranslationSchema);