const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();

let corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({ message: "Hello, World!" });
});

const isAuthenticated = (req, res, next) => {
    if (req.cookies.username) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

app.get("/get_requests", (req, res) => {
    fs.readFile("data.json", "utf-8", (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json("Error reading data file");
            return;
        }

        res.json(JSON.parse(data));
    });
});

app.post("/create_request", (req, res) => {
    const { point_person, emails, status } = req.body;

    if (!pointPerson || !Array.isArray(emails) || !status) {
        res.status(400).send("Invalid request data");
        return;
    }

    const request_id = uuidv4();

    fs.readFile("data.json", "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error reading data file");
        }

        const existingData = JSON.parse(data);
        existingData.push({ request_id, point_person, emails, status });

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.array("images", 3), (req, res) => {
    const { request_id } = req.body;

    if (!request_id) {
        res.status(400).send("Invalid request data");
        return;
    }

    const images = req.files.map((file) => file.filename);

    // Read the existing data
    fs.readFile("data.json", "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error reading data file");
        }

        // Parse the data and find the matching request_id
        const existingData = JSON.parse(data);
        const request = existingData.find(
            (item) => item.request_id === request_id
        );

        if (!request) {
            return res.status(404).send("Request not found");
        }

        // Update the status
        request.status = "sent";

        // Write the updated data back to the file
        fs.writeFile(
            "data.json",
            JSON.stringify(existingData, null, 2),
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error writing data file");
                }

                res.send("Files uploaded and status updated successfully");

                const resp = {
                    request_id,
                    images,
                };

                console.log("Response: ", resp);
            }
        );
    });
});

app.post("/cancel", (req, res) => {
    const { request_id } = req.body;

    if (!request_id) {
        res.status(400).send("Invalid request data");
        return;
    }

    // Read the existing data
    fs.readFile("data.json", "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error reading data file");
        }

        // Parse the data and find the matching request_id
        const existingData = JSON.parse(data);
        const request = existingData.find(
            (item) => item.request_id === request_id
        );

        if (!request) {
            return res.status(404).send("Request not found");
        }

        // Update the status
        request.status = "cancelled";

        // Write the updated data back to the file
        fs.writeFile(
            "data.json",
            JSON.stringify(existingData, null, 2),
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error writing data file");
                }

                res.send("Status updated to cancelled successfully");
            }
        );
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "password") {
        res.cookie("username", username, { maxAge: 900000, httpOnly: true });
        return res.status(200).send("Logged in!");
    }

    return res.status(401).send("Unauthorized");
});

app.post("/logout", (req, res) => {
    res.clearCookie("username");
    return res.status(200).send("Logged out!");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
