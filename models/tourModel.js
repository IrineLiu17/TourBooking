const mongoose=require('mongoose');
const validator=require('validator');
const User=require('./userModel');
const slugify = require('slugify');

const tourSchema=mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour must have less than 40'],
        minlength: [10, 'A tour must have longer than 40'],
        //validate:validator.isAlpha //we dont call it
    },
    slug:{
        type:String
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a group difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Invalid difficulty'
        }
    },
    ratingAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set:val=>Math.round(val*10)/10
    },
    ratingQuantity: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 4.5,
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],

    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //this only points to the current doc on new document creation, update may not gonna work
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [{
        type:mongoose.Schema.ObjectId,
        ref:'User'//Reference the user dataset,we do not even need to import the usermodel
    }]
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true},


});

//To improve the read performance~~~!!! not let mongoDB read all doc one by one when querying one doc
tourSchema.index({price:1,ratingAverage:-1});//Compound index, which fields are queried the most? Dont overdo index
tourSchema.index({slug:1});
tourSchema.index({startLocation:'2dsphere'});//SET THE GEOSPATIAL INDEX HERE

tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
});

tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField:'_id'
});


//THIS IS QUERY MIDDLEWARE
tourSchema.pre('save',function(next){
    this.slug=slugify(this.name);
    next();
});
tourSchema.pre(/^find/,function(next){
    this.populate({//only populate and fill up the reference data for the query not for the dataset
        path:'guides',
        select:'-__v -passwordChangeAt'
    });
    next();
});
// tourSchema.pre('save', async function(next){
//     //when written in one line, do not need the return statement
//     const guidesPromises=this.guides.map(async guide=> await User.findById(guide));
//     console.log(guidesPromises);
//     this.guides=await Promise.all(guidesPromises);
//
//     next();
// });



//'THIS' IN AGGREGATION MIDDLEWARE WILL POINT TO CURRENT AGGREGATION OBJECT
const Tour=mongoose.model('Tour',tourSchema);

module.exports=Tour;