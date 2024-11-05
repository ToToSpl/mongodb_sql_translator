# MongoDB to SQL translator

This library allows to translate query written in MongoDB to SQL.
MongoDB queries are fully typed based off the type of the collection passed to `createMongoCollectionTranslator`.

Currently supports only `find` operation.

## Example

```ts
import { createMongoCollectionTranslator } from 'mongodb_sql_translator';

const userCollection = createMongoCollectionTranslator<{
  name: string;
  age: number;
  _id: number;
  isEmployed: boolean;
}>({ sqlCollectionName: 'user' });

const sqlQuery = userCollection.queryToSql().find(
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

// SELECT name, isEmployed FROM user WHERE name > 'a' AND age = 2 AND (name = 'b' OR age IN (2, 3) OR isEmployed = TRUE);
console.log(sqlQuery);
```

## Supported features

### Supported functions:

- find

### Supported operations

- $or
- $and
- $lt
- $lte
- $gt
- $gte
- $ne
- $in

### Supported types in collection

Collection must be flat, i.e. fields can be only of types:

- string
- number
- boolean

Currently `null` in fields is not supported
