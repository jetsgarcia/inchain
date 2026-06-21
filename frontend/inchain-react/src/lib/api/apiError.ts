import axios from "axios";

export type ApiValidationErrors = Record<string, string[]>;

export type ApiError = {
  statusCode?: number;
  message: string;
  validationErrors?: ApiValidationErrors;
  originalError?: unknown;
};

type ErrorResponseBody = {
  errors?: unknown;
  message?: unknown;
  title?: unknown;
  detail?: unknown;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toErrorResponseBody(value: unknown): ErrorResponseBody | undefined {
  return isRecord(value) ? value : undefined;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function normalizeValidationErrors(errors: unknown): ApiValidationErrors | undefined {
  if (!isRecord(errors)) {
    return undefined;
  }

  const validationErrors = Object.entries(errors).reduce<ApiValidationErrors>(
    (result, [field, messages]) => {
      if (Array.isArray(messages)) {
        const normalizedMessages = messages
          .filter((message): message is string => typeof message === "string")
          .filter((message) => message.trim().length > 0);

        if (normalizedMessages.length > 0) {
          result[field] = normalizedMessages;
        }

        return result;
      }

      const message = getStringValue(messages);

      if (message) {
        result[field] = [message];
      }

      return result;
    },
    {},
  );

  return Object.keys(validationErrors).length > 0 ? validationErrors : undefined;
}

function normalizeBusinessErrorMessage(errors: unknown): string | undefined {
  if (!Array.isArray(errors)) {
    return undefined;
  }

  const descriptions = errors
    .map((error) => {
      if (!isRecord(error)) {
        return undefined;
      }

      return getStringValue(error.description) ?? getStringValue(error.code);
    })
    .filter((message): message is string => Boolean(message));

  return descriptions.length > 0 ? descriptions.join("\n") : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
      originalError: error,
    };
  }

  const responseData = error.response?.data;
  const responseBody = toErrorResponseBody(responseData);
  const statusCode = error.response?.status;
  const message =
    normalizeBusinessErrorMessage(responseData) ??
    getStringValue(responseBody?.message) ??
    getStringValue(responseBody?.detail) ??
    getStringValue(responseBody?.title) ??
    error.message ??
    "Something went wrong.";

  return {
    statusCode,
    message,
    validationErrors: normalizeValidationErrors(responseBody?.errors),
    originalError: error,
  };
}

export function isApiError(error: unknown): error is ApiError {
  return isRecord(error) && typeof error.message === "string";
}