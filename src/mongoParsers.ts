import type {
  Expression,
  SingleSelectorOperator,
  TableSelectorOperator,
  MultiSelectorOperator,
  MongoCollection,
  MongoValue,
} from './mongoQueryTypes';

import {
  isExpression,
  isMultiSelectorOperator,
  isSingleSelectorOperator,
  isTableSelectorOperator,
} from './mongoQueryTypes';

export { parseProjectionToSql, parseQueryToSql };

const parseProjectionToSql = (
  projection?: Partial<Record<string, number | boolean>>
) => {
  if (!projection) {
    return '*';
  }

  const sqlProjection = Object.keys(projection)
    .map((field) => {
      const shouldSelect = projection[field];

      if (!shouldSelect || shouldSelect === 0) {
        return undefined;
      }

      return field;
    })
    .filter((field) => field !== undefined)
    .join(', ');

  // if no fields are choosen then to perform sql query null field must be choosen in sql
  // WARN: this place could be potentially logged as the query does nothing
  if (sqlProjection === '') {
    return 'NULL';
  }

  return sqlProjection;
};

const parseQueryToSql = <T extends MongoCollection>(
  query: Expression<T> | MultiSelectorOperator<T> | undefined
) => {
  if (!query) {
    return '';
  }

  if (isExpression(query)) {
    return parseExpression(query);
  }

  if (isMultiSelectorOperator(query)) {
    return parseMultiSelectorOperator(query);
  }

  throw new Error('query is of uknown format', { cause: query });
};

const parseExpression = (expression: Expression<MongoCollection>) => {
  const [fieldName, operand] = getKeyAndValue(expression);

  if (isSingleSelectorOperator(operand)) {
    return [fieldName, parseSingleSelectorOperator(operand)].join(' ');
  }

  if (isTableSelectorOperator(operand)) {
    return [fieldName, parseTableSelectorOperator(operand)].join(' ');
  }

  return [fieldName, '=', parseMongoValue(operand)].join(' ');
};

const parseMultiSelectorOperator = (
  argument: MultiSelectorOperator<MongoCollection>
) => {
  const [operator, values] = getKeyAndValue(argument);

  const sqlOperator = (() => {
    switch (operator) {
      case '$or':
        return 'OR';
      case '$and':
        return 'AND';
    }
  })();

  const sqlValues = values
    .map((value) => {
      if (isMultiSelectorOperator(value)) {
        const parsedMultiSelectorOperator = parseMultiSelectorOperator(
          value
        ) as string;

        return `(${parsedMultiSelectorOperator})`;
      }

      if (isExpression(value)) {
        return parseExpression(value);
      }

      throw new Error(
        'argument in multiSelector is not a multiSelector nor a expression',
        { cause: { multiArgument: argument, argument: value } }
      );
    })
    .join(` ${sqlOperator} `);

  return sqlValues;
};

const parseSingleSelectorOperator = (
  argument: SingleSelectorOperator<MongoValue>
) => {
  const [operator, value] = getKeyAndValue(argument);

  const sqlOperator = (() => {
    switch (operator) {
      case '$lt':
        return '<';
      case '$lte':
        return '<=';
      case '$gt':
        return '>';
      case '$gte':
        return '>=';
      case '$ne':
        return '<>';
    }
  })();

  const sqlValue = parseMongoValue(value);

  return [sqlOperator, sqlValue].join(' ');
};

const parseTableSelectorOperator = (
  argument: TableSelectorOperator<MongoValue>
) => {
  const [operator, values] = getKeyAndValue(argument);

  const sqlOperator = (() => {
    switch (operator) {
      case '$in':
        return 'IN';
    }
  })();

  const parsedValues = values.map((value) => parseMongoValue(value)).join(', ');

  const sqlList = `(${parsedValues})`;

  return [sqlOperator, sqlList].join(' ');
};

const parseMongoValue = (valueType: MongoValue) => {
  switch (typeof valueType) {
    case 'string':
      return `'${valueType}'`;
    case 'number':
      return valueType.toString();
    case 'boolean':
      return valueType ? 'TRUE' : 'FALSE';
    default:
      throw new Error('given value is not supported', { cause: valueType });
  }
};

const getKeyAndValue = <T extends Record<string, unknown>>(oneKeyObject: T) => {
  if (Object.keys(oneKeyObject).length !== 1) {
    throw new Error('oneKeyObject should have only one field', {
      cause: oneKeyObject,
    });
  }

  const fieldName = Object.keys(oneKeyObject)[0] as keyof T;

  const keyValue = oneKeyObject[fieldName] as T[keyof T];

  if (!keyValue) {
    throw new Error('could not retrieve keyValue for field', {
      cause: oneKeyObject,
    });
  }

  return [fieldName, keyValue] as const;
};
