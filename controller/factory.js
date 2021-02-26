const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const APIfeatures=require('./../utils/apiFeatures');


exports.deleteDoc= Model => {
    return catchAsync( async(req,res,next)=>{
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc){
        return next(new AppError('Cannot find document with that ID',404));
    }

    res.status(204).json({
        state:'success',
        data:null
    });
})};

exports.update= Model=>
    catchAsync(async (req,res,next)=>{

    const doc= await Model.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    });

    if(!doc){
        return next(new AppError('Cannot find doc with that ID',404));
    }
    //
    res.status(200).json({
        state:'success',
        data:{
            doc
        }
    });

});


exports.addNew = Model =>
    catchAsync(async(req,res,next)=>{

    const newdoc=await Model.create(req.body);
    res.status(201).json({
        status:'success',
        data:{
            newdoc
        }
    });

});

exports.getOne= (Model, popOptions)=>

    catchAsync(async(req,res,next) => {
        let query= Model.findById(req.params.id);
        if(popOptions) query=query.populate(popOptions);
    const doc=await query;
    if(!doc){
        console.log("running");
        return next(new AppError('Cannot find doc with that ID',404));
    }

    res.status(200).json({
        status:'success',
        data:{
            doc
        }
    });

});


exports.getAll= Model =>
    catchAsync(async(req,res,next)=>{
    //get data from file, parse it to let it return JavaScript object

    // res.status(200).json({
    //     state:'success',
    //     results:x.length,
    //     data:{
    //         tours:x
    //     }
    //

        let filter={};
        if(req.params.tourId) filter={tour:req.params.tourId};//Virtual population for nested route


    //execute it
    const features= new APIfeatures(Model.find(filter),req.query).filter().sort().limitFields().pagination();
    const doc=await features.query;

    //const tours=await Tour.find();
    res.status(200).json({
        status:'success',
        result:doc.length,
        data:{
            doc
        }
    });

});