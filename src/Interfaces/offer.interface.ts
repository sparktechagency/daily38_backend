import { Document, Types } from "mongoose";

export enum TrackOfferType {
    OFFER_ON_POST = "offer_On_Post",
    COUNTER_OFFER = "counter_offer",
    DIRECT_OFFER_BY_CUSTOMER = "direct_offer_By_Customer"
}

export interface IOffer extends Document {
    to: Types.ObjectId;
    form: Types.ObjectId;
    projectID: Types.ObjectId;
    status: "DECLINE" | "APPROVE" | "WATING" | "PAID";
    projectName: string;
    category: string;
    budget: number;
    latLng: {
        type: string,
        coordinates: number[]
    },
    jobLocation: string;
    validFor: string,
    deadline: Date;
    startDate: Date;
    endDate: Date;
    description: string;
    companyImages: string[];
    typeOfOffer: "offer" | "counter-offer"
    // updatedByAsif
    isDisabled: boolean
    trackOfferType: TrackOfferType,
    offerId?: Types.ObjectId | null
}