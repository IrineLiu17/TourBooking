const mongoose=require('mongoose');
const validator=require('validator');
const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:[true,'A user must have a name'],
    },
    email:{
        type:String,
        required:[true,'A user must have an email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email']
    },
    photo:{
        type:String,
        default:'default.jpg'
    },
    role:{
        type:String,
        enum:['user','admin','guide'],
        default:'user'
    },
    password:{
        type:String,
        required:[true,'A user must have a password'],
        minlength:8,
        select:false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'A user must have a password'],
        validate: {
            validator: function (val) {
                //THIS ONLY WORKS FOR CREATE & SAVE, SO WHEN WE UPDATE THE USER, WE NEED TO USE 'USER.SAVE' NOT FIND BY ID
                //this only points to the current doc on new document creation, update may not gonna work
                return val === this.password;
            },
            message: 'should be the same'
        },
    },
    passwordChangetime:{
        type:Date
    },
    passwordResetToken:{
        type:String,
        default:''
    },
    passwordResetExpireDate:{
        type:Date

    },
    active:{
        type:Boolean,
        default:true,
        select:false
    }

});

//THIS IS DOCUMENT MIDDLEWARE
//Between getting the data and saving it to the database.
userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next(); //if user did not change the password, then do not encrypt it.

    //Hash the password with cost of 12
    this.password=await bcrypt.hash(this.password,12);//We will only save encrypted version data in database

    //Delete the field
    this.passwordConfirm=undefined;//we do not need this value any more, do not need to persisted to database

    next();//Do not forget to call next!!

});

userSchema.pre('save',function(next){//if it is a new document, then this is a new user, do not
    //need to set passwordChange property
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangetime=Date.now()-1000;
    next();//Dont forget!!!!!!!!!!!!!!!!!!!!!!!!!!!!
});

userSchema.pre(/^find/,async function(next){
    this.find({active:{$ne:false}});
    next();
});



userSchema.methods.checkPassword=function(currentPassword,userPassword){
    return bcrypt.compare(currentPassword,userPassword);
};

userSchema.methods.changePasswordAt=function(JWTtimestamp){
    if(this.passwordChangetime){
        const changedTimeStamp=parseInt(this.passwordChangetime.getTime()/1000,10);
        return JWTtimestamp<changedTimeStamp;
    }

    return false;
};

userSchema.methods.passwordReset=async function(){
    const resetToken=crypto.randomBytes(32).toString('hex');//this one will send to email
    this.passwordResetToken= crypto.createHash('sha256') //this one saved to database for comparison
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpireDate=Date.now()+30*60*1000;
    console.log(this);
    return resetToken;


};

const User=mongoose.model('User',userSchema);
module.exports=User;
