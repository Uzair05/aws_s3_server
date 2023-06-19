require("dotenv").config();
const AWS = require("aws-sdk");
const iotdata = new AWS.IotData({
  endpoint: "a5sswhj5ru4gy-ats.iot.ap-southeast-1.amazonaws.com",
});

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DYNAMODB_API_TABLE_NAME = process.env.AWS_DYNAMODB_API_TABLE_NAME;

const turnOffAlert = () => {
  var params = {
    topic: "boar_5G/sub",
    payload: JSON.stringify({ Boar_Detection: false }),
    qos: 1,
  };

  return iotdata.publish(params, function (err, data) {
    if (err) {
      console.log("ERROR => " + JSON.stringify(err));
    } else {
      console.log("Success => " + JSON.stringify(data));
      // props.res.send(JSON.stringify(data));
    }
  });
};

module.exports.turnOffAlert = turnOffAlert;
