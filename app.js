const express = require("express");
const { uploadS3, downloadS3 } = require("./src/s3");
const { readDB, writeDB, readDB_func, readDB_func_recur } = require("./src/db");
const { getHls } = require("./src/hls");
const { turnOffAlert } = require("./src/iot");
var cors = require("cors");
const multer = require("multer");

const fs = require("fs");
const util = require("util");
const { time } = require("console");
const unlink = util.promisify(fs.unlink);

const upload = multer({ dest: "uploads/" });

const port = 8080;
let timeme = 0;

const app = express();
app.use(cors());

app.get("/image/download/:filename", (req, res) => {
  const filename = req.params.filename;
  downloadS3({ originalname: filename, res: res });
});

// app.post("/image/upload/", upload.single("image"), async (req, res) => {
//   const result = await uploadS3(req.file);
//   await unlink(req.file.path);
//   res.send(JSON.stringify(result));
// });

app.get("/api/", (req, res) => {
  const ur = req.query.upperLimit;
  const lr = req.query.lowerLimit;
  // get from dynamodb
  readDB({ res: res, lowerRange: lr, upperRange: ur });
});

/**
 * To get timestamps of image captions
 * These timestamps can then be used to query from database.
 */
app.get("/api/day_image/", (req, res) => {
  const lr = req.query.timestamp;
  const ur = lr + 3600 * 24 * 1000;

  // get from dynamodb
  readDB_func({
    res: res,
    lowerRange: lr.toString(),
    upperRange: ur.toString(),
    func: (props) => {
      return props.data_.map((data) => data.spotTime.N);
    },
  });
});

/**
 * To get number of boar sightings on each day starting from timestamp to # of days back.
 */
app.get("/api/days_back/", (req, res) => {
  if (Number(req.query.daysback) <= 0) {
    res.send([]);
  } else {
    const lr = new Date(
      `${
        new Date(Number(req.query.timestamp)).toISOString().split("T")[0]
      }T00:00:00Z`
    ).getTime();

    const keys = [];
    for (let i = 0; i < Number(req.query.daysback); i++) {
      keys.push(
        new Date(lr - i * (3600 * 24 * 1000))
          .toISOString()
          .split("T")[0]
          .split("-")
          .join("")
      );
    }

    // get from dynamodb
    readDB_func_recur({
      res: res,
      keys: keys,
      items: [],
      lowerRange: (
        lr -
        Number(req.query.daysback) * (3600 * 24 * 1000)
      ).toString(),
      upperRange: (lr + 3600 * 24 * 1000).toString(),
      func: (props) => {
        let sum = 0;
        for (let i = 0; i < props.data_.length; i++) {
          sum = sum + Number(props.data_[i]?.num_sighting.N);
        }
        if (props.data_.length > 0) {
          return [{ date: props.data_[0].id.N, num_sighting: sum }];
        } else {
          return [];
        }
      },
    });
  }
});

const farm_details = {
  farm_1: {
    camera_1: {
      stream_arn:
        "arn:aws:kinesisvideo:ap-southeast-1:733421296020:stream/boar_camera_inhouse_2/1685341936560",
    },
  },
};

app.get("/camera/:farm_id/:camera_id", (req, res) => {
  const farm_id = req.params.farm_id;
  const camera_id = req.params.camera_id;

  if (farm_details[farm_id] !== undefined) {
    if (farm_details[farm_id][camera_id] !== undefined) {
      getHls({
        streamARN: farm_details[farm_id][camera_id].stream_arn,
        res: res,
      });
    }
  }
});

app.get("/toast", (req, res) => {
  if (new Date().getTime() - timeme <= 5000) {
    res.send({ alert: true });
  } else {
    res.send({ alert: false });
  }
});

/**
 * To insert boar sigthing into database.
 */
app.put("/api/", (req, res) => {
  timeme = new Date().getTime();

  const timestamp = req.query.timestamp;
  const num_sighting = req.query.num_sighting;
  // add to dynamo db
  writeDB({
    res: res,
    num_sighting: num_sighting,
    timestamp: timestamp,
  });

  function turnOffAlert_() {
    setTimeout(() => {
      turnOffAlert();
    }, 3000);
  }
  turnOffAlert_();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// TODO: clean output
