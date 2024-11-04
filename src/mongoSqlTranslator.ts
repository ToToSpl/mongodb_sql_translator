export { createMongoCollectionTranslator };

// helper type which allows only one key of given enum type
type OneKey<K extends string | number | symbol, V> = {
  [P in K]: { [Key in P]: V } & Partial<Record<Exclude<K, P>, never>>;
}[K];

type SupportedMongoCollectionStructure = Record<
  string,
  string | number | boolean
>;

type Expression<T extends SupportedMongoCollectionStructure> = {
  [P in keyof T]: {
    [Key in P]:
      | T[P]
      | SingleArgumentOperator<T[P]>
      | TableArgumentOperator<T[P]>;
  } & Partial<Record<Exclude<keyof T, P>, never>>;
}[keyof T];

const isExpression = (
  expression: object
): expression is Expression<SupportedMongoCollectionStructure> =>
  Object.keys(expression).length === 1 &&
  !isMultiArgumentOperator(expression) &&
  !isSingleArgumentOperator(expression) &&
  !isTableArgumentOperator(expression);

const MultiArgumentKeys = ['$or', '$and'];
type MultiArgumentOperator<T extends SupportedMongoCollectionStructure> =
  OneKey<
    (typeof MultiArgumentKeys)[number],
    (MultiArgumentOperator<T> | Expression<T>)[]
  >;

const isMultiArgumentOperator = (
  multiArgumentOperator: object
): multiArgumentOperator is MultiArgumentOperator<SupportedMongoCollectionStructure> =>
  Object.keys(multiArgumentOperator).length === 1 &&
  MultiArgumentKeys.includes(Object.keys(multiArgumentOperator)[0]);

const SingleArgumentKeys = ['$lt', '$lte', '$gt', '$gte', '$ne'];
type SingleArgumentOperator<K> = OneKey<(typeof SingleArgumentKeys)[number], K>;

const isSingleArgumentOperator = (
  singleArgumentOperator: object
): singleArgumentOperator is SingleArgumentOperator<unknown> =>
  Object.keys(singleArgumentOperator).length === 1 &&
  SingleArgumentKeys.includes(Object.keys(singleArgumentOperator)[0]);

const TableArgumentKeys = ['$in'];
type TableArgumentOperator<K> = OneKey<(typeof TableArgumentKeys)[number], K[]>;

const isTableArgumentOperator = (
  tableArgumentOperator: object
): tableArgumentOperator is TableArgumentOperator<unknown> =>
  Object.keys(tableArgumentOperator).length === 1 &&
  TableArgumentKeys.includes(Object.keys(tableArgumentOperator)[0]);

const createMongoCollectionTranslator = <
  T extends SupportedMongoCollectionStructure,
>() => ({
  queryToSql: () => ({
    find: createFind<T>(),
  }),
});

const createFind =
  <T extends SupportedMongoCollectionStructure>() =>
  (
    query: Expression<T> | MultiArgumentOperator<T>,
    projection?: Partial<Record<keyof T, number | boolean>>
  ) => {
    console.log(query);
    return 'hello';
  };
