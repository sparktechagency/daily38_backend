import { Request, Response, Router } from "express";
import auth from "../../middlewares/Auth.middleware";
import { USER_ROLES } from "../../enums/user.enums";
import { PaymentController } from "../controller/payment.controller";
import Stripe from "stripe";
import config from "../../config";
import { errorOnPayment } from "../../shared/paymentTemplate";
import User from "../../model/user.model";
import mongoose from "mongoose";
import ApiError from "../../errors/ApiError";
import { StatusCodes } from "http-status-codes";

const router = Router();

export const {
  checkout,
  customers,
  paymentIntents,
  transfers,
  accounts,
  accountLinks,
} = new Stripe(config.strip_secret_key!);

router
  .route("/pay")
  .post(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.USER
    ),
    PaymentController.payForService
  );

router.route("/verify").post(
  auth(
    USER_ROLES.SERVICE_PROVIDER
    // USER_ROLES.SUPER_ADMIN,
    // USER_ROLES.ADMIN,
    // USER_ROLES.USER
  ),
  PaymentController.verifyUser
);

router.route("/success/:id").get(PaymentController.successFullSession);

router
  .route("/payment-records")
  .get(
    auth(USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER),
    PaymentController.PaymentRecords
  );

router.route("/payment-success").get(PaymentController.PaymentVerify);

router.route("/refresh/:id").get(PaymentController.refreshSesstion);

router.route("/return").get(async (req, res) => {
  const { accountId, userId } = req.query;

  if (!userId || !accountId) {
    throw new ApiError(
      StatusCodes.BAD_GATEWAY,
      "We can't find the details for userId and accountId"
    );
  }

  try {
    const user = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId as string),
      { $set: { paymentCartDetails: accountId } },
      { new: true }
    );

    if (!user) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `User with ID ${userId} not found`
      );
    }

    console.log("Updated User:", user);

    res.send("Successfully set up the account!");
  } catch (error) {
    console.error(error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "An error occurred while setting up the account"
    );
  }
});

router.route("/failed").get((req: Request, res: Response) => {
  res.send(errorOnPayment);
});

router
  .route("/stripe/login-link")
  .get(
    auth(USER_ROLES.SERVICE_PROVIDER),
    PaymentController.stripeLoginLink
  );

router
  .route("/stripe/transactions/statement")
  .get(
    auth(USER_ROLES.SERVICE_PROVIDER),
    PaymentController.stripeTransactionsStatement
  );

router
  .route("/stripe/transactions/withdraw")
  .post(
    auth(USER_ROLES.SERVICE_PROVIDER),
    PaymentController.stripeTransactionsWithdraw
  );

export const PaymentRoute = router;
