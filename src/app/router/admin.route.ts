import { Router } from "express";
import auth from "../../middlewares/Auth.middleware";
import { USER_ROLES } from "../../enums/user.enums";
import validateRequest from "../../middlewares/validateRequest";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { AdminController } from "../controller/admin.controller";
import { AdminValidation } from "../../validation/admin.validation";


const router = Router();

router
    .route("/")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.overView
    )

router
    .route("/engagement")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.engagement
    )

router 
    .route("/customer")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.customers
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.userUpdateSchema ),
        AdminController.updateAccountStatus
    )

router
    .route("/provider")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.providers
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.userUpdateSchema ),
        AdminController.updateAccountStatus
    )

router 
    .route("/payment")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.payments
    )

router
    .route("/category")
    .get(
        // auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER ),
        AdminController.catagroys
    )
    .post(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        validateRequest( AdminValidation.catagorySchema),
        AdminController.newCatagroys
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        AdminController.updateCatagroys
    )
    .delete(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.deleteCatagroys
    )

router
    .route("/sub_category")
    .get(
        // auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER,USER_ROLES.SERVICE_PROVIDER),
        AdminController.allSubCatagroy
    )
    .post(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.newSubCatagroys
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.updateSubCatagroys
    )
    .delete(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.deleteSubCatagroys
    )

router
    .route("/sub_category/:id")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER ),
        AdminController.subCatagroy
    )

router
    .route("/announcements") 
    .get(
        auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER),
        AdminController.getAnnounsments
    )
    .post(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.announcementSchema ),
        AdminController.createAnnounsments
    )
    .put(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.announceUpdate ),
        AdminController.updateAnnounsments
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.changeStatusAndUpdate),
        AdminController.activityControleOfAnnounsments
    )
    .delete(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.deleteAnnouncement ),
        AdminController.deleteAnnounsments
    )

router
    .route("/policy")
    .get(
        // auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        AdminController.getPrivacyPolicy
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.updatedPolicy ),
        AdminController.editeyPolicy
    )

router
    .route("/condition")
    .get(
        // auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        AdminController.termsAndConditions
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.updatedtermsConditions ),
        AdminController.editeConditions
    )
    
router
    .route("/admin-commission")
    .get(
        // auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        AdminController.adminCommission
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.updatedAdminCommission ),
        AdminController.editeAdminCommission
    )

router
    .route("/make")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.allAdmins
    )
    .post(
        auth( USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.addNewAdminSchema ),
        AdminController.newAdmins
    )
    .delete(
        auth( USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.deleteAdminSchema ),
        AdminController.deleteAdmin
    )

router
    .route("/support")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.supportReques
    )
    .post(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        AdminController.giveSupport
    )

router
    .route("/verification-requests")
    .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        AdminController.allVerifications
    )
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( AdminValidation.validationRequest ),
        AdminController.intrackWithRequest
    )

    router
  .route("/performance")
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    AdminController.getPlatformPerformance
  );

router
  .route("/insights")
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    AdminController.getInsights
  );

export const AdminRoter = router;