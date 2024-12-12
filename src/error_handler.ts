import { NextFunction, Request, Response } from "express";
import { ErrorCode, HttpExceptions } from "./exceptions/root";
import { InternalException } from "./exceptions/internal_exception";
import { ZodError } from "zod";
import { BadRequestException } from "./exceptions/bad_request";

export const errorHandler = (method: Function): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await method(req, res, next);
    } catch (error: any) {
      let exception: HttpExceptions;
      if (error instanceof HttpExceptions) {
        exception = error;
      } else {
        if (error instanceof ZodError) {
          exception = new BadRequestException(
            "Unproccessable entity",
            ErrorCode.UNPROCESSABLE_ENTITY,
            error.errors
          );
        } else {
          exception = new InternalException(
            "Something went wrong!",
            error,
            ErrorCode.INTERNAL_EXCEPTION
          );
        }
      }
      next(exception);
    }
  };
};
