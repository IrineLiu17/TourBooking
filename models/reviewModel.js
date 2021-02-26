//review /rating / createdAt / ref to tour / ref to user
const User=require('./../models/userModel');
const Tour=require('./../models/tourModel');
const mongoose=require('mongoose');
const validator=require('validator');

const reviewSchema=mongoose.Schema({
    review:{
        type:String,
        required:[true,'Mush have a review']
    },
    rating:{
        type: Number,
        min:1,
        max:5
    },

    createdAt: {
        type: Date,
        default: Date.now()
    },

    tour: {
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,'Mush belong to a tour']//Reference the user dataset,we do not even need to import the usermodel
    },

    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'Mush belong to a user']
    }
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});


reviewSchema.pre(/^find/,function(next){
    this.populate({
        path:'user',
        select:'-_id name photo'//-means deselect the attribute
    });
    next();
});


reviewSchema.statics.calAvgRatings=async function(tourId){
    const stats= await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
            $group:{
                _id:'$tour',
                nreviews:{$sum:1},
                avgRatings:{$avg:'$rating'}
            }
        },
    ]);

    console.log(stats);

    if(stats.length>0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingQuantity:stats[0].nreviews,
            ratingAverage:stats[0].avgRatings

        });
    }
    else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingQuantity:0,
            ratingAverage:4.5

        });
    }



};

reviewSchema.index({tour:1,user:1},{unique:true});

reviewSchema.post('save',function(){
    this.constructor.calAvgRatings(this.tour);
});

//FINDBYIDANDUPDATE
//FINDBYIDANDDELETE these two behind the scens are findone
reviewSchema.pre(/^findOneAnd/,async function(next){
    this.doc=await this.findOne();
    next();
});

//CANNOT DO THIS.DOC=AWAIT THIS.FINDONE(), SINCE FOR POST MIDDLEWARE, THE QUERY HAS ALReady been executed
reviewSchema.post(/^findOneAnd/, function(){
    this.doc.constructor.calAvgRatings(this.doc.tour);
});

//QUERY MIDDLEWARE DO NOT HAVE DIRECT ACCESS TO DOCUMENT, FOR FINDBYIDANDUPDATE AND FINDBYIDANDDELETE, WE ONLY HAVE QUERY MIDDLEWARE
const Review=mongoose.model('Review',reviewSchema);

module.exports=Review;