export type Result<TValue, TError = AppError> = Success<TValue> | Failure<TError>;

export interface Success<TValue> {
  success: true;
  value: TValue;
}

export interface Failure<TError> {
  success: false;
  error: TError;
}

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
}

export const success = <TValue>(value: TValue): Success<TValue> => ({
  success: true,
  value,
});

export const failure = <TError>(error: TError): Failure<TError> => ({
  success: false,
  error,
});

export const isSuccess = <TValue, TError>(result: Result<TValue, TError>): result is Success<TValue> =>
  result.success;

export const isFailure = <TValue, TError>(result: Result<TValue, TError>): result is Failure<TError> =>
  !result.success;

