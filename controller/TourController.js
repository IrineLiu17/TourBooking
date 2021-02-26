const sharp=require("sharp");
const multer=require("multer");
const fs=require('fs');
const Tour=require('./../models/tourModel');
const APIfeatures=require('./../utils/apiFeatures');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const factory=require('./factory');
//
// const x=JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));
// //URL format:api/v1/tours: then it will be easy to update the version
// //need to read the file outside of the app.get, WHY????

// exports.checkID=(req,res,next,id) =>{
//     if(id>x.length){
//         res.status(404).json({
//             status:'fail',
//             message:'Invalid ID'
//         });
//     }
//     next();
// };


const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb) =>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new AppError('Only support image.'),false);
    }

};

const upload=multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

exports.uploadTourImages=upload.fields([
        {name:"imageCover",maxCount:1},
        {name:"images",maxCount:3}
]);

exports.resizePhoto = catchAsync(async (req,res,next)=>{

    if(!req.files.imageCover || !req.files.images) next();

    req.body.imageCover=`tours-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${req.body.imageCover}`);


    //
    req.body.images=[];
    await Promise.all(
        req.files.images.map(async (file,index)=>{
        const filename=`tours-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
        await sharp(file.buffer)
            .resize(2000,1333)
            .toFormat('jpeg')
            .jpeg({quality:90})
            .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    }));

    console.log(req.body);

    next();



});


exports.getTours= factory.getAll(Tour);
exports.getTour= factory.getOne(Tour,'reviews');

//Cannot call a function, we need to return a function, and save it to the routes
exports.addTour = factory.addNew(Tour);
// catchAsync(async(req,res,next)=>{
//
//     const newTour=await Tour.create(req.body);
//     res.status(201).json({
//         status:'success',
//         data:{
//             tour:newTour
//         }
//     });
//
// });

exports.updateTour= factory.update(Tour);
//     catchAsync(async (req,res,next)=>{
//
//     const tour= await Tour.findByIdAndUpdate(req.params.id,req.body,{
//         new:true,
//         runValidators:true
//     });
//
//     if(!tour){
//         return next(new AppError('Cannot find tour with that ID',404));
//     }
//     //
//     res.status(200).json({
//         state:'success',
//         data:{
//             tour
//         }
//     });
//
// });

exports.deleteTour=factory.deleteDoc(Tour);

// exports.deleteTour=catchAsync(async(req,res,next)=>{
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if(!tour){
//         return next(new AppError('Cannot find tour with that ID',404));
//     }
//
//     res.status(204).json({
//         state:'success',
//         data:null
//     });
// });

exports.getTourStats=catchAsync(async(req,res,next)=>{

    const stats=await Tour.aggregate([
    {
        $match:{ratingAverage:{$gte:4.5}}
    },
    // {
    //     $group:{
    //         _id:null,
    //         avgRating:{$avg: '$ratingAverage'},
    //         avgPrice:{$avg:'$price'},
    //         minPrice:{$min:'$price'},
    //         maxPrice:{$max:'$price'}
    //
    //     }
    // }
    ]);
    res.status(200).json({
        status:'success',
        data:{
            stats
        }
    });

});

exports.monthlyReports=catchAsync(async (req,res,next)=>{

    const year=req.params.year*1;
    const plan=await Tour.aggregate([
        {
            $unwind:'$startDates'
        },
        {
            $match:
                {startDates:
                    {
                        $gte:new Date("2021-01-01"),
                        $lte:new Date("2021-12-31")
                    }
                }
        },
        {
            $group:{
                _id:{$month:'$startDates'},
                numTourStats:{$sum:1},
                tours:{$push:'$name'}

            }

        },
        {
            $addFields:{//******Existing fields!!!!
                month:'$_id'
            }
        },
        {
            $project:{
                _id:0,
                numTourStats:1,
                tours:1,
                month:1
            }
        },
        {
            $sort:{numTourStats:-1,month:-1}
        },
        { $limit : 5 }
    ]);
    res.status(200).json({
        status:'success',
        data:{
            plan
        }
    });

    });

//'/tours-within/:distance/center/:latlgt/unit/:unit'
exports.geowithin=catchAsync(async (req,res,next)=>{
    const {distance,latlgt,unit}=req.params;

    const [lat,lgt]=latlgt.split(',');

    if(!lat || !lgt){
        return next(new AppError('Start location is invalid',400));
    }
    const radius=unit==='mi'? distance/3963.2 : distance/6378.1;
    const tours=await Tour.find({startLocation:{$geoWithin:{$centerSphere:[[lgt,lat],radius]}}});

    res.status(200).json({
        status:'success',
        results:tours.length,
        data:{
            tours
        }
    });
});

//'/center/:latlgt/unit/:unit'
exports.getDistances=catchAsync(async (req,res,next)=>{
    const {latlgt,unit}=req.params;
    const [lat,lgt]=latlgt.split(",");
    if(!lat || !lgt){
        return next(new AppError('Start location is invalid',400));
    }

    const multiplier=unit==='mi'? 0.000621371 : 0.001;
    const distances=await Tour.aggregate([
        {
            $geoNear:{//it requires that at least one of our fields contains a geospatial index, we only have one field has 2dsphere index,
                // but if you have multiple fields, then we need to use the key parameter
                near:{
                    type:'Point',
                    coordinates:[lgt*1,lat*1]
                },
                distanceField:'distance',
                distanceMultiplier:multiplier
            }
        },
        {
            $project:{
                distance:1,
                name:1
            }
        }

    ]);

    res.status(200).json({
        status:'success',
        data:{
            distances
        }
    });


});