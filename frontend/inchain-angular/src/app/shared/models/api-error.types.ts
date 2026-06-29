export type ApiValidationErrors = Record<string, string[]>;

export type ApiErrorBody = {
  code?: string;
  message?: string;
  [key: string]: unknown;
};

export type ApiError = {
  statusCode: number;
  message: string;
  validationErrors?: ApiValidationErrors;
};
