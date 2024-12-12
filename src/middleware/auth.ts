import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secret";
import { prismaClient } from "..";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. extract the token from header
  const token = req.headers.authorization;

  // 2. if token is not present, throw an error of unauthorized
  if (!token) {
    next(new UnauthorizedException("Unauthorized!", ErrorCode.UNAUTHORIZED));
  }
  try {
    // 3. if token is present, verify the token and extract the payload
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // 4. get the user from the payload
    const user = await prismaClient.user.findFirst({
      where: { id: payload.userId },
    });
    if (!user) {
      next(new UnauthorizedException("Unauthorized!", ErrorCode.UNAUTHORIZED));
    }

    // 5. attach the user to the current request object
    req.user = user;
    next();
  } catch (error) {
    next(new UnauthorizedException("Unauthorized!", ErrorCode.UNAUTHORIZED));
  }
};

export default authMiddleware;
