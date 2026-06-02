// Application error classes and API error code mapping.
import type { ApiErrorCode } from "@supportai/shared";

export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;

  public constructor(code: ApiErrorCode, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  public constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class AuthError extends AppError {
  public constructor(message = "Authentication is required.") {
    super("AUTHENTICATION_REQUIRED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  public constructor(message = "You do not have permission to access this resource.") {
    super("AUTHORIZATION_FAILED", message, 403);
  }
}

export class NotFoundError extends AppError {
  public constructor(message = "The requested resource was not found.") {
    super("RESOURCE_NOT_FOUND", message, 404);
  }
}
