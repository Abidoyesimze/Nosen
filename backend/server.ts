import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db";
import employerRoutes from "./src/routes/employerRoutes";
import employeeRoutes from "./src/routes/employeeRoutes";




dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

app.get("/", (_, res) => res.send("💰 Payroll API running (TypeScript)..."));
app.use("/api/employer", employerRoutes);
app.use("/api/employee", employeeRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
