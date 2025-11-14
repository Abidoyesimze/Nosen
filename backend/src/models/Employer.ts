import mongoose, { Schema, Document } from "mongoose";

export interface IEmployer extends Document {
  company_name: string;
  email: string;
  country: string;
  wallet_address: string;
  employees: mongoose.Types.ObjectId[];      
  transactions: mongoose.Types.ObjectId[]; 
  created_at: Date;
}

const EmployerSchema: Schema<IEmployer> = new Schema({
  company_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  wallet_address: { type: String, unique: true },
  employees: [{ type: Schema.Types.ObjectId, ref: "Employee", default: [] }],
  transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction", default: [] }],

  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IEmployer>("Employer", EmployerSchema);
