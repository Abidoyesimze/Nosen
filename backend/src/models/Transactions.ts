import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  employer_id: mongoose.Types.ObjectId;
  employee_id?: mongoose.Types.ObjectId;
  employer_email: string;
  employee_email?: string;
  employer_wallet: string;
  employee_wallet: string;
  amount: string;
  token_symbol: string;
  tx_hash?: string;
  network: string;
  status: "pending" | "success" | "failed";
  payment_type: "batch" | "instant";
  batch_id?: string;
  contract_id?: string;
  automation: boolean;
  timestamp: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema({
  employer_id: { type: Schema.Types.ObjectId, ref: "Employer", required: true },
  employee_id: { type: Schema.Types.ObjectId, ref: "Employee" },
  employer_email: { type: String, required: true },
  employee_email: { type: String },
  employer_wallet: { type: String, required: true },
  employee_wallet: { type: String, required: true },
  amount: { type: String, required: true },
  token_symbol: { type: String, default: "USDC" },
  tx_hash: { type: String, unique: true, sparse: true },
  network: { type: String, default: "Flare" },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  payment_type: { type: String, enum: ["batch", "instant"], required: true },
  batch_id: { type: String },
  contract_id: { type: String },
  automation: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
