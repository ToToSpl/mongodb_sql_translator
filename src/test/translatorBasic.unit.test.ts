import { expect } from 'chai';

import { createMongoCollectionTranslator } from '../index';

test('should SELECT all fields if projection is not specified', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined);

  expect(sqlQuery).to.equal('SELECT * FROM user;');
});

test('should SELECT field if projection for this field is 1', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { name: 1 });

  expect(sqlQuery).to.equal('SELECT name FROM user;');
});

test('should SELECT field if projection for this field is true', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { name: true });

  expect(sqlQuery).to.equal('SELECT name FROM user;');
});

test('should SELECT multiple field if projection for this fields is true', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
    _id: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { name: true, age: true });

  expect(sqlQuery).to.equal('SELECT name, age FROM user;');
});

test('should not SELECT field if projection for this field is 0', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { name: 0, age: 1 });

  expect(sqlQuery).to.equal('SELECT age FROM user;');
});

test('should not SELECT field if projection for this field is false', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { name: false, age: 1 });

  expect(sqlQuery).to.equal('SELECT age FROM user;');
});

test('should not SELECT null field if projection does not choose any field', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { name: false });

  expect(sqlQuery).to.equal('SELECT NULL FROM user;');
});

test('should not make WHERE condition if expression is undefined', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find(undefined, { age: 1 });

  expect(sqlQuery).to.equal('SELECT age FROM user;');
});

test('should parse equal operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ name: 'john' }, { age: 1 });

  expect(sqlQuery).to.equal("SELECT age FROM user WHERE name = 'john';");
});

test('should parse $lt operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ age: { $lt: 21 } }, { name: 1 });

  expect(sqlQuery).to.equal('SELECT name FROM user WHERE age < 21;');
});

test('should parse $lte operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ age: { $lte: 21 } }, { name: 1 });

  expect(sqlQuery).to.equal('SELECT name FROM user WHERE age <= 21;');
});

test('should parse $gt operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ age: { $gt: 21 } }, { name: 1 });

  expect(sqlQuery).to.equal('SELECT name FROM user WHERE age > 21;');
});

test('should parse $gte operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ age: { $gte: 21 } }, { name: 1 });

  expect(sqlQuery).to.equal('SELECT name FROM user WHERE age >= 21;');
});

test('should parse $ne operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user.queryToSql().find({ age: { $ne: 21 } }, { name: 1 });

  expect(sqlQuery).to.equal('SELECT name FROM user WHERE age <> 21;');
});

test('should parse $in operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user
    .queryToSql()
    .find({ name: { $in: ['alice', 'bob'] } }, { age: 1 });

  expect(sqlQuery).to.equal(
    "SELECT age FROM user WHERE name IN ('alice', 'bob');"
  );
});

test('should parse $or operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user
    .queryToSql()
    .find(
      { $or: [{ age: 1 }, { $or: [{ name: 'john' }, { name: 'alice' }] }] },
      { name: 1 }
    );

  expect(sqlQuery).to.equal(
    "SELECT name FROM user WHERE age = 1 OR (name = 'john' OR name = 'alice');"
  );
});

test('should parse $and operation', () => {
  const user = createMongoCollectionTranslator<{
    name: string;
    age: number;
  }>({ sqlCollectionName: 'user' });

  const sqlQuery = user
    .queryToSql()
    .find(
      { $and: [{ age: 1 }, { $and: [{ name: 'john' }, { name: 'alice' }] }] },
      { name: 1 }
    );

  expect(sqlQuery).to.equal(
    "SELECT name FROM user WHERE age = 1 AND (name = 'john' AND name = 'alice');"
  );
});
