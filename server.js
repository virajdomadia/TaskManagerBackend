const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

const auth = require("./routes/authRoutes");
const task = require("./routes/taskRoutes");

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => console.log("Error connecting to MongoDB", e));

// app.use("/", (req, res) => {
//   res.send("Hello from Express");
// });

app.use("/api/auth", auth);
app.use("/api/tasks", task);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
