import { ValidatorType, IValidator, ValidatedValue } from '../interfaces/validation';

export const VALIDATORS = {
  INTEGER: <IValidator>{
    type: ValidatorType.integer
  },
  INTEGER_UNLIMITED: <IValidator>{
    type: ValidatorType.integerUnlimited
  },
  BOOLEAN: <IValidator>{
    type: ValidatorType.boolean
  },
  ITERATOR_CALLBACK: <IValidator>{
    type: ValidatorType.iteratorCallback
  },
};

const getNumber = (value: any): number =>
  value === '' || value === null ? NaN : Number(value);

export const validateOne = (
  { value, isValid, errors }: ValidatedValue,
  { type, params }: IValidator
): ValidatedValue => {
  let parsedValue = value;
  let error = '';

  if (type === ValidatorType.integer) {
    value = getNumber(value);
    parsedValue = parseInt(value, 10);
    if (value !== parsedValue) {
      error = 'it must be an integer';
    }
  }

  if (type === ValidatorType.integerUnlimited) {
    value = getNumber(value);
    if (value === Infinity || value === -Infinity) {
      parsedValue = value;
    } else {
      parsedValue = parseInt(value, 10);
    }
    if (value !== parsedValue) {
      error = 'it must be an integer or +/- Infinity';
    }
  }

  if (type === ValidatorType.iteratorCallback) {
    if (typeof value !== 'function') {
      error = 'it must be an iterator callback function';
    }
    if ((<Function>value).length !== 1) {
      error = 'it must have 1 argument';
    }
    parsedValue = value;
  }

  if (type === ValidatorType.boolean) {
    parsedValue = !!value;
  }

  return {
    value: parsedValue,
    isValid: isValid && !error,
    errors: [...errors, ...(error ? [error] : [])]
  };
};

export const validate = (value: any, validators: IValidator[]): ValidatedValue =>
  validators.reduce((acc, validator) => ({
    ...acc,
    ...validateOne(acc, validator)
  }), <ValidatedValue>{
    value,
    isValid: true,
    errors: []
  });
