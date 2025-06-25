import { camelCase, snakeCase } from 'lodash';

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[camelCase(key)] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[snakeCase(key)] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export const caseConverter = {
  toCamelCase,
  toSnakeCase,
};
