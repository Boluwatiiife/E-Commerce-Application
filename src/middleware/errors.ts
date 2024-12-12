import { HttpExceptions } from "../exceptions/root";
import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  error: HttpExceptions,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
    errors: error.errors,
  });
};
