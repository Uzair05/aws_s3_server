const express = require("express");
const { uploadS3, downloadS3 } = require("./src/s3");
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
