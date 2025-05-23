const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
    profilePic: { type: String },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
    avatarUrl: { type: String },
    avatarDesc: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },

    // 🔔 Token FCM para notificaciones push
    fcmTokens: {
  type: [String],
  default: [],
},
  },
  { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
