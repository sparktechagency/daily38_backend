import { Document, Types } from "mongoose";

export interface INotification extends Document {
    for: Types.ObjectId;
    content: string;
    notiticationType: "DELIVERY_REQUEST" | "OFFER" | "NOTIFICATION" | "OFFER_REQUEST" | "COUNTER_OFFER";
    isRead: boolean;
    originalOfferId?: Types.ObjectId, // offer
    requestId?: Types.ObjectId, // deliveryRequest
    data: {
        title: string,// offer
        offerId: Types.ObjectId, // offer
        image: string,// offer
        postId: string, //Post
        orderId: Types.ObjectId, // request
        requestId: Types.ObjectId // request
    }
}