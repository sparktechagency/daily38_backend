import { model, models, Schema } from "mongoose";
import { IUser } from "../Interfaces/User.interface";
import { ACCOUNT_STATUS, ACCOUNT_VERIFICATION_STATUS, ACCOUTN_ACTVITY_STATUS, SELECTED_LANGUAGE, USER_ROLES } from "../enums/user.enums";

const userSchema = new Schema<IUser>({
  role: { 
    type: String, 
    enum: USER_ROLES, 
    required: true 
  },
  userVerification: { 
    type: Boolean,
    default: false
  },
  fullName: {
    type: String,
    default: "",
    min: 6,
    max: 100,
    trim: true
  },
  description: {
    type: String,
    default: "",
    min: 6,
    trim: true   
  },
  email: { 
    type: String,
    trim: true
  },
  category:{
    type: String,
    default: ""
  },
  subCategory:{
    type: String,
    default: ""
  },
  deviceID:{
    type: String
  },
  job:[{
    type: Schema.Types.ObjectId,
    ref: "post"
  }],
  favouriteServices:[{
    type: Schema.Types.ObjectId,
    ref: "post"
  }],
  favouriteProvider:[{
    type: Schema.Types.ObjectId,
    ref: "user"
  }],
  iOffered:[{
    type: Schema.Types.ObjectId,
    ref: "offer"
  }],
  myOffer:[{
    type: Schema.Types.ObjectId,
    ref: "offer"
  }],
  orders:[{
    type: Schema.Types.ObjectId,
    ref: "order"
  }],
  searchedCatagory: {
    type: [ String ],
    default: []
  },
  city:{
    type: String,
    trim: true,
    min: 3,
    default: ""
  },
  postalCode:{
    type: String,
    trim: true,
    min: 4,
    default: ""
  },
  address:{
    type: String,
    trim: true,
    min: 7,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ""
  },
  samplePictures: {
    type: [String],
    default: []
  },
  counterOffers:{
    type: [Schema.Types.ObjectId],
    ref: "offer"
  },
  profileImage: {
    type: String,
    default: ""
  },
  accountActivityStatus: { 
    type: String, 
    enum: ACCOUTN_ACTVITY_STATUS, 
    default: ACCOUTN_ACTVITY_STATUS.ACTIVE 
  },
  accountStatus: {
    type: String,
    enum: ACCOUNT_STATUS,
    default: ACCOUNT_STATUS.ACTIVE
  },
  language: { 
    type: String, 
    enum: SELECTED_LANGUAGE,
    default: SELECTED_LANGUAGE.ENGLISH 
  },
  isVerified: { 
    doc: String,
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ACCOUNT_VERIFICATION_STATUS,
      default: ACCOUNT_VERIFICATION_STATUS.UNVERIFIED
    }
  },
  accountBalance:{
    type: Number,
    default: 0
  },
  otpVerification:{
    otp: Number,
    time: Date,
    key: String,
  },
  privacyPolicy:{
    type: String,
    trim: true
  },
  adminCommissionPercentage:{
    type: Number,
    default: 5
  },
  termsConditions:{
    type: String,
    trim: true
  },
  isSocialAccount:{
    isSocal:{
      type: Boolean,
      default: false
    },
    provider:{
      type: String,
      default: ""
    },
    socialIdentity:{
      type: String
    }
  },
  paymentCartDetails:{type:String},
  ratings: [
    {
      stars: {
        type: Number,
      },
      feedback: {
        type: String,
      },
      from: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
      date: {
        type: Date,
        default: Date.now
      }
    },
  ],
  latLng: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0.0044,0.2333]
    },
  },
},{
  timestamps: true
});

userSchema.index({ latLng: '2dsphere' });

const User = models.User || model<IUser>('user', userSchema);
export default User;