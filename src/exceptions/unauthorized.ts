import { HttpExceptions } from "./root";

export class UnauthorizedException extends HttpExceptions {
  constructor(message: string, errorCode: number, errors?: any) {
    super(message, errorCode, 404, errors);
  }
}
