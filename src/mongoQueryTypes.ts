export type {
  Expression,
  SingleArgumentOperator,
  TableArgumentOperator,
  MultiArgumentOperator,
  SupportedMongoCollectionStructure,
  SupportedMongoValueTypes,
};

export {
  isExpression,
  isSingleArgumentOperator,
  isTableArgumentOperator,
  isMultiArgumentOperator,
  SingleArgumentKeys,
  TableArgumentKeys,
  MultiArgumentKeys,
};

const SingleArgumentKeys = ['$lt', '$lte', '$gt', '$gte', '$ne'] as const;
const TableArgumentKeys = ['$in'] as const;
const MultiArgumentKeys = ['$or', '$and'] as const;

type SupportedMongoValueTypes = string | number | boolean;
type SupportedMongoCollectionStructure = Record<
  string,
  SupportedMongoValueTypes
>;

type Expression<T extends SupportedMongoCollectionStructure> = {
  [P in keyof T]: {
    [Key in P]:
      | T[P]
      | SingleArgumentOperator<T[P]>
      | TableArgumentOperator<T[P]>;
  } & Partial<Record<Exclude<keyof T, P>, never>>;
}[keyof T];

type SingleArgumentOperator<K> = OneKey<(typeof SingleArgumentKeys)[number], K>;

type TableArgumentOperator<K> = OneKey<(typeof TableArgumentKeys)[number], K[]>;

type MultiArgumentOperator<T extends SupportedMongoCollectionStructure> =
  OneKey<
    (typeof MultiArgumentKeys)[number],
    (MultiArgumentOperator<T> | Expression<T>)[]
  >;

// helper type which allows only one key of given enum type
type OneKey<K extends string | number | symbol, V> = {
  [P in K]: { [Key in P]: V } & Partial<Record<Exclude<K, P>, never>>;
}[K];

const isExpression = (
  expression: unknown
): expression is Expression<SupportedMongoCollectionStructure> =>
  isOneKeyObject(expression) &&
  !isMultiArgumentOperator(expression) &&
  !isSingleArgumentOperator(expression) &&
  !isTableArgumentOperator(expression);

const isMultiArgumentOperator = (
  multiArgumentOperator: unknown
): multiArgumentOperator is MultiArgumentOperator<SupportedMongoCollectionStructure> =>
  isOneKeyObject(multiArgumentOperator) &&
  MultiArgumentKeys.includes(
    Object.keys(multiArgumentOperator)[0] as (typeof MultiArgumentKeys)[number]
  );

const isSingleArgumentOperator = (
  singleArgumentOperator: unknown
): singleArgumentOperator is SingleArgumentOperator<unknown> =>
  isOneKeyObject(singleArgumentOperator) &&
  SingleArgumentKeys.includes(
    Object.keys(
      singleArgumentOperator
    )[0] as (typeof SingleArgumentKeys)[number]
  );

const isTableArgumentOperator = (
  tableArgumentOperator: unknown
): tableArgumentOperator is TableArgumentOperator<unknown> =>
  isOneKeyObject(tableArgumentOperator) &&
  TableArgumentKeys.includes(
    Object.keys(tableArgumentOperator)[0] as (typeof TableArgumentKeys)[number]
  );

const isOneKeyObject = (field: unknown): field is object =>
  typeof field === 'object' &&
  !Array.isArray(field) &&
  field !== null &&
  Object.keys(field).length === 1;
