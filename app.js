const express = require("express");
const { uploadS3, downloadS3 } = require("./src/s3");
const { readDB, writeDB, readDB_func, readDB_func_recur } = require("./src/db");
const multer = require("multer");

const fs = require("fs");
const util = require("util");
const unlink = util.promisify(fs.unlink);

const upload = multer({ dest: "uploads/" });

const app = express();
const port = 3000;

app.get("/image/download/:filename", (req, res) => {
  const filename = req.params.filename;
  downloadS3({ originalname: filename, res: res });
});

app.post("/image/upload/", upload.single("image"), async (req, res) => {
  const result = await uploadS3(req.file);
  await unlink(req.file.path);
  res.send(JSON.stringify(result));
});

app.get("/api/", (req, res) => {
  const ur = req.query.upperLimit;
  const lr = req.query.lowerLimit;
  // get from dynamodb
  readDB({ res: res, lowerRange: lr, upperRange: ur });
});

app.get("/api/day/", (req, res) => {
  const lr = new Date(
    `${
      new Date(Number(req.query.timestamp)).toISOString().split("T")[0]
    }T00:00:00Z`
  ).getTime();
  const ur = lr + 3600 * 24 * 1000;

  // get from dynamodb
  readDB_func({
    res: res,
    lowerRange: lr.toString(),
    upperRange: ur.toString(),
    func: (props) => {
      return props.data_.map((data) => {
        return {
          spotHour: Math.floor((data.spotTime.N - props.lowerRange) / 3600000),
          num_sighting: data.num_sighting,
        };
      });
    },
  });
});

app.get("/api/days_back/", (req, res) => {
  const lr = new Date(
    `${
      new Date(Number(req.query.timestamp)).toISOString().split("T")[0]
    }T00:00:00Z`
  ).getTime();

  const keys = [];
  for (let i = 0; i < req.query.daysback; i++) {
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
    lowerRange: (lr - req.query.daysback * (3600 * 24 * 1000)).toString(),
    upperRange: (lr + 3600 * 24 * 1000).toString(),
    func: (props) => {
      let sum = 0;
      for (let i = 0; i < props.data_.length; i++) {
        sum = sum + Number(props.data_[i]?.num_sighting.N);
      }
      if (props.data_.length > 0) {
        return [{ id: props.data_[0].id.N, num_sighting: sum }];
      } else {
        return [];
      }
    },
  });
});

app.put("/api/", (req, res) => {
  const da = req.query.date;
  const timestamp = req.query.timestamp;
  const num_sighting = req.query.num_sighting;
  // add to dynamo db
  writeDB({
    res: res,
    num_sighting: num_sighting,
    timestamp: timestamp,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
