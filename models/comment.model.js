const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      required: true,
    },
    postId: {
      type: ObjectId,
      required: true,
    },
    user: {
      _id: {
        type: ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      userImageUrl: {
        type: String,
        required: true,
      },
    },
  },
  {
    versionKey: false,
  }
);

const Comment = mongoose.model("Comment", commentSchema, "comments");

module.exports = Comment;
