const sharp=require("sharp");
const multer=require("multer");
const catchAsync=require('./../utils/catchAsync');
const appError=require('./../utils/appError');
const User=require('./../models/userModel');
const factory=require('./factory');

// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users');
//     },
//     filename:(req,file,cb)=>{
//         const ext=file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb) =>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new appError('Only support image.'),false);
    }

};

const upload=multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

exports.uploadUserPhoto=upload.single('photo');

exports.resizePhoto = async (req,res,next)=>{
    if(!req.file) next();
    req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/users/${req.file.filename}`);

    next();
};

exports.getUsers=factory.getAll(User);

exports.addUser=(req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route is not yet defined'
    });

};

exports.getUser=factory.getOne(User);

exports.getMe= (req,res,next) =>{
    req.params.id=req.user.id;
    next();
};



const filterObj=(obj,...filterlists)=>{
    const filteredObj={};
    Object.keys(obj).forEach(el=>{
        if (filterlists.includes(el)){
            filteredObj[el]=obj[el];
        }
    });
    return filteredObj;
};

exports.updateUser=catchAsync(async (req,res,next) =>{
    console.log(req.file);

    if(req.body.password||req.body.passwordConfirm){
        return next(new appError('Sorry you cannot change password here',401));
    }

    const filteredReq=filterObj(req.body,'name','email');
    if(req.file) filteredReq.photo=req.file.filename;

    const updatedUser=await User.findByIdAndUpdate(req.user._id,filteredReq,
        {
        new:true,
        runValidator:true});


    res.status(200).json({
        status:'success',
        data:{
            updatedUser
        }
    });


});

exports.deleteUser=catchAsync(async (req,res,next)=>{
    const updatedUser=await User.findByIdAndUpdate(req.user._id,{active:false});


    res.status(204).json({
        status:'success',
        data:null
    });

});

exports.updateUserByAdmin=factory.update(User);
exports.deleteUserByAdmin=factory.deleteDoc(User);
