const path=require('path');
const express= require('express');
const morgan=require('morgan');
const rateLimit=require("express-rate-limit");
const app=express();
const helmet= require("helmet");
const mongoSanitize=require("express-mongo-sanitize");
const xss=require('xss-clean');
const hpp=require('hpp');
const cookieparser = require('cookie-parser');

const AppError=require('./utils/appError');
const globalErrorHandler=require('./controller/errorController');

const tourRouter=require('./Routes/TourRoutes');
const userRouter=require('./Routes/UserRoutes');
const reviewRouter=require('./Routes/ReviewRoutes');
const ViewRouter=require('./Routes/ViewRoutes');


app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'public')));//serve static file from a folder not from a route
//BY USING EXPRESS STATIC, WE BASICALLY DEFINE THAT ALL THE STATIC ASSETS WILL ALWAYS AUTOMATICALLY BE SERVED FROM A FOLDER CALLED PUBLIC
//SO WITH THIS FOLDER HERE
app.use(helmet());//we need a function not a function call, this will in turn return a function
//and sit there until it is called

//middleware
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'));
}

//Rate limit
const apiLimiter = rateLimit({
    windowMs:60*60*1000,
    max:100,
    message:'Too many requests from this IP, please try later!'
});

app.use("/api/",apiLimiter);



//console log the request
//Body parser, reading data from the body into req.body
app.use(express.json({
    limit:'10kb'
}));
app.use(express.urlencoded({extended:true,limit:'10kb'}));//enable routes to get data from html???
app.use(cookieparser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());//filter out all the dollar signs and dots

//Data sanitization against XSS
app.use(xss());//Prevent html injection, mongoDB wont allow any html stuff go into database


//Prevent parameter pollution
app.use(hpp({
    whitelist:[
        'duration',
        'ratingsQuantity',
        'ratingAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

//serve static file from a folder not from a route
//Separate the handler from the route

app.use((req,res,next) =>{
    req.requestTime=new Date().toISOString();
    next();
});

app.use('/',ViewRouter);
app.use('/api/v1/tours',tourRouter); //If the route was matched here in the toolRouter, it will not reach the following error handling code
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);

//This should be the last part of all the route
app.all('*',(req,res,next)=>{

    // const err=new Error(`Cannot find ${req.originalUrl} on this server`);
    // err.statusCode=404;
    // err.status='fail';
    next(new AppError(`Cannot find ${req.originalUrl} on this server`,404));

    // res.status(404).json({
    //     status:'fail',
    //     message:`${req.originalUrl} cannot find`
    // });
    // next();
});

app.use(globalErrorHandler);

module.exports=app;