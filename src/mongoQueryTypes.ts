export type {
  Expression,
  SingleSelectorOperator,
  TableSelectorOperator,
  MultiSelectorOperator,
  MongoCollection,
  MongoValue,
};

export {
  isExpression,
  isSingleSelectorOperator,
  isTableSelectorOperator,
  isMultiSelectorOperator,
};

// allowed mongo operators
const SingleSelectorKeys = ['$lt', '$lte', '$gt', '$gte', '$ne'] as const;
const TableSelectorKeys = ['$in'] as const;
const MultiSelectorKeys = ['$or', '$and'] as const;

/**
 * Supported value types for fields in Mongo collection
 */
type MongoValue = string | number | boolean;

/**
 * Supported shape of the Mongo collection
 */
type MongoCollection = Record<string, MongoValue>;

/**
 * Expression is constructed as {key: <selector>}
 * in field <selector> there can be single or table selector or exact specified value
 * value must be of type which key allows {name: 'joe'} but not {name: 21}
 * single and table selectors must also know type of key otherwise we could have {name: {$ne: 21}}
 */
type Expression<T extends MongoCollection> = {
  [P in keyof T]: {
    [Key in P]:
      | T[P]
      | SingleSelectorOperator<T[P]>
      | TableSelectorOperator<T[P]>;
  } & Partial<Record<Exclude<keyof T, P>, never>>;
}[keyof T];

/**
 * SingleSelector is for ex: {$gt: 21}. Key is defined by SingleSelectorKeys.
 * value type for the key must be inherited from expression above
 */
type SingleSelectorOperator<V> = OneKey<(typeof SingleSelectorKeys)[number], V>;

/**
 * TableSelector is for ex: {$in: [21, 18]}. Key is defined by TableSelectorKeys.
 * value type for the key must be inherited from expression above
 */
type TableSelectorOperator<V> = OneKey<(typeof TableSelectorKeys)[number], V[]>;

/**
 * MultiSelector is for ex {$or: [{name: 'joe'}, {$or: [...]}]}. Key is defined by MultiSelectorKeys.
 * value type is another MultiSelectorOperator or an Expression
 */
type MultiSelectorOperator<T extends MongoCollection> = OneKey<
  (typeof MultiSelectorKeys)[number],
  (MultiSelectorOperator<T> | Expression<T>)[]
>;

/**
 * helper type which allows only one key of given enum type
 * {foo: "bar"} is ok
 * {foo: "bar", biz: "buz"} will show error
 */
type OneKey<K extends string | number | symbol, V> = {
  [P in K]: { [Key in P]: V } & Partial<Record<Exclude<K, P>, never>>;
}[K];

// Selectors are defined as objects with one key with name specified by allowed keys
const isMultiSelectorOperator = (
  operator: unknown
): operator is MultiSelectorOperator<MongoCollection> =>
  isOneKeyObject(operator) &&
  MultiSelectorKeys.includes(
    Object.keys(operator)[0] as (typeof MultiSelectorKeys)[number]
  );

const isSingleSelectorOperator = (
  operator: unknown
): operator is SingleSelectorOperator<unknown> =>
  isOneKeyObject(operator) &&
  SingleSelectorKeys.includes(
    Object.keys(operator)[0] as (typeof SingleSelectorKeys)[number]
  );

const isTableSelectorOperator = (
  operator: unknown
): operator is TableSelectorOperator<unknown> =>
  isOneKeyObject(operator) &&
  TableSelectorKeys.includes(
    Object.keys(operator)[0] as (typeof TableSelectorKeys)[number]
  );

// Expression is an object with single key which is not a selector
const isExpression = (
  expression: unknown
): expression is Expression<MongoCollection> =>
  isOneKeyObject(expression) &&
  !isMultiSelectorOperator(expression) &&
  !isSingleSelectorOperator(expression) &&
  !isTableSelectorOperator(expression);

// Helper to define if some argument is a one object with one key
const isOneKeyObject = (obj: unknown): obj is object =>
  typeof obj === 'object' &&
  !Array.isArray(obj) &&
  obj !== null &&
  Object.keys(obj).length === 1;
