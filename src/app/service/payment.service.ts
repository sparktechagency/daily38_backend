import { JwtPayload } from "jsonwebtoken"
import User from "../../model/user.model";
import { StatusCodes } from "http-status-codes";
import { ACCOUNT_STATUS } from "../../enums/user.enums";
import ApiError from "../../errors/ApiError";
import { accountLinks, accounts, checkout, transfers } from "../router/payment.route";
import Order from "../../model/order.model";
import Offer from "../../model/offer.model";
import { makeAmountWithFee } from "../../helpers/fee";
import { OFFER_STATUS } from "../../enums/offer.enum";

const createSession = async (
    payload: JwtPayload,
    server:{
        host: string,
        protocol: string
    },
    data: {
        offerID: string
    }
) => {
    const { host, protocol} = server;
    const { userID } = payload;
    const isUser = await User.findById(userID);
    
    if (!isUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, `No account exists!`);
    }

    if (
        isUser.accountStatus === ACCOUNT_STATUS.DELETE ||
        isUser.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
        throw new ApiError(StatusCodes.FORBIDDEN, `Your account was ${isUser.accountStatus.toLowerCase()}!`);
    }

    const offer = await Offer.findById(data.offerID);
    if (!offer) {
       throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Offer not founded!"
       )
    };

    if (offer.status == OFFER_STATUS.PAID) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "This offer was already payed and a project was already started!"
        )
    }

    const paymentAmout = Math.floor(offer.budget * 100);

    const lineItems = [
        {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Amount',
                },
                unit_amount: paymentAmout,
            },
            quantity: 1,
        },
    ];

    const adminComission = await makeAmountWithFee(offer.budget);

    // Create checkout session
    const session = await checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${protocol}://${host}/api/v1/payment/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${protocol}://${host}/api/v1/payment/cancel`,
        line_items: lineItems,
        metadata: {
            commission: adminComission,
            userId: String(userID),
            offerID: String(offer._id.toString()),
        },
    });

    return { session_url: session.url };
};

const verifyProvider = async (
    payload: JwtPayload,
    server:{
        host: string,
        protocol: string
    },
) => {
    const { host, protocol } = server;
    const { userID } = payload;
    const user = await User.findById(userID);
    if (!user) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "User not found!"
        )
    };

    if (
        user.accountStatus === ACCOUNT_STATUS.DELETE ||
        user.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
        throw new ApiError(StatusCodes.FORBIDDEN, `Your account was ${user.accountStatus.toLowerCase()}!`);
    };

    if ( user.paymentCartDetails !== "" || user.paymentCartDetails != undefined || user.paymentCartDetails !== null ) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "You account was already verifyed!"
        )
    };

    const account = await accounts.create({
        type: 'express',
        email: user.email,
        country: 'US',
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        }
    });
    
    let url;

    const onboardLInk = await accountLinks.create({
        account: account.id,
        refresh_url: `${protocol}://${host}/api/v1/payment/refresh/${account.id}`,
        return_url: `${protocol}://${host}/api/v1/payment/return?accountId=${account.id}&userId=${user._id}`,
        type: "account_onboarding"
    })
    url = onboardLInk.url;

    return {
        url
    }
};

const payoutToUser = async (
    payload: JwtPayload, 
    orderID: any
) => {
    const { userID } = payload;
    if (!orderID) {
        throw new ApiError(StatusCodes.NOT_FOUND, "You must provide the order id for the payment when it's complete!");
    }

    const user = await User.findById(userID);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    }

    const order = await Order.findById(orderID).populate("offerID", "budget");
    if (!order) {
        throw new ApiError(StatusCodes.BAD_GATEWAY, "We didn't find the order to pay you back!");
    }

    if (!order.isProgressDone) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You haven't completed the order process!");
    }

    if (!user.paymentCartDetails) {
        throw new ApiError(StatusCodes.EXPECTATION_FAILED, "We didn't find your payment method!");
    }

    // Create transfer to user
    const transfer = await transfers.create({
        amount: await makeAmountWithFee( order.offerID.budget  ) * 100, // Convert to cents
        currency: 'usd',
        destination: user.paymentCartDetails,
    });

    if (!transfer) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to transfer funds to the user!");
    }

    return transfer;
};

export const PaymentService = {
    createSession,
    // chargeCustomer,
    verifyProvider,
    payoutToUser
};