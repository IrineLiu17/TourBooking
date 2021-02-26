const {promisify} = require('util');
const jwt=require('jsonwebtoken');
const User=require('./../models/userModel');
const catchAsync=require('./../utils/catchAsync');
const rateLimit=require("express-rate-limit");
const appError=require('./../utils/appError');
const validator=require('validator');
const crypto=require('crypto');
const Email=require('./../utils/email');


const createToken= (user,statusCode,res)=>{
    const token=signToken(user._id);

    const jwtOptions={
        expires:new Date(Date.now()+90*24*60*60*1000),
        httpOnly:true
    };

    if(process.env.NODE_ENV==='production'){
        jwtOptions.secure=true;//ecrypted Http request
    }


    res.cookie('jwt',token,jwtOptions);

    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }

    });

};

const signToken=function(id){

    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });

};

exports.signup=catchAsync(async(req,res,next)=>{
    const newUser=await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        role:req.body.role,
        passwordConfirm:req.body.passwordConfirm
    });

    const url=`${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser,url).sendWelcome();

    //Only get the info we need

    //we can then edit the role of the user in the
    //MongoDB manually to set the admin

    createToken(newUser,201,res);
    // const token=signToken(newUser._id);
    //
    // res.status(201).json({
    //     status:'success',
    //     token,
    //     data:{
    //         user:newUser
    //     },
    // });
});

exports.logout = (req,res)=>{
    const jwtOptions={
        expires:new Date(Date.now()+10*1000),
        httpOnly:true
    };
    res.cookie('jwt','loggedout',jwtOptions);
    res.status(200).json({status:'success'});

};


exports.login=catchAsync(async(req,res,next)=>{

    //1. If email or password exist, use ES6 deconstructing
    const {email,password}=req.body;

    if(!email || !password){
        return next(new appError('Please provide the information needed',401))
    }


    //2. If user exists and password correct, build the test methods
    // in user Model??

    const user=await User.findOne({email}).select('+password');

    if(!user|| !await user.checkPassword(password,user.password)){
        return next(new appError('Please check your password or email',401))

    }

    //3. Send user back the token, SEND BACK TO HEADER?????????????????
    createToken(user,200,res);

});


exports.protect=(async(req,res,next)=>{
    //1. token exist
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token=req.headers.authorization.split(" ")[1];
    }
    else if(req.cookies.jwt){
        token=req.cookies.jwt;//Authenticate user based on jwt sent by cookies
    }

    if(!token){
        return next(new appError('Sorry you have not logged in', 401));
    }

    //2.Validate token
    const decode=await promisify(jwt.verify)(token,process.env.JWT_SECRET);

    //3.Check if user still exists
    const currentUser=await User.findById(decode.id);
    if(!currentUser){
        return next(new appError('The user does not exist',401));
    }

    //4.Check if user change the password???

    const results=currentUser.changePasswordAt(decode.iat);
    if(results){
        return next(new appError('User has changed password',401));
    }

    req.user=currentUser;//next middleware can access this user info
    res.locals.user=currentUser;//all templates can access user info
    // request obj travels from obj to obj we can then use it in other middleware
    next();
} );

exports.isLogin=async (req,res,next)=>{

    if(req.cookies.jwt) {
        try{
            //2.Validate token
            const decode = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            //3.Check if user still exists
            const currentUser = await User.findById(decode.id);
            if (!currentUser) {
                return next();
            }

            //4.Check if user change the password???

            const results = currentUser.changePasswordAt(decode.iat);
            if (results) {
                return next();
            }

            res.locals.user=currentUser; //All the templates will have access to res.locals
            // request obj travels from obj to obj we can then use it in other middleware
            return next();
        }
        catch(err){
            return next();
        }

    }
    next();

};


exports.roleValidate=(...roles)=>{
    return (req,res,next) => {
        console.log(roles,typeof roles);
        if(!roles.includes(req.user.role)){
            return next(new appError('Sorry you are not allowed to perform this',403));
        }

        next();

    }
};


exports.forgetPassword=catchAsync(async(req,res,next)=>{
    //1. Get user email address
    const {email}=req.body;
    const user = await User.findOne({email});
    console.log(user);

    if(!user){
        return next(new appError('Cannot find this user',404));
    }

    //2. generate random token
    const resetToken=await user.passwordReset();
    console.log(user.passwordResetToken);

    await user.save({validateBeforeSave:false});

    console.log(user);//Very Important!!!!!!!!!!!!!!!!


    //Send Email

    const message=`link to reset your password ${resetURL}`;
    try{
        // await sendEmail({
        //     email:user.email,
        //     subject:'Your password reset token',
        //     message
        // });

        const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user,resetURL).sendPasswordReset();

        res.status(200).json({
            status:'success',
            message:'Token has been sent'
        });
    }
    catch(err){
        user.passwordResetToken=undefined;
        user.passwordResetExpireDate=undefined;
        await user.save({validateBeforeSave:false});

        return next(new appError('Something wrong with setting up email, please try again later',500));

    }


});

exports.resetPassword=catchAsync(async(req,res,next)=>{
    //1. Get resetToken
    const resetToken=req.params.token;
    const hashToken = crypto.createHash('sha256') //this one saved to database for comparison
        .update(resetToken)
        .digest('hex');
    console.log(hashToken);

    //2. Find User

    const user=await User.findOne({passwordResetToken:hashToken, passwordResetExpireDate:{$gt:Date.now()}});

    if(!user){
        return next(new appError('Token is not valid, please check the token or reset again',400));
    }
    const {password,passwordConfirm}=req.body;
    user.password=password;
    user.passwordConfirm=passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpireDate=undefined;
    await user.save();

    //3. Change password change at property


    //4. log user in
    createToken(user,200,res);

});

exports.updatePassword=catchAsync(async(req,res,next)=>{
    const {currentPassword,password,passwordConfirm}=req.body;
    const user=await User.findById(req.user._id).select('+password');
    if(!user|| !await user.checkPassword(currentPassword,user.password)){
        return next(new appError('Your password is not correct',401));

    }
    if(password!==passwordConfirm){
        return next(new appError('Please check your password again',400));
    }

    user.password=password;
    user.passwordConfirm=passwordConfirm;
    await user.save();

    //log user in
    createToken(user,200,res);

});

exports.passwordLimit= rateLimit({
        max:3,
        windowMs:5*60,
        message:"Too many attempts!"
    });

