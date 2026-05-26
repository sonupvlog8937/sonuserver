import Razorpay from "razorpay";
import crypto from "crypto";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const createRazorpayOrderController = async (request, response) => {
  try {
    const { amount, currency = "INR", description, productNames, userId } =
      request.body;

    console.log("Creating Razorpay order:", { amount, currency, userId });

    if (!amount || amount <= 0) {
      console.error("Invalid amount:", amount);
      return response.status(400).json({
        error: true,
        message: "Invalid amount",
      });
    }

    if (!razorpayInstance.key_id || !razorpayInstance.key_secret) {
      console.error("Razorpay credentials missing:", {
        hasKeyId: !!razorpayInstance.key_id,
        hasKeySecret: !!razorpayInstance.key_secret,
      });
      return response.status(500).json({
        error: true,
        message: "Razorpay credentials not configured",
      });
    }

    // Amount should be in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    // Generate receipt ID - MUST be under 40 characters!
    // Format: ORD + last 10 digits of timestamp = 13 characters total
    const receiptId = `ORD${Date.now().toString().slice(-10)}`;

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receiptId,
      notes: {
        description,
        productNames,
        userId,
      },
    };

    console.log("Creating Razorpay order with options:", options);

    const order = await razorpayInstance.orders.create(options);

    console.log("✅ Razorpay order created successfully:", order.id);

    return response.status(200).json({
      error: false,
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      razorpayKeyId: razorpayInstance.key_id,
    });
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    return response.status(500).json({
      error: true,
      message: error.message || "Failed to create order",
    });
  }
};

export const verifyRazorpayPaymentController = async (request, response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = request.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return response.status(400).json({
        error: true,
        message: "Missing payment details",
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", razorpayInstance.key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return response.status(400).json({
        error: true,
        message: "Payment verification failed",
      });
    }

    console.log("✅ Payment verified successfully:", razorpay_payment_id);

    return response.status(200).json({
      error: false,
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return response.status(500).json({
      error: true,
      message: error.message || "Failed to verify payment",
    });
  }
};
