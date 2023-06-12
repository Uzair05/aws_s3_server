require("dotenv").config();
const S3 = require("aws-sdk/clients/s3");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const fs = require("fs");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DYNAMODB_TABLE_NAME = process.env.AWS_DYNAMODB_TABLE_NAME;

const s3 = new S3({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});
const db_client = new DynamoDB({});

module.exports = {
  uploadS3: (props) => {
    const filestream = fs.createReadStream(props.path);
    const uploadParams = {
      Bucket: AWS_BUCKET_NAME,
      Body: filestream,
      Key: props.filename,
    };

    const writeParams = {
      TableName: AWS_DYNAMODB_TABLE_NAME,
      Item: {
        filename: { S: props.originalname },
        key: { S: props.filename },
      },
    };

    db_client
      .putItem(writeParams)
      .promise()
      .then((data) => console.log(`Write Success: ${JSON.stringify(data)}`))
      .catch((err) => console.log(`Write Fail: ${err}`));

    return s3.upload(uploadParams).promise();
  },

  downloadS3: (props) => {
    const readParams = {
      TableName: AWS_DYNAMODB_TABLE_NAME,
      Key: {
        filename: { S: props.originalname },
      },
    };

    db_client
      .getItem(readParams)
      .promise()
      .then((data) => {
        console.log(`Read Success: ${JSON.stringify(data.Item)}`);
        const downloadParams = {
          Key: data.Item.key.S,
          Bucket: AWS_BUCKET_NAME,
        };
        s3.getObject(downloadParams).createReadStream().pipe(props.res);
      })
      .catch((err) => {
        console.log(`Read Fail: ${err}`);
      });
  },
};
