const mongoose=require('mongoose');
const dotenv=require('dotenv');


process.on('uncaughtException',err=>{ //error in the code, have to shut down because node is in unclean state, will have application to restart after crashing
    console.log('UNCAUGHT EXCEPTION');
    console.log(err.name,err.message,err.stack);
    //give server time to finish all the requests and then shut down the application
        process.exit(1); //!!!!!!!!!!!!Uncaught exceptions have nothing to do with the server!

    // console.log(err.name,err.message);
});

//However, this will not!!! catch the errors in the Express middleware functions, errors in middleware functions will call
//the errorController function since it is not operational error, it will return the generic error message

const app=require('./app');
dotenv.config({path:'./config.env'});


//******Important, connect with DB
const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
console.log(DB);
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=> console.log('DB connection successful'));

//process.env.PORT||
const port=3000;

const server=app.listen(port,()=>{
    console.log(`listening to port ${port} now`);
});

//Central place to handle all promise rejections
process.on('unhandledRejection',err=>{
    console.log('UNHANDLED REJECTION');
    server.close(()=>{//give server time to finish all the requests and then shut down the application
        process.exit(1);
    });
    // console.log(err.name,err.message);
});

//********! Ideally errors should really be handled right where they occur, in the problem connecting to the databse, we should of course add
//a catch handler there and not just simply rely on the unhandled callback that we have



