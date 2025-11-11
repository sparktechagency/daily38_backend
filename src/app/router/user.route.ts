import { Router } from 'express';
import { UserController } from '../controller/user.controller';
import validateRequest from '../../middlewares/validateRequest';
import { Validation } from '../../validation/IO.validation';
import { USER_ROLES } from '../../enums/user.enums';
import auth from '../../middlewares/Auth.middleware';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { UserServices } from '../service/user.service';

const router = Router();

router
    .route("/")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.profile
    )
    .post(
        // validateRequest(Validation.singnUpZodSchema),
        UserController.signupUser
    )
    .put(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        validateRequest(Validation.userUpdateProfileZodSchem),
        UserController.update
    )
    .patch(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest(Validation.updateUserLangouageZodSchem),
        UserController.language
    )
    .delete(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.profileDelete
    )

router
    .route("/rating/:id")
    .get(
        UserServices.getReatings
    )

router
    .route("/provider-rating-summary/:providerId")
    .get(
        UserServices.getRatingsSummary
    )

router
    .route("/status")
    .patch(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.status
    )

router
    .route('/privacy')
    .get(
        // auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.privacy
    )

router
    .route('/condition')
    .get(
        // auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.condition
    )

router
    .route("/image")
    .patch(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        UserController.uploadImages
    )

router
    .route("/post")
    .get(
        auth(USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        UserController.post
    )
    .post(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        fileUploadHandler(),
        validateRequest( Validation.jobPostZodSchem ),
        UserController.createPost
    )
    .put(
        auth( USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        validateRequest( Validation.jobPostZodSchem ),
        UserController.updateJob
    )
    .delete(
        auth(USER_ROLES.SERVICE_PROVIDER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        UserController.deletePost
    )

router
    .route("/post/all")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER,USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN ),
        UserController.allPost
    )

router
    .route("/favorite")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        UserController.getFavorite
    )
    .patch(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        UserController.favorite
    )
    .delete(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        UserController.removeFavorite
    )

router
    .route("/offer")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        UserController.offers
    )
    .post(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ,USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        fileUploadHandler(),
        validateRequest(Validation.offerCreateValidation),
        UserController.cOffer
    )
    .patch(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER , USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        validateRequest( Validation.offerValidation ),
        UserController.IOffer
    )
    .delete(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( Validation.offerDeletaionValidationZod ),
        UserController.DOffer
    )

router 
    .route("/offer-on-post")
    .post(
        auth( USER_ROLES.SERVICE_PROVIDER ),
        fileUploadHandler(),
        UserController.offerOnPost
    )

router 
    .route("/i-offer")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        UserController.iOfferd
    )

router 
    .route("/a-offer")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER ),
        UserController.aOffer
    )

router
    .route("/suport-request")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.getRequests
    )
    .post(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        fileUploadHandler(),
        UserController.supportRequest
    )

router
    .route("/search")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( Validation.searchValidationZod ),
        UserController.searchPosts
    )

router
    .route("/home")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.recommendedPosts
    )

router
    .route("/provider-offer")
    .post(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        fileUploadHandler(),
        UserController.offerOnPost
    )

router
    .route("/counter-offer")
    .post(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.counterOffer
    )

router
    .route("/filter")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.filterPosts
    )

router
    .route("/post/toggle-flagged-or-blocked")
    .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( Validation.toggleFlaggedOrBlockedValidationZod ),
        UserController.toggleFlaggedOrBlocked
    )

router
    .route("/notificaitons")
    .get(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.notifications
    )
    .patch(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        UserController.updateNotifications
    )
    .delete(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        UserController.deleteNotifications
    )

router
    .route("/rating")
    .post(
        auth( USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN ),
        validateRequest( Validation.ratingZodSchema ),
        UserController.giveReting
    )

router
    .route("/a_provider/:id")
    .get(
        auth( 
            USER_ROLES.USER, 
            USER_ROLES.SERVICE_PROVIDER, 
            USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN 
        ),
        UserController.aProvider
    )

router
    .route("/counter-offer")
    .get(
        auth( 
            USER_ROLES.USER, 
            USER_ROLES.SERVICE_PROVIDER, 
            USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN 
        ),
        UserController.aProvider
    )



export const UserRouter = router;