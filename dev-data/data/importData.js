const fs=require('fs');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const Tour=require('./../../models/tourModel');
const User=require('./../../models/userModel');
const Review=require('./../../models/reviewModel');


dotenv.config({path:'./config.env'});

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=> console.log('DB connection successful'));

const tours= JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users= JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reviews= JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

const importData=async()=>{
    try{
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave:false});
        await Review.create(reviews);
        console.log("Successfully created");
    }
    catch(err){
        console.log(err);
    }
    process.exit();
};

const deleteData= async() =>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Successfully deleted");
    }
    catch(err){
        console.log(err);
    }
    process.exit();
};

const updateData= async() =>{
    try{
        await Tour.updateMany(
            {},
            {
                $set:{'ratingAverage':{$min:5}}
            }

        );
        console.log("Successfully deleted");
    }
    catch(err){
        console.log(err);
    }
    process.exit();
};



importData();