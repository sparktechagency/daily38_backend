import { model, models, Schema } from "mongoose";
import { IOffer, TrackOfferType } from "../Interfaces/offer.interface";
import { OFFER_STATUS } from "../enums/offer.enum";
import e from "express";

const offerSchema = new Schema<IOffer>({
  to: {
    type: Schema.Types.ObjectId,
    ref: "user"
  },
  form: {
    type: Schema.Types.ObjectId,
    ref: "user"
  },
  projectID:{
    type: Schema.Types.ObjectId,
    ref: "post"
  },
  projectName:{
    type: String,
    trim: true
  },
  category:{
    type: String,
    trim: true
  },
  budget:{
    type: Number,
    trim: true
  },
  jobLocation:{
    type: String,
    trim: true
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
      default: [0.0,0.0]
    },
  },
  deadline:{
    type: Date,
  },
  validFor:{
    type: String,
    default: ""
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  description:{
    type: String,
    trim: true,
    min: 8
  },
  status:{
    type: String,
    enum: OFFER_STATUS,
    default: OFFER_STATUS.WATING
  },
  companyImages:[{
    type: String,
    trim: true
  }],
  typeOfOffer:{
    type: String,
    enum: ["offer","counter-offer"],
    default: "offer"
  },
  // updatedByAsif
  isDisabled:{
    type: Boolean,
    default: false
  },
  trackOfferType:{
    type: String,
    enum: TrackOfferType,
    required: true
  },
  offerId:{
    type: Schema.Types.ObjectId,
    ref: "offer"
  }
},{
  timestamps: true
});

const Offer = model<IOffer>('offer', offerSchema);
export default Offer;