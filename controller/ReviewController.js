const Review=require('./../models/reviewModel');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const factory=require('./factory');


exports.getReviews=factory.getAll(Review);

exports.getReview=factory.getOne(Review);

exports.setReferenceId= (req,res,next)=>{
    if(!req.body.tour) req.body.tour=req.params.tourId;
    if(!req.body.user) req.body.user=req.user._id;
    next();

};

exports.updateReview=factory.update(Review);

exports.addReview =factory.addNew(Review);

exports.deleteReview=factory.deleteDoc(Review);

