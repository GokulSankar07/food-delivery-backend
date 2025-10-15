const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/** ---------------- Partner Schema ---------------- **/
const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    vehicleNumber: { type: String },
    address: { type: String },
  },
  { collection: "partners", timestamps: true }
);

// Hash password before saving
partnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Fix OverwriteModelError
const DeliveryPartner = mongoose.models.DeliveryPartner || mongoose.model("DeliveryPartner", partnerSchema);

module.exports = DeliveryPartner;
