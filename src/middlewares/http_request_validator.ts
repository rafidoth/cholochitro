import { logger } from "@/utils/logger";
import type { NextFunction, Request, Response } from "express";
import { ZodObject, ZodError } from "zod";

type Schema = ZodObject<any>;
type ParamsRecord = Record<string, string>;
type QueryRecord = Record<string, unknown>;

export interface RequestValidationSchemas {
    body?: Schema;
    params?: Schema;
    query?: Schema;
}

const formatedError = (error: ZodError) =>
    error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
    }));

export const validateRequest = (schemas: RequestValidationSchemas) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                const parsedBody = schemas.body.parse(req.body) as unknown;
                req.body = parsedBody;
            }

            if (schemas.params) {
                const parsedParams = schemas.params.parse(req.params) as ParamsRecord;
                req.params = parsedParams as Request["params"];
            }

            if (schemas.query) {
                const parsedQuery = schemas.query.parse(req.query) as QueryRecord;
                req.query = parsedQuery as Request["query"];
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.error({
                    error,
                    route: req.path
                }, "Request Validation Error")
                res.status(422).json({
                    message: "Validation Error"
                })
                return;
            }

            next(error);
        }
    };
};
