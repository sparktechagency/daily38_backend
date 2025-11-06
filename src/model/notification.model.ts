import { model, models, Schema } from "mongoose";
import { INotification } from "../Interfaces/notification.interface";

const notificationSchema = new Schema<INotification>({
  for:{
    type: Schema.Types.ObjectId,
    ref: "user"
  },
  content: {
    type: String,
    required: true
  },
  notiticationType: {
    type: String,
    default: "NOTIFICATION"
  },
  isRead:{
    type: Boolean,
    default: false
  },
  originalOfferId: {
    type: Schema.Types.ObjectId,
    ref: "offer"
  },
  data: {
    title: {
      type: String,
    },// offer
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "offer"
    }, // offer
    postId: {
      type: Schema.Types.ObjectId,
      ref: "offer"
    }, // offer
    image: {
      type: String
    },// offer
    orderId:{ 
      type: Schema.Types.ObjectId,
      ref: "order"
    }, // request
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "deliveryRequest"
    } // request
  }
},{
  timestamps: true
});

const Notification = models.Notification || model<INotification>('notification', notificationSchema);
export default Notification;