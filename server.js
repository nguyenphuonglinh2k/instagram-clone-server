require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const apiPort = 5000;
const http = require("http").Server(app);
const io = require("socket.io")(http);

const Like = require("./models/like.model");
const userRoute = require("./routes/user.route");
const postRoute = require("./routes/post.route");
const authRoute = require("./routes/auth.route");

// Connect Mongo
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("connected to mongo yeah!");
});
mongoose.connection.on("error", (err) => {
  console.log("error connecting:", err);
});

// Socket handling
io.on("connection", function (socket) {
  socket.on("like_action", async function (data) {
    const { postId, user } = data;
    const actionLike = await Like.findOne({ postId: postId, userId: user._id });
    if (!actionLike) io.sockets.emit("like_res", data);
  });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

app.use("/api", userRoute);
app.use("/api", postRoute);
app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))
http.listen(apiPort, function () {
  console.log("Listening on *:" + apiPort);
});
