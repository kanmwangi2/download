
import {
  camelToSnakeCase,
  snakeToCamelCase,
  objectToSnakeCase,
  objectToCamelCase,
} from '../case-conversion';

describe('Case Conversion Utilities', () => {
  // Test camelToSnakeCase
  test('camelToSnakeCase should convert a camelCase string to snake_case', () => {
    expect(camelToSnakeCase('helloWorld')).toBe('hello_world');
    expect(camelToSnakeCase('aSimpleTest')).toBe('a_simple_test');
    expect(camelToSnakeCase('edgeCaseURL')).toBe('edge_case_url');
  });

  // Test snakeToCamelCase
  test('snakeToCamelCase should convert a snake_case string to camelCase', () => {
    expect(snakeToCamelCase('hello_world')).toBe('helloWorld');
    expect(snakeToCamelCase('a_simple_test')).toBe('aSimpleTest');
    expect(snakeToCamelCase('__leading_underscore')).toBe('_LeadingUnderscore');
  });

  // Test objectToSnakeCase
  test('objectToSnakeCase should recursively convert object keys to snake_case', () => {
    const camelCaseObject = {
      userName: 'testUser',
      userDetails: {
        firstName: 'John',
        lastName: 'Doe',
      },
      userRoles: ['admin', 'editor'],
    };

    const snakeCaseObject = {
      user_name: 'testUser',
      user_details: {
        first_name: 'John',
        last_name: 'Doe',
      },
      user_roles: ['admin', 'editor'],
    };

    expect(objectToSnakeCase(camelCaseObject)).toEqual(snakeCaseObject);
  });

  // Test objectToCamelCase
  test('objectToCamelCase should recursively convert object keys to camelCase', () => {
    const snakeCaseObject = {
      user_name: 'testUser',
      user_details: {
        first_name: 'John',
        last_name: 'Doe',
      },
      user_roles: ['admin', 'editor'],
    };

    const camelCaseObject = {
      userName: 'testUser',
      userDetails: {
        firstName: 'John',
        lastName: 'Doe',
      },
      userRoles: ['admin', 'editor'],
    };

    expect(objectToCamelCase(snakeCaseObject)).toEqual(camelCaseObject);
  });
});
