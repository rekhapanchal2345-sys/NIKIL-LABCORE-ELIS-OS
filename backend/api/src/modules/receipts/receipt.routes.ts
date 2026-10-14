import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { validate } from "../../../middleware/validate.middleware";
import { getByNumber, getThermalReceiptText } from "./receipt.controller";
import { receiptIdSchema, receiptNumberSchema } from "./receipt.validation";

const router = Router();

// Require authentication for receipt endpoints
router.use(authenticate);

// Get structured JSON receipt (A4 format data)
router.get("/:receiptNumber", validate({ params: receiptNumberSchema }), getByNumber);

// Get plain text ESC/POS thermal receipt string for the specified order
router.get("/order/:id/text", validate({ params: receiptIdSchema }), getThermalReceiptText);

export default router;
