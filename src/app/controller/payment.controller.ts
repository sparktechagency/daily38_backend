import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "../service/payment.service";
import ApiError from "../../errors/ApiError";
import { accountLinks, accounts, checkout } from "../router/payment.route";
import { paymentSuccessfull } from "../../shared/paymentTemplate";
import Offer from "../../model/offer.model";
import User from "../../model/user.model";
import Payment from "../../model/payment.model";
import Order from "../../model/order.model";
import { ACCOUNT_STATUS, USER_ROLES } from "../../enums/user.enums";
import { OFFER_STATUS } from "../../enums/offer.enum";
import { accountBindSuccessfull } from "../../shared/stripeTemplate";
import Post from "../../model/post.model";
import mongoose from "mongoose";
import { IUser } from "../../Interfaces/User.interface";

const payForService = catchAsync(
    async( req: Request, res: Response ) => {
        const payload = (req as any).user;
        const protocol = req.protocol as string;
        const { offerID } = req.body;
        if (!offerID) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Offer id is required!"
            )
        }
        const host = req.headers.host as string;
        const result = await PaymentService.createSession(
            payload,
            {host,protocol},
            {offerID}
        );

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes.OK,
            message: "Now you can pay with the payment url!",
            data: result
        })
    }
)

const verifyUser = catchAsync(async (req: Request, res: Response) => {

    const payload = req.user;

    const user = await User.findById(payload.userID).lean().exec() as IUser;
    if( !user ) throw new ApiError( StatusCodes.NOT_FOUND, "User not found !")
    if ( user.paymentCartDetails) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Account already verified");
    }

    const account = await accounts.create({
        type: 'express',
        email: user.email,
        country: 'US',
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { userId: user._id.toString() }
    });

    const onboardLink = await accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.headers.host}/api/v1/payment/refresh/${account.id}`,
        return_url: `${req.protocol}://${req.headers.host}/api/v1/payment/success/${account.id}`,
        type: "account_onboarding"
    });

    res.json({ data:{url: onboardLink.url} });
})

const successFullSession = catchAsync(
    async( req: Request, res: Response ) => {

        const { id } = req.params;
        const account = await accounts.update(id, {});
        
        if (account?.requirements?.disabled_reason) {
            return res.redirect(`${req.protocol}://${req.get('host')}/api/v1/payment/refresh/${id}`);
        }

        if (!account.payouts_enabled || !account.charges_enabled) {
            return res.redirect(`${req.protocol}://${req.get('host')}/api/v1/payment/refresh/${id}`);
        }

        try {

            const updatedAccount = await accounts.retrieve(id);
            const metadata = updatedAccount.metadata;
            if (!metadata) throw new ApiError( StatusCodes.NOT_ACCEPTABLE, "We don't have your account!")

            const user = await User.findByIdAndUpdate(
                new mongoose.Types.ObjectId(metadata.userId as string),
                { $set: { paymentCartDetails: id } },
                { new: true }
            );

            if (!user) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    `User with ID ${metadata.userId} not found`
                );
            }
            
        } catch (error) {
            console.log(error)
            throw new ApiError (
                500,
                "Some this was wrong!"
            )
        }

        res.send(accountBindSuccessfull);
        
    // const { id } = req.params;
    // const account = await accounts.update(id, {});
    
    // if (
    //     account?.requirements?.disabled_reason &&
    //     account?.requirements?.disabled_reason.indexOf('rejected') > -1
    // ) {
    //     return res.redirect(
    //     `${req.protocol + '://' + req.get('host')}/api/v1/payment/refresh/${id}`,
    //     );
    // }
    // if (
    //     account?.requirements?.disabled_reason &&
    //     account?.requirements?.currently_due &&
    //     account?.requirements?.currently_due?.length > 0
    // ) {
    //     return res.redirect(
    //     `${req.protocol + '://' + req.get('host')}/api/v1/payment/refresh/${id}`,
    //     );
    // }
    // if (!account.payouts_enabled) {
    //     return res.redirect(
    //     `${req.protocol + '://' + req.get('host')}/api/v1/payment/refresh/${id}`,
    //     );
    // }
    // if (!account.charges_enabled) {
    //     return res.redirect(
    //     `${req.protocol + '://' + req.get('host')}/api/v1/payment/refresh/${id}`,
    //     );
    // }
    
    // if (
    //     account?.requirements?.pending_verification &&
    //     account?.requirements?.pending_verification?.length > 0
    // ) {
    //     return res.redirect(`${req.protocol + '://' + req.get('host')}/payment/refresh/${id}`);
    // }
    
    // res.send(accountBindSuccessfull)
    }
)

const refreshSesstion = catchAsync(
    async( req: Request, res: Response ) => {
        
    const { id } = req.params;
    
    const host = req.headers.host as string;
    const protocol = req.protocol as string;
    const account = await accounts.update(id, {});
    
    const onboardLInk = await accountLinks.create({
            account: account.id,
            refresh_url: `${protocol}://${host}/api/v1/payment/refresh/${account.id}`,
            return_url: `${protocol}://${host}/api/v1/payment/success/${account.id}`,
            type: "account_onboarding"
        });

        res.json({ data:{ url: onboardLInk.url } })
    }
)

const PaymentVerify = catchAsync(
    async( req: Request, res: Response ) => {
        
        const sectionID = req.query.session_id as string;

        const session = await checkout.sessions.retrieve(sectionID);
        const metadata = session.metadata;
        if (!session) {
            throw new ApiError(
                StatusCodes.NOT_ACCEPTABLE,
                "Your session was not valid!"
            )
        };
        if (!metadata) {
            throw new ApiError(
                StatusCodes.BAD_GATEWAY,
                "Not found the metadata for verify your payment!"
            )
        };
        
        const offer = await Offer.findById(metadata.offerID);
        
        const user = await User.findById(metadata.userId);
        if ( !user ) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "User not found!"
            )
        };
        if ( !offer ) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Offer not found!"
            )
        };
        const post = await Post.findById(offer.projectID);
        if(post){
            post.isOnProject = true;
            post.isPaid = true;
            await post?.save()
    }

        offer.status = OFFER_STATUS.PAID;
        await offer.save();

        const user1 = await User.findById(offer.to);
        const user2 = await User.findById(offer.form);

        if (!user1 || !user2) {
            throw new ApiError(StatusCodes.NOT_FOUND,"User not founded");
        };
        
        if ( user.accountStatus === ACCOUNT_STATUS.DELETE || user.accountStatus === ACCOUNT_STATUS.BLOCK ) {
            throw new ApiError(StatusCodes.FORBIDDEN,`Your account was ${user.accountStatus.toLowerCase()}!`)
        };

        let customer;
        let provider;

        if (user1.role === USER_ROLES.USER) {
            customer = user1._id;
            provider = user2._id;
        } else if ( user2.role === USER_ROLES.USER ) {
            customer = user2._id;
            provider = user1._id;
        }

        const order = await Order.create(
            {
                offerID : offer._id,
                projectID: offer.projectID, // ❌ updatedByAsif
                customer,
                provider,
                deliveryDate: offer.deadline? offer.deadline : offer.endDate
            }
        );

        user1.orders.push(order._id);
        user2.orders.push(order._id);
        await user1.save();
        await user2.save();

        const paymentForAdminView = await Payment.create({
            userId: user._id,
            orderId: order._id,
            amount: offer.budget,
            commission: metadata.commission
        });

        if (!paymentForAdminView) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Payment was not created during some internal problem!"
            )
        };

        res.send(paymentSuccessfull);
    }
)

export const PaymentController = {
    payForService,
    PaymentVerify,
    verifyUser,
    refreshSesstion,
    successFullSession
}