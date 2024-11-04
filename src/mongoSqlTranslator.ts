import {
  isExpression,
  isMultiArgumentOperator,
  isSingleArgumentOperator,
  isTableArgumentOperator,
  type Expression,
  type MultiArgumentOperator,
  type SingleArgumentOperator,
  type SupportedMongoCollectionStructure,
  type SupportedMongoValueTypes,
  type TableArgumentOperator,
} from './mongoQueryTypes';

export { createMongoCollectionTranslator };

const createMongoCollectionTranslator = <
  T extends SupportedMongoCollectionStructure,
>({
  sqlCollectionName,
}: {
  sqlCollectionName: string;
}) => ({
  queryToSql: () => ({
    find: createFind<T>(sqlCollectionName),
  }),
});

const createFind =
  <T extends SupportedMongoCollectionStructure>(sqlCollectionName: string) =>
  (
    query: Expression<T> | MultiArgumentOperator<T> | undefined,
    projection?: Partial<Record<keyof T, number | boolean>>
  ) => {
    const selectSqlPart = parseProjectionToSql(projection);

    const whereLogicSqlPart = parseQueryToSql(query);
    const whereSqlPart = whereLogicSqlPart ? ['WHERE', whereLogicSqlPart] : [];

    return (
      [
        'SELECT',
        selectSqlPart,
        'FROM',
        sqlCollectionName,
        ...whereSqlPart,
      ].join(' ') + ';'
    );
  };

const parseProjectionToSql = (
  projection?: Partial<Record<string, number | boolean>>
) => {
  if (!projection) {
    return '*';
  }

  return Object.keys(projection)
    .map((field) => {
      const shouldSelect = projection[field];

      if (!shouldSelect || shouldSelect === 0) {
        return undefined;
      }

      return field;
    })
    .filter((field) => field !== undefined)
    .join(', ');
};

const parseQueryToSql = <T extends SupportedMongoCollectionStructure>(
  query: Expression<T> | MultiArgumentOperator<T> | undefined
) => {
  if (!query) {
    return '';
  }

  if (isExpression(query)) {
    return parseExpression(query);
  }

  if (isMultiArgumentOperator(query)) {
    return parseMultiArgumentOperator(query);
  }
};

const parseExpression = (
  expression: Expression<SupportedMongoCollectionStructure>
) => {
  if (Object.keys(expression).length !== 1) {
    throw new Error('expression should have only one field', {
      cause: expression,
    });
  }

  const fieldName = Object.keys(expression)[0];

  const operand = expression[fieldName];

  if (!operand) {
    throw new Error('could not retrieve operand for field', {
      cause: expression,
    });
  }

  if (isSingleArgumentOperator(operand)) {
    return [fieldName, parseSingleArgumentOperator(operand)].join(' ');
  }

  if (isTableArgumentOperator(operand)) {
    return [fieldName, parseTableArgumentOperator(operand)].join(' ');
  }

  return [fieldName, '=', parseSupportedMongoValueType(operand)].join(' ');
};

const parseMultiArgumentOperator = (
  argument: MultiArgumentOperator<SupportedMongoCollectionStructure>
) => {
  if (Object.keys(argument).length !== 1) {
    throw new Error('multiArgumentOperator should have only one operator', {
      cause: argument,
    });
  }

  const operator = Object.keys(argument)[0] as keyof typeof argument;

  const sqlOperator = (() => {
    switch (operator) {
      case '$or':
        return 'OR';
      case '$and':
        return 'AND';
    }
  })();

  const values = argument[operator];

  if (!values) {
    throw new Error('could not retrieve values for operand', {
      cause: argument,
    });
  }

  const sqlValues = values
    .map((value) => {
      if (isMultiArgumentOperator(value)) {
        const parsedMultiArgumentOperator = parseMultiArgumentOperator(
          value
        ) as string;

        return `(${parsedMultiArgumentOperator})`;
      }

      if (isExpression(value)) {
        return parseExpression(value);
      }

      throw new Error(
        'argument in multiArgument is not multiArgument nor expression',
        { cause: { multiArgument: argument, argument: value } }
      );
    })
    .join(` ${sqlOperator} `);

  return sqlValues;
};

const parseSingleArgumentOperator = (
  argument: SingleArgumentOperator<SupportedMongoValueTypes>
) => {
  if (Object.keys(argument).length !== 1) {
    throw new Error('singleArgumentOperator should have only one operator', {
      cause: argument,
    });
  }

  const operator = Object.keys(argument)[0] as keyof typeof argument;

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

  const value = argument[operator];

  if (!value) {
    throw new Error('could not retrieve value for operand', {
      cause: argument,
    });
  }

  const sqlValue = parseSupportedMongoValueType(value);

  return [sqlOperator, sqlValue].join(' ');
};

const parseTableArgumentOperator = (
  argument: TableArgumentOperator<SupportedMongoValueTypes>
) => {
  if (Object.keys(argument).length !== 1) {
    throw new Error('tableArgumentOperator should have only one operator', {
      cause: argument,
    });
  }

  const operator = Object.keys(argument)[0] as keyof typeof argument;

  const sqlOperator = (() => {
    switch (operator) {
      case '$in':
        return 'IN';
    }
  })();

  const values = argument[operator];

  if (!values) {
    throw new Error('could not retrieve values for operand', {
      cause: argument,
    });
  }

  const parsedValues = values
    .map((value) => parseSupportedMongoValueType(value))
    .join(', ');

  const sqlList = `(${parsedValues})`;

  return [sqlOperator, sqlList].join(' ');
};

const parseSupportedMongoValueType = (valueType: SupportedMongoValueTypes) => {
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
