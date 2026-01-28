import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function ExpiryDate(
  monthProperty: string,
  yearProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ExpiryDate',
      target: object.constructor,
      propertyName,
      constraints: [monthProperty, yearProperty],
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const [monthProp, yearProp] = args.constraints as [string, string];
          const obj = args.object as Record<string, unknown>;
          const month = obj[monthProp];
          const year = obj[yearProp];

          if (!Number.isInteger(month) || !Number.isInteger(year)) {
            return false;
          }
          if ((month as number) < 1 || (month as number) > 12) {
            return false;
          }

          const fullYear =
            (year as number) < 100 ? 2000 + (year as number) : (year as number);
          const now = new Date();
          const expiry = new Date(fullYear, month as number, 0, 23, 59, 59);
          return expiry >= now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is expired`;
        },
      },
    });
  };
}
