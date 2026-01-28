import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

function isValidLuhn(value: string): boolean {
  const digits = value.replace(/\s+/g, '');
  if (!/^\d{12,19}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function LuhnCheck(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'LuhnCheck',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidLuhn(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is not a valid card number`;
        },
      },
    });
  };
}
