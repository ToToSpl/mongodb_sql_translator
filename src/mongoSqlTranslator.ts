import type {
  Expression,
  MultiSelectorOperator,
  MongoCollection,
} from './mongoQueryTypes';

import { parseProjectionToSql, parseQueryToSql } from './mongoParsers';

export { createMongoCollectionTranslator };

const createMongoCollectionTranslator = <T extends MongoCollection>({
  sqlCollectionName,
}: {
  sqlCollectionName: string;
}) => ({
  queryToSql: () => ({
    find: createFind<T>(sqlCollectionName),
  }),
});

const createFind =
  <T extends MongoCollection>(sqlCollectionName: string) =>
  (
    query: Expression<T> | MultiSelectorOperator<T> | undefined,
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
