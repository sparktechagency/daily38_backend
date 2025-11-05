import { model, models, Schema, Types } from "mongoose";
import { IPost } from "../Interfaces/post.interface";

const jobPostSchema = new Schema<IPost>(
  {
    projectName: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
    },
    acceptedOffer: {
      type: Schema.Types.ObjectId,
      ref: "offer",
      default: null,
    },
    isOnProject: {
      type: Boolean,
      default: false,
    },
    offers: [
      {
        type: Schema.Types.ObjectId,
        ref: "offer",
      },
    ],
    coverImage: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    latLng: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        default: [0.0, 0.0],
      },
    },
    deadline: {
      type: Date,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    showcaseImages: [
      {
        type: String,
      },
    ],
    autoCreated: {
      type: Boolean,
      defalult: false,
    },
    creatorID: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

jobPostSchema.index({ latLng: "2dsphere" });

// ignore isDelete ture on find
jobPostSchema.pre("find", function () {
  this.where({ isDeleted: false });
});

const Post = model<IPost>("post", jobPostSchema);
export default Post;
