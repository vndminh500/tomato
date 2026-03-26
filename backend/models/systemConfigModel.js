import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: "" }
  },
  { timestamps: true }
);

const systemConfigModel =
  mongoose.models.system_config || mongoose.model("system_config", systemConfigSchema);

export default systemConfigModel;
