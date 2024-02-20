const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

let corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(express.json());
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("/get_requests", (req, res) => {
  fs.readFile("data.json", "utf-8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading data file");
      return;
    }

    res.json(JSON.parse(data));
  });
});

app.post("/create_request", (req, res) => {
  const requestData = req.body;

  fs.writeFile("newData.json", JSON.stringify(requestData), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error writing data file");
      return;
    }

    res.json({ message: "Request created successfully" });
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
