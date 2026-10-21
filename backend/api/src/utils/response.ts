import { Response } from "express";

export const successResponse = <T>(
  res: Response,
  data: T,
  message = "Request successful",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

export const createdResponse = <T>(
  res: Response,
  data: T,
  message = "Created successfully"
) => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Request successful",
  statusCode = 200
) => {
  return successResponse(res, data, message, statusCode);
};

export const sendError = errorResponse;