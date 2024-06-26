import { Request, Response, NextFunction } from "express";
import { CustomError } from "./customError";
import { CustomRequest } from "../interface/customRequest.interface";

export const roleBased =
  (roles: string) =>
  (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!roles.includes(req.user.role))
        throw new CustomError("Not authorized !!!", 403);
      next();
    } catch (error) {
      next(error);
    }
  };
