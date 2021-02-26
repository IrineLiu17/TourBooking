const Tour=require('./../models/tourModel');
const User=require('./../models/userModel');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');

exports.getOverview= catchAsync(async (req,res)=>{

    const tours=await Tour.find();

    res.status(200).render('overview',{
        title:'All tours',
        tours:tours
    });
});

exports.getTour= catchAsync(async (req,res,next)=>{
    const tourSlug=req.params.tourslug;
    const tour=await Tour.findOne({
        slug:tourSlug
    }).populate({
        path:'reviews',
        select: 'user rating review'
    });

    if(!tour){
        return next(new AppError('Sorry we cannot find this tour',404));
    }

        res.status(200).render('tourTemplate', {
            title: tour.name,
            tour:tour
        });
});

exports.base=(req,res)=> {
    res.status(200).render('base', {
        tour: 'The Forest Hiker',
    });
};

exports.login=catchAsync(async (req,res)=> {


    res.status(200).render('loginTemplate');
});

exports.getMe=catchAsync(async (req,res)=> {

    res.status(200).render('account');
});

