import { ArkErrors, type } from "arktype";
import { Err, Ok } from "ts-handling";

type ErrorType = ReturnType<typeof Err<string>>;
type ExcludeError<T> = T extends ErrorType ? never : T;
type Validated<T> = { [K in keyof T]: ExcludeError<T[K]> };

const ErrorType = type({
  ok: "false",
  error: "string",
});

const validate = <T>(value: T | ArkErrors, name: string) =>
  value instanceof ArkErrors ? Err(`${name} ${value.summary}`) : value;

const validateAll = <T extends unknown[]>(validations: [...T]) => {
  for (const validation of validations) {
    const error = ErrorType(validation);
    if (error instanceof type.errors) continue;
    return Err(error.error);
  }

  return Ok(validations as Validated<T>);
};

export { validate, validateAll };
