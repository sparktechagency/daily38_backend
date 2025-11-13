import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiError";
import User from "../../model/user.model";
import { SignInData } from "../../types/user"
import { jwtHelper } from "../../helpers/jwtHelper";
import { bcryptjs } from "../../helpers/bcryptHelper";
import generateOTP from "../../util/generateOTP";
import { emailTemplate } from "../../shared/emailTemplate";
import { emailHelper } from "../../helpers/emailHelper";
import { IChangePassword } from "../../types/auth";
import { ACCOUNT_STATUS, USER_ROLES } from "../../enums/user.enums";
import { compare, hash } from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import axios from "axios";
import { IUser } from "../../Interfaces/User.interface";

const signIn = async ( 
    payload : SignInData
) => {
    const { email, password, deviceID } = payload;
    const isUser = await User.findOne({email});
    
    if (!isUser) {
        throw new ApiError(StatusCodes.NOT_FOUND,"Your account is not exist!")
    };
    if (isUser.isSocialAccount.isSocal) {
        throw new ApiError(StatusCodes.BAD_REQUEST,"Your account is a socal account you must login with the "+isUser.isSocialAccount.provider)
    }
    if (!isUser.userVerification) {
        throw new ApiError(
            StatusCodes.NOT_ACCEPTABLE,
            "Your account is not verifyed! Please verify your account!"
        )
    }
    if ( isUser.accountStatus === ACCOUNT_STATUS.DELETE || isUser.accountStatus === ACCOUNT_STATUS.BLOCK ) {
        throw new ApiError(StatusCodes.FORBIDDEN,`Your account was ${isUser.accountStatus.toLowerCase()} pleas contact to admin!`)
    };

    const isTrue = await bcryptjs.compare(password, isUser.password);
    if (!isTrue) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE,"You passwort was wrong!")
    };

    isUser.deviceID = deviceID;
    await isUser.save()

    const token = jwtHelper.createToken({language: isUser.language, role: isUser.role, userID: isUser._id});
    
    return { token }
}

const emailSend = async (
    payload : { 
        email: string
    }
) => {
    const { email } = payload;
    const isUser = await User.findOne({email});
    if (!isUser) {
        throw new ApiError(StatusCodes.NOT_FOUND,`No account exists with this ( ${email} ) email`)
    };

    if ( isUser.accountStatus === ACCOUNT_STATUS.DELETE || isUser.accountStatus === ACCOUNT_STATUS.BLOCK ) {
        throw new ApiError(StatusCodes.FORBIDDEN,`Your account was ${isUser.accountStatus.toLowerCase()}!`)
    };

    if (isUser.isSocialAccount.isSocial) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE,`Your can't set your password on your account because you have create your user with socal credentials!`)
    };
    
    // generate otp
    const otp = generateOTP();

    //Send Mail
    const mail = emailTemplate.sendMail({otp, email,name: isUser.fullName, subjet: "Get OTP"});
    emailHelper.sendEmail(mail);

    await User.updateOne(
        { email },
        {
          $set: {
            'otpVerification.otp': otp,
            'otpVerification.time': new Date(Date.now() + 3 * 60000)
          },
        }
    );
      
    return { email:isUser.email };
}
// 🏃‍♀️‍➡️
const verifyOtp = async (
    payload : { 
        email: string, 
        otp: string
    }
) => {
    const { email, otp } = payload;
    const isUser = await User.findOne({email});
    
    if ( isUser.accountStatus === ACCOUNT_STATUS.DELETE || isUser.accountStatus === ACCOUNT_STATUS.BLOCK ) {
        throw new ApiError(StatusCodes.FORBIDDEN,`Your account was ${isUser.accountStatus.toLowerCase()}!`)
    };

    if (
        !otp || 
        !isUser.otpVerification.otp ||
        isUser.otpVerification.time < new Date( Date.now() )
    ) {
        throw new ApiError(
            StatusCodes.NOT_ACCEPTABLE,
            "Your otp verification in not acceptable for this moment!")
    };

    if (isUser.otpVerification.otp !== otp) {
        throw new ApiError(
            StatusCodes.NOT_ACCEPTABLE,
            "You given a wrone otp!"
        );
    };

    if ( !isUser.userVerification ) {
        await User.updateOne(
            { email },
            {
                $set: {
                    'otpVerification.otp': 0,
                    'otpVerification.time': new Date(),
                    "userVerification": true
                }
            }
        );
        return "Now your account is verifyed!"
    }

    const key = Math.floor(Math.random() * 1000000);
    const hasedKey = await hash(key.toString(),1);

    await User.updateOne(
        { email },
        {
          $set: {
            'otpVerification.otp': 0,
            'otpVerification.time': new Date(),
            'otpVerification.key': key.toString()
          }
        }
    );
      
    return { token: hasedKey };
}

const changePassword = async (
    payload : JwtPayload,
    data: {
        currentPassword: string,
        password: string,
        confirmPassword: string
    }
) => {
    const { userID } = payload;
    const { currentPassword, password, confirmPassword } = data;
    const isUser = await User.findById(userID);
    if (!isUser) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            `No account exists!`
        )
    };
    if ( 
        isUser.accountStatus === ACCOUNT_STATUS.DELETE || 
        isUser.accountStatus === ACCOUNT_STATUS.BLOCK 
    ) {
        throw new ApiError(
            StatusCodes.FORBIDDEN,
            `Your account was ${isUser.accountStatus.toLowerCase()}!`
        )
    };
    
    if (password !== confirmPassword) {
        throw new ApiError(
            StatusCodes.NOT_ACCEPTABLE,
            "Please check your new password and the confirm password!"
        )
    };

    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, isUser.password)
    if (!isCurrentPasswordValid) {
        throw new ApiError(StatusCodes.BAD_REQUEST,"You have gived the wrong old password!")
    };

    const newPassword = await bcryptjs.Hash(password);

    await User.findByIdAndUpdate(isUser._id, { password: newPassword });

    return true;
} 

const forgetPassword = async (
    payload : IChangePassword
) => {
    const { email, password, confirmPassword, token } = payload;
    const isUser = await User.findOne({email});
    if (!isUser) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            `No account exists with this ( ${email} ) email`
        )
    };
    if ( 
        isUser.accountStatus === ACCOUNT_STATUS.DELETE || 
        isUser.accountStatus === ACCOUNT_STATUS.BLOCK 
    ) {
        throw new ApiError(
            StatusCodes.FORBIDDEN,
            `Your account was ${isUser.accountStatus.toLowerCase()}!`
        )
    };
    
    if (password !== confirmPassword) {
        throw new ApiError(
            StatusCodes.NOT_ACCEPTABLE,
            "Please check your new password and the confirm password!"
        )
    };

    if ( !isUser.otpVerification.key ) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "You don't have ganarate any token for change the password"
        )
    };

    const isValid = await compare( isUser.otpVerification.key ,token);
    if (!isValid) {
        throw new ApiError(
            StatusCodes.NOT_ACCEPTABLE,
            "You have inter a wrong token"
        )
    };

    const newPassword = await bcryptjs.Hash(password);
    await User.findByIdAndUpdate(isUser._id, {
        $set:{
            password: newPassword,
            "otpVerification.key": "",
        }
    });

    return true;
} 

const socalLogin = async (
    {
        token,
        provider
    } : {
        provider: string,
        token: string
    }
) => {
    const authUrl = "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos";

    const { data } = await axios.get( authUrl, {
        headers: {
            Authorization: `Bearer ${ token }`
        }
    })

    const isUserExist = await User.findOne({
        email: data.emailAddresses[0].value
    });
    if (!isUserExist) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Your account was not exist! you have to sign up your account!"
        )
    }

    // Create user if there is not any user
    // if ( isUserExist === null ) {
    //     const user = await User.create({
    //         'isSocialAccount.isSocial': true,
    //         'isSocialAccount.provider': provider,
    //         role: USER_ROLES.USER,
    //         password: "--",
    //         email: data.emailAddresses[0].value,
    //         fullName: data.names[0].displayName,
    //         profileImage: data.photos[0].url
    //     })
        
    //     const token = jwtHelper.createToken({language: "en", role: user.role, userID: user._id});
    //     return { token };
    // };

    if ( isUserExist.accountStatus === ACCOUNT_STATUS.DELETE || isUserExist.accountStatus === ACCOUNT_STATUS.BLOCK ) {
        throw new ApiError(StatusCodes.FORBIDDEN,`Your account was ${isUserExist.accountStatus.toLowerCase()}!`)
    };

    const createdToken = jwtHelper.createToken({language: "en", role: isUserExist.role, userID: isUserExist._id});
    
    return { token: createdToken };
} 

const fcmToken = async (
    payload : JwtPayload,
    data: { deviceID: string }
) => {

    const { userID } = payload;
    const { deviceID } = data;
    const isUser = await User.findByIdAndUpdate(userID,{ deviceID }, { new: true });
    if (!isUser) {
        throw new ApiError(StatusCodes.NOT_FOUND,"Your account is not exist!")
    }
    return isUser.deviceID;
}

const createGestUser = async () => {

    const isGestUserExist = await User.findOne({ fullName: "gest user"}).lean().exec() as IUser;
    ;
    let token;
    if(!isGestUserExist){
        const newGestUser = await User.create({
            fullName: "Guest User",
            userVerification: true,
            email: "gest@mail.com",
            role: USER_ROLES.USER,
            password: "12345678"
        } as IUser)
        
        token = jwtHelper.createToken({language: newGestUser.language, role: newGestUser.role, userID: newGestUser._id});

        return { token }
    }

    token = jwtHelper.createToken({language: isGestUserExist.language, role: isGestUserExist.role, userID: isGestUserExist._id});

    return { token }
}

export const AuthServices = {
    signIn,
    createGestUser,
    fcmToken,
    emailSend,
    verifyOtp,
    changePassword,
    socalLogin,
    forgetPassword
}