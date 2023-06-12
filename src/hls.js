require("dotenv").config();
const KVS = require("aws-sdk/clients/kinesisvideo");
const KVSM = require("aws-sdk/clients/kinesisvideoarchivedmedia");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DYNAMODB_API_TABLE_NAME = process.env.AWS_DYNAMODB_API_TABLE_NAME;

const kvs = new KVS({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const kvsm = new KVSM({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

/**
 * Return HLS URL from kinesis video streamArn
 */
const getHls = (props) => {
  kvs
    .getDataEndpoint({
      APIName: "GET_HLS_STREAMING_SESSION_URL",
      StreamARN: props.streamARN,
    })
    .promise()
    .then((data) => {
      kvsm.endpoint.hostname = data.DataEndpoint.split("/").slice(-1)[0];
      kvsm.endpoint.host = data.DataEndpoint.split("/").slice(-1)[0];
      kvsm.endpoint.href = data.DataEndpoint;
      // console.log(kvsm.endpoint);
      kvsm
        .getHLSStreamingSessionURL({
          StreamARN: props.streamARN,
          Expires: 43199,
          PlaybackMode: "LIVE",
        })
        .promise()
        .then((data) => {
          console.log(data);
          props.res.send(JSON.stringify(data));
        })
        .catch((err) => {
          console.log(err, err.stack);
        });
    })
    .catch((err) => {
      console.log(err, err.stack);
    });
};

module.exports.getHls = getHls;
