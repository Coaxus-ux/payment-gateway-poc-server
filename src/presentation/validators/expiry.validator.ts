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
          const [monthProp, yearProp] = args.constraints;
          const month = (args.object as any)[monthProp];
          const year = (args.object as any)[yearProp];

          if (!Number.isInteger(month) || !Number.isInteger(year)) {
            return false;
          }
          if (month < 1 || month > 12) {
            return false;
          }

          const fullYear = year < 100 ? 2000 + year : year;
          const now = new Date();
          const expiry = new Date(fullYear, month, 0, 23, 59, 59);
          return expiry >= now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is expired`;
        },
      },
    });
  };
}
