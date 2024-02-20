const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
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
    const { pointPerson, emails, status } = req.body;

    // Check if requestData contains necessary properties
    if (!pointPerson || !Array.isArray(emails) || !status) {
        res.status(400).send("Invalid request data");
        return;
    }

    // Generate a unique request_id
    const request_id = uuidv4();

    // Read the existing data
    fs.readFile("data.json", "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error reading data file");
        }

        // Parse the data and append the new request
        const existingData = JSON.parse(data);
        existingData.push({ request_id, pointPerson, emails, status });

        // Write the updated data back to the file
        fs.writeFile(
            "data.json",
            JSON.stringify(existingData, null, 2),
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error writing data file");
                }

                res.json({
                    message: "Request created successfully",
                    request_id,
                });
            }
        );
    });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
