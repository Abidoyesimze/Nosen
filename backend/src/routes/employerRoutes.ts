import express, { Request, Response } from "express";
import Employer from "../models/Employer";
import { success, failure } from "../utils/response";

const router = express.Router();


router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { company_name, email, country, privy_user_id, wallet_address } = req.body;

    if (!company_name || !email || !country) {
      return failure(res, "company_name, email and country are required");
    }

    const existing = await Employer.findOne({ email });
    if (existing) {
      return failure(res, "Employer already exists");
    }

    const employer = await Employer.create({
      company_name,
      email,
      country,
      privy_user_id,
      wallet_address,
    });

    return success(res, employer, "Employer registered successfully");
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
});

export default router;
