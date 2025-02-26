const express = require("express");
require("dotenv").config();
require("./jobs/syncJob");

const app = express();

app.listen(() => {
  console.log(`Server is running...`);
});
