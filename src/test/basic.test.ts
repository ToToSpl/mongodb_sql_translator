import { expect } from 'chai';

import { createMongoCollectionTranslator } from '../index';

test('should fetch all rows by matching "name" ', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>();

  const sqlQuery = user.queryToSql().find(
    {
      $and: [
        { name: { $gt: 'a' } },
        { age: 2 },
        { $or: [{ name: 'b' }, { age: { $lt: 2 } }] },
      ],
    },
    { name: 1, age: false }
  );

  expect(sqlQuery).to.equal('hello');
});
