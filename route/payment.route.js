import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from "../controllers/payment.controller.js";

const paymentRouter = Router();

// Razorpay endpoints
paymentRouter.post(
  "/razorpay/create",
  auth,
  createRazorpayOrderController
);

paymentRouter.post(
  "/razorpay/verify",
  auth,
  verifyRazorpayPaymentController
);

export default paymentRouter;
