const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const likeSchema = new mongoose.Schema(
  {
    postId: {
      type: ObjectId,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
    },
  },
  {
    versionKey: false,
  }
);

const Like = mongoose.model("Like", likeSchema, "likes");

module.exports = Like;
