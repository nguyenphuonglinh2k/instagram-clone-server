const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
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
      userImageUrl: {
        type: String,
        required: true,
      },
      bio: {
        type: String,
        required: false,
      },
      followers: [ObjectId],
      following: [ObjectId],
    },
  },
  {
    versionKey: false,
  }
);

const Post = mongoose.model("Post", postSchema, "posts");

module.exports = Post;
