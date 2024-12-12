import { ErrorCode, HttpExceptions } from "./root";

export class BadRequestException extends HttpExceptions {
  constructor(message: string, errorCode: ErrorCode, errors?: any) {
    super(message, errorCode, 400, errors);
  }
}
