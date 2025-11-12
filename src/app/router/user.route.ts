import { Router } from "express";
import { UserController } from "../controller/user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { Validation } from "../../validation/IO.validation";
import { USER_ROLES } from "../../enums/user.enums";
import auth from "../../middlewares/Auth.middleware";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { UserServices } from "../service/user.service";
import { generatePDFByPuppeteer } from "../../util/pdf/generatePDF";
import { emailTemplate } from "../../shared/emailTemplate";
import { generatePDFKit, IOrderDetails } from "../../util/pdf/generateInvoice";
import config from "../../config";

const router = Router();

router
  .route("/")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.profile
  )
  .post(
    // validateRequest(Validation.singnUpZodSchema),
    UserController.signupUser
  )
  .put(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    validateRequest(Validation.userUpdateProfileZodSchem),
    UserController.update
  )
  .patch(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    validateRequest(Validation.updateUserLangouageZodSchem),
    UserController.language
  )
  .delete(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.profileDelete
  );

router.route("/rating/:id").get(UserServices.getReatings);

router
  .route("/provider-rating-summary/:providerId")
  .get(UserServices.getRatingsSummary);

router
  .route("/status")
  .patch(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.status
  );

router.route("/privacy").get(
  // auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
  UserController.privacy
);

router.route("/condition").get(
  // auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
  UserController.condition
);

router
  .route("/image")
  .patch(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    UserController.uploadImages
  );

router
  .route("/post")
  .get(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.post
  )
  .post(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    validateRequest(Validation.jobPostZodSchem),
    UserController.createPost
  )
  .put(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    validateRequest(Validation.jobPostZodSchem),
    UserController.updateJob
  )
  .delete(
    auth(
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.deletePost
  );

router
  .route("/post/all")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.allPost
  );

router
  .route("/favorite")
  .get(
    auth(USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER),
    UserController.getFavorite
  )
  .patch(
    auth(USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER),
    UserController.favorite
  )
  .delete(
    auth(USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER),
    UserController.removeFavorite
  );

router
  .route("/offer")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.offers
  )
  .post(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    validateRequest(Validation.offerCreateValidation),
    UserController.cOffer
  )
  .patch(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    validateRequest(Validation.offerValidation),
    UserController.IOffer
  )
  .delete(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    validateRequest(Validation.offerDeletaionValidationZod),
    UserController.DOffer
  );

router
  .route("/offer-on-post")
  .post(
    auth(USER_ROLES.SERVICE_PROVIDER),
    fileUploadHandler(),
    UserController.offerOnPost
  );

router
  .route("/i-offer")
  .get(
    auth(USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER),
    UserController.iOfferd
  );

router
  .route("/a-offer")
  .get(
    auth(USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER),
    UserController.aOffer
  );

router
  .route("/suport-request")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.getRequests
  )
  .post(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    UserController.supportRequest
  );

router
  .route("/search")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    validateRequest(Validation.searchValidationZod),
    UserController.searchPosts
  );

router
  .route("/home")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.recommendedPosts
  );

router
  .route("/provider-offer")
  .post(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    UserController.offerOnPost
  );

router
  .route("/counter-offer")
  .post(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.counterOffer
  );

router
  .route("/filter")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.filterPosts
  );

router
  .route("/post/toggle-flagged-or-blocked")
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(Validation.toggleFlaggedOrBlockedValidationZod),
    UserController.toggleFlaggedOrBlocked
  );

router
  .route("/notificaitons")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.notifications
  )
  .patch(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.updateNotifications
  )
  .delete(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.deleteNotifications
  );

router
  .route("/rating")
  .post(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    validateRequest(Validation.ratingZodSchema),
    UserController.giveReting
  );

router
  .route("/a_provider/:id")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.aProvider
  );

router
  .route("/counter-offer")
  .get(
    auth(
      USER_ROLES.USER,
      USER_ROLES.SERVICE_PROVIDER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    UserController.aProvider
  );

router.route("/test-generate-pdf").post(async (req, res) => {
  //   console.log(
  //     "pdf generations stats=====at reqestAction service=======provider.service.ts==========>"
  //   );
  //   // generate invoice for order
  //   const invoiceTemplate = emailTemplate.paymentHtmlInvoice({
  //     postID:" 'project?._id'",
  //     orderId:" order?._id",
  //     paymentID:" payment_details?._id",
  //     postName:" project?.projectName",
  //     postDescription:" project?.jobDescription.slice(0, 500)",
  //     customerName:" order?.customer?.fullName",
  //     customerEmail:" order?.customer?.email",
  //     providerName:" order?.provider?.fullName",
  //     providerEmail:" order?.provider?.email",
  //     totalBudgetPaidByCustomer:100,
  //     adminCommission:10,
  //     adminCommissionPercentage:10,
  //     providerReceiveAmount:10,
  //   });
  //   const { pdfFullPath, pdfPathForDB } = await generatePDF(
  //     invoiceTemplate,
  //     "payment_details?._id"
  //   );

  //   console.log(
  //     "pdf generations ends=====at reqestAction service=======provider.service.ts==========>"
  //   );

  const order: IOrderDetails = {
    postID: "POST123",
    orderId: "ORD456",
    paymentID: "PAY789",
    postName: "Website Development",
    postDescription: "Full-stack web app with React & Node.js",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    providerName: "Jane Smith",
    providerEmail: "jane@provider.com",
    totalBudgetPaidByCustomer: 5000,
    adminCommission: 500,
    providerReceiveAmount: 4500,
    adminCommissionPercentage: 10,
  };
  let resultOfGeneratePDFKit: { pdfFullPath: string; pdfPathForDB: string } = await generatePDFKit(order)
    .then((result) => {
      console.log("PDF saved at:", result);
      return result;
    })
    .catch((err) => console.error("Error:", err));

  res.json({
    pdfPathForDB: `${config.backendBaseUrl}${resultOfGeneratePDFKit.pdfPathForDB}`,
    pdfFullPath: resultOfGeneratePDFKit.pdfFullPath,
  });
});

export const UserRouter = router;
