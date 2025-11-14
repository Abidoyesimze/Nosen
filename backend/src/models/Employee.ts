import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  employer_id: mongoose.Types.ObjectId;
  full_name: string;
  email: string;
  wallet_address: string;
  salary: string;
  currency: string;
  created_at: Date;
}

const EmployeeSchema: Schema<IEmployee> = new Schema({
  employer_id: { type: Schema.Types.ObjectId, ref: "Employer", required: true },
  full_name: { type: String },
  email: { type: String, required: true, unique: true },
  wallet_address: { type: String },
  salary: { type: String },
  currency: { type: String, default: "USDC" },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
