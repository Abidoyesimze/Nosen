import mongoose, { Schema, Document } from "mongoose";

export interface IBatch extends Document {
  batch_id: string;
  employer_id: mongoose.Types.ObjectId;
  title: string;
  total_amount: string;
  total_employees: number;
  period: string;
  status: "draft" | "pending" | "completed";
  created_at: Date;
  type : "monthly" | "instant";
}

const BatchSchema: Schema<IBatch> = new Schema({
  batch_id: { type: String, required: true, unique: true },
  employer_id: { type: Schema.Types.ObjectId, ref: "Employer", required: true },
  title: { type: String, default: "Monthly Payroll" },
  total_amount: { type: String },
  total_employees: { type: Number },
  period: { type: String },
  status: { type: String, enum: ["draft", "pending", "completed"], default: "pending" },
  created_at: { type: Date, default: Date.now },
  type: {type: String}
});

export default mongoose.model<IBatch>("Batch", BatchSchema);
