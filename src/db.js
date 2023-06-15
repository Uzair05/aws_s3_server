require("dotenv").config();
const DynamoDB = require("aws-sdk/clients/dynamodb");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DYNAMODB_API_TABLE_NAME = process.env.AWS_DYNAMODB_API_TABLE_NAME;

const db_client = new DynamoDB({});

const readDB = (props) => {
  const readParams = {
    TableName: AWS_DYNAMODB_API_TABLE_NAME,
    KeyConditionExpression: "id = :date AND spotTime BETWEEN :lr AND :ur",
    ExpressionAttributeValues: {
      ":date": {
        N: new Date(Number(props.lowerRange))
          .toISOString()
          .split("T")[0]
          .split("-")
          .join(""),
      }, // get date on lower range
      ":lr": { N: props.lowerRange },
      ":ur": { N: props.upperRange },
    },
  };

  db_client
    .query(readParams)
    .promise()
    .then((data) => {
      console.log(`Read Success: ${JSON.stringify(data.Items)}`);
      props.res.send(data.Items);
    })
    .catch((err) => {
      console.log(`Read Fail: ${err}`);
    });
};
const readDB_func = (props) => {
  const readParams = {
    TableName: AWS_DYNAMODB_API_TABLE_NAME,
    KeyConditionExpression: "id = :date AND spotTime BETWEEN :lr AND :ur",
    ExpressionAttributeValues: {
      ":date": {
        N: new Date(Number(props.lowerRange))
          .toISOString()
          .split("T")[0]
          .split("-")
          .join(""),
      }, // get date on lower range
      ":lr": { N: props.lowerRange },
      ":ur": { N: props.upperRange },
    },
  };

  db_client
    .query(readParams)
    .promise()
    .then((data) => {
      data.Items = props.func({
        ...props,
        data_: data.Items,
      });

      console.log(`Read Success: ${JSON.stringify(data.Items)}`);
      props.res.send(data.Items);
    })
    .catch((err) => {
      console.log(`Read Fail: ${err}`);
    });
};
const readDB_func_recur = (props) => {
  const readParams = {
    TableName: AWS_DYNAMODB_API_TABLE_NAME,
    KeyConditionExpression: "id = :date AND spotTime BETWEEN :lr AND :ur",
    ExpressionAttributeValues: {
      ":date": {
        N: props.keys[0],
      }, // get date on lower range
      ":lr": { N: props.lowerRange },
      ":ur": { N: props.upperRange },
    },
  };

  db_client
    .query(readParams)
    .promise()
    .then((data) => {
      data.Items = props.func({
        ...props,
        data_: data.Items,
      });

      props.items = props.items.concat(data.Items);
      if (props.keys.slice(1).length === 0) {
        console.log(`Read Success: ${JSON.stringify(props.items)}`);
        props.res.send(props.items);
      } else {
        readDB_func_recur({
          res: props.res,
          lowerRange: props.lowerRange,
          upperRange: props.upperRange,
          items: props.items,
          keys: props.keys.slice(1),
          func: props.func,
        });
      }
    })
    .catch((err) => {
      console.log(`Read Fail: ${err}`);
    });
};
const writeDB = (props) => {
  const writeParams = {
    TableName: AWS_DYNAMODB_API_TABLE_NAME,
    Item: {
      id: {
        N: new Date(Number(props.timestamp))
          .toISOString()
          .split("T")[0]
          .split("-")
          .join(""),
      },
      spotTime: { N: props.timestamp },
      num_sighting: { N: props.num_sighting },
    },
  };
  db_client
    .putItem(writeParams)
    .promise()
    .then((data) => {
      console.log(`Write Success`);
      props.res.send({ Success: props.timestamp });
    })
    .catch((err) => {
      console.log(`Write Fail: ${err}`);
      props.res.send(
        `Fail: ${JSON.stringify({
          id: { N: props.date },
          spotTime: { N: props.timestamp },
          num_sighting: { N: props.num_sighting },
        })}`
      );
    });
};

module.exports.readDB = readDB;
module.exports.readDB_func = readDB_func;
module.exports.readDB_func_recur = readDB_func_recur;
module.exports.writeDB = writeDB;
