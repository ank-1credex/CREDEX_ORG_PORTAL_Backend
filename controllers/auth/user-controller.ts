import Jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { db } from "../../db/db";
import { configVariable } from "../../config/env.config";
import { CustomError } from "../../utility/customError";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const isUserExist = await db.user.findOne({
      where: { email: payload.email },
    });
    if (!isUserExist) {
      throw new CustomError("user does not exist", 404);
    }
    const hashedPassword = await bcrypt.compare(
      payload.password,
      isUserExist.password
    );
    if (!hashedPassword) throw new CustomError("wrong password", 401);

    const roles = await db.role.findOne({ where: { id: isUserExist.RoleId } });
    const token = {
      email: isUserExist.dataValues.email,
      name: `${isUserExist.dataValues.first_name} ${isUserExist.dataValues.last_name}`,
      id: isUserExist.id,
      role: roles.dataValues.role,
      date: Date.now(),
    };
    
    const accessToken = Jwt.sign(token, configVariable.secret_key, {
      expiresIn: "50m",
    });
    const data = {
      name: `${isUserExist.dataValues.first_name} ${isUserExist.dataValues.last_name}`,
      email: payload.email,
      id: isUserExist.id,
      data: Date.now(),
      role: roles.dataValues.role,
    };

    res.cookie("token", accessToken, {
      httpOnly: false,
      secure: false,
    });

    return res.status(200).json({
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const checkEmailAlreadyExist = await db.user.findOne({
      where: { email: payload.email },
    });
    if (checkEmailAlreadyExist) {
      throw new CustomError("user alreday Registered !, please login", 409);
    }
    let roles = await db.role.findOne({
      where: { role: "employee" },
    });
    if (!roles) {
      roles = await db.role.create();
    }
    let manager = await db.manager.findOne({
      where: { manager_name: payload.managerName },
    });

    if (!manager) {
      manager = await db.manager.create({
        manager_name: payload.managerName,
      });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const obj = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: passwordHash,
      RoleId: roles.id,
      ManagerId: manager.id,
      employee_id: payload.employeeId,
    };
    const data = await db.user.create(obj);
    return res.status(201).json({
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

export const getManagers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managersList = await db.manager.findAll();
    if (!managersList) {
      return res.status(204).json({ message: "no data found" });
    }
    res.status(200).json({
      data: managersList,
    });
  } catch (err) {
    next(err);
  }
};
