import { Document, Types } from "mongoose";

export interface IPost extends Document {
  projectName: string;
  coverImage: string;
  isDeleted: boolean
  category: string;
  isOnProject: boolean;
  acceptedOffer: Types.ObjectId,
  subCategory: string;
  location: string;
  autoCreated: boolean
  offers: Types.ObjectId[];
  latLng: {
    type: "Point";
    coordinates: [number, number];
  };
  deadline: Date;
  jobDescription: string;
  showcaseImages: string[];
  creatorID: Types.ObjectId;
  ratings?: {
    stars: number;
    feedback?: string;
    from: Types.ObjectId;
  }[];
  isPaid: boolean
  isOfferApproved: boolean
}


export type Reating = {
    stars: number;
    feedback: string;
    from: Types.ObjectId;
}

export interface IPhotos{
    fildName: string;
    images: File[];
}