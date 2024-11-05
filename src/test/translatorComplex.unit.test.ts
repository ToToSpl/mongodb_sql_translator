import { expect } from 'chai';

import { createMongoCollectionTranslator } from '../index';

test('should fetch all rows by matching "name" ', () => {
  const userCollection = createMongoCollectionTranslator<{
    name: string;
    age: number;
    _id: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = userCollection.queryToSql().find({ name: 'john' });

  expect(sqlQuery).to.equal("SELECT * FROM user WHERE name = 'john';");
});

test('should fetch name and age by matching "_id" ', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
    _id: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ _id: 23113 }, { name: 1, age: 1 });

  expect(sqlQuery).to.equal('SELECT name, age FROM user WHERE _id = 23113;');
});

test('should fetch name and _id by age comparison', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
    _id: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user
    .queryToSql()
    .find({ age: { $gte: 21 } }, { name: 1, _id: 1 });

  expect(sqlQuery).to.equal('SELECT name, _id FROM user WHERE age >= 21;');
});

test('should make nested operation between any type of arguments', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
    _id: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(
    {
      $or: [{ age: 1 }, { $and: [{ name: 'john' }, { age: { $gt: 18 } }] }],
    },
    { _id: 1 }
  );

  expect(sqlQuery).to.equal(
    "SELECT _id FROM user WHERE age = 1 OR (name = 'john' AND age > 18);"
  );
});

test('should fetch all rows by matching "name" ', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
    _id: number;
    isEmployed: boolean;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(
    {
      $and: [
        { name: { $gt: 'a' } },
        { age: 2 },
        {
          $or: [{ name: 'b' }, { age: { $in: [2, 3] } }, { isEmployed: true }],
        },
      ],
    },
    { name: 1, age: false, isEmployed: 1 }
  );

  expect(sqlQuery).to.equal(
    "SELECT name, isEmployed FROM user WHERE name > 'a' AND age = 2 AND (name = 'b' OR age IN (2, 3) OR isEmployed = TRUE);"
  );
});
