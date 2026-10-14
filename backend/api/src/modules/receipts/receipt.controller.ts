import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  generateReceipt,
  getReceiptByPaymentId,
  getReceiptByNumber,
  markReceiptPrinted,
  markReceiptEmailed,
  markReceiptSmsed,
  getPaymentReports,
  exportPaymentData,
  generateThermalReceipt,
} from "./receipt.service";

// =======================================================
// GENERATE RECEIPT
// =======================================================

export const generate =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = (req as any).validated?.body || req.body;
      
      const receipt =
        await generateReceipt(body);

      res.status(201).json({
        success: true,
        message: "Receipt generated successfully",
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET RECEIPT BY PAYMENT ID
// =======================================================

export const getByPayment =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const receipt =
        await getReceiptByPaymentId(params.paymentId);

      res.status(200).json({
        success: true,
        message: "Receipt fetched successfully",
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET RECEIPT BY NUMBER
// =======================================================

export const getByNumber =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const receipt =
        await getReceiptByNumber(params.receiptNumber);

      res.status(200).json({
        success: true,
        message: "Receipt fetched successfully",
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET THERMAL RECEIPT TEXT
// =======================================================

export const getThermalReceiptText =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const text =
        await generateThermalReceipt(params.id);

      res.status(200).type('text/plain').send(text);
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// MARK RECEIPT AS PRINTED
// =======================================================

export const markPrinted =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const receipt =
        await markReceiptPrinted(params.id);

      res.status(200).json({
        success: true,
        message: "Receipt marked as printed",
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// MARK RECEIPT AS EMAILED
// =======================================================

export const markEmailed =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const receipt =
        await markReceiptEmailed(params.id);

      res.status(200).json({
        success: true,
        message: "Receipt marked as emailed",
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// MARK RECEIPT AS SMS SENT
// =======================================================

export const markSmsed =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = (req as any).validated?.params || req.params;
      
      const receipt =
        await markReceiptSmsed(params.id);

      res.status(200).json({
        success: true,
        message: "Receipt marked as SMS sent",
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// GET PAYMENT REPORTS
// =======================================================

export const reports =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const query = (req as any).validated?.query || req.query;

      const result =
        await getPaymentReports({
          reportType: query.reportType,
          startDate: query.startDate,
          endDate: query.endDate,
          method: query.method,
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 20,
        });

      res.status(200).json({
        success: true,
        message: "Payment reports fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// =======================================================
// EXPORT PAYMENT DATA
// =======================================================

export const exportData =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const query = (req as any).validated?.query || req.query;

      const result =
        await exportPaymentData({
          format: query.format,
          startDate: query.startDate,
          endDate: query.endDate,
          method: query.method,
          status: query.status,
        });

      res.status(200).json({
        success: true,
        message: "Payment data exported successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };