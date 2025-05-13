import { NextResponse } from "next/server"
import { createLogger, ErrorCodes } from "./logger"

// Create a module-specific logger
const logger = createLogger("API")

/**
 * Wrapper for API route handlers with enhanced error logging
 * @param handler The API route handler function
 * @param routeName The name of the API route for logging
 * @returns A wrapped handler function with error handling
 */
export function withErrorLogging(handler: (req: Request, params?: any) => Promise<Response>, routeName: string) {
  return async (req: Request, params?: any) => {
    const routeLogger = createLogger(`API:${routeName}`)
    const startTime = Date.now()

    routeLogger.info("Request received", {
      context: {
        method: req.method,
        url: req.url,
        params,
      },
    })

    try {
      const response = await handler(req, params)

      const endTime = Date.now()
      const duration = endTime - startTime

      routeLogger.info("Request completed successfully", {
        context: {
          method: req.method,
          url: req.url,
          status: response.status,
          duration: `${duration}ms`,
        },
      })

      return response
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Determine error code based on error type
      let errorCode = ErrorCodes.SYSTEM.UNEXPECTED_ERROR
      let statusCode = 500

      if (error.name === "ValidationError") {
        errorCode = ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION
        statusCode = 400
      } else if (error.name === "NotFoundError") {
        errorCode = ErrorCodes.API.NOT_FOUND
        statusCode = 404
      } else if (error.name === "UnauthorizedError") {
        errorCode = ErrorCodes.AUTH.UNAUTHORIZED
        statusCode = 401
      } else if (error.name === "ForbiddenError") {
        errorCode = ErrorCodes.AUTH.PERMISSION_DENIED
        statusCode = 403
      }

      routeLogger.error("Request failed with error", {
        code: errorCode,
        details: error,
        context: {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: error.message || "An unexpected error occurred",
          },
        },
        { status: statusCode },
      )
    }
  }
}

/**
 * Wrapper for API route handlers with enhanced error logging and validation
 * @param handler The API route handler function
 * @param routeName The name of the API route for logging
 * @param validator Optional validation function for request data
 * @returns A wrapped handler function with error handling and validation
 */
export function createApiHandler(
  handler: (req: Request, data: any, params?: any) => Promise<Response>,
  routeName: string,
  validator?: (data: any) => { valid: boolean; errors?: any },
) {
  return async (req: Request, params?: any) => {
    const routeLogger = createLogger(`API:${routeName}`)
    const startTime = Date.now()

    routeLogger.info("Request received", {
      context: {
        method: req.method,
        url: req.url,
        params,
      },
    })

    try {
      // Parse request body if it exists
      let data = {}
      if (req.method !== "GET" && req.headers.get("content-type")?.includes("application/json")) {
        try {
          data = await req.json()
          routeLogger.debug("Request body parsed", {
            context: { data },
          })
        } catch (error) {
          routeLogger.error("Failed to parse request body", {
            code: ErrorCodes.VALIDATION.INVALID_FORMAT,
            details: error,
          })

          return NextResponse.json(
            {
              success: false,
              error: {
                code: ErrorCodes.VALIDATION.INVALID_FORMAT,
                message: "Invalid JSON in request body",
              },
            },
            { status: 400 },
          )
        }
      }

      // Validate request data if validator is provided
      if (validator) {
        const validation = validator(data)
        if (!validation.valid) {
          routeLogger.warning("Request validation failed", {
            code: ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION,
            context: {
              errors: validation.errors,
              data,
            },
          })

          return NextResponse.json(
            {
              success: false,
              error: {
                code: ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION,
                message: "Validation failed",
                details: validation.errors,
              },
            },
            { status: 400 },
          )
        }
      }

      // Call the handler with the parsed and validated data
      const response = await handler(req, data, params)

      const endTime = Date.now()
      const duration = endTime - startTime

      routeLogger.info("Request completed successfully", {
        context: {
          method: req.method,
          url: req.url,
          status: response.status,
          duration: `${duration}ms`,
        },
      })

      return response
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Determine error code based on error type
      let errorCode = ErrorCodes.SYSTEM.UNEXPECTED_ERROR
      let statusCode = 500

      if (error.name === "ValidationError") {
        errorCode = ErrorCodes.VALIDATION.CONSTRAINT_VIOLATION
        statusCode = 400
      } else if (error.name === "NotFoundError") {
        errorCode = ErrorCodes.API.NOT_FOUND
        statusCode = 404
      } else if (error.name === "UnauthorizedError") {
        errorCode = ErrorCodes.AUTH.UNAUTHORIZED
        statusCode = 401
      } else if (error.name === "ForbiddenError") {
        errorCode = ErrorCodes.AUTH.PERMISSION_DENIED
        statusCode = 403
      }

      routeLogger.error("Request failed with error", {
        code: errorCode,
        details: error,
        context: {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: error.message || "An unexpected error occurred",
          },
        },
        { status: statusCode },
      )
    }
  }
}

export default {
  withErrorLogging,
  createApiHandler,
}
