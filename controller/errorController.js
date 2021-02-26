const AppError=require('./../utils/appError');

const handleCastError = err=>{
    const message=`Invalid ${err.path}:${err.value}`;
    return new AppError(message,400);

};

const handleDuplicateIdError = err=>{
    const value=err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message=`Duplicate value: ${value}, please use another value}`;
    return new AppError(message,400);

};

const handleInvalidValueError = err=>{
    const value=Object.values(err.errors).map(el=>el.message).join('.');
    const message=`${value}`;
    return new AppError(message,400);

};

const handleJWTError=()=>{
    return new AppError('Invalid Token, please log in again',401)
};

const handleTokenExpiredError=()=>{
    return new AppError('Token has expired, please log in again',401)
};



const sendDevError = (err,req,res)=>{
    console.log("here");
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status:err.status,
            message:err.message,
            error:err,
            stack:err.stack
        });
    }
    res.status(err.statusCode).render('error',{
        status:err.status,
        message:err.message,
    });



};

const sendProdError = (err,req,res)=>{
    //1.API
    //Operational error we trust
    if(req.originalUrl.startsWith('/api')){
        if(err.Operational){
            return res.status(err.statusCode).json({
                status:err.status,
                message:err.message,
            });
        }
        //Unknown error, no detail to clients
        else{
            //1)log the error
            console.error('ERROR',err);
            return res.status(500).json({
                status:'error',
                message:'Something went wrong',

            });

        }
    }

    //2.RENDER WEBSITE
    if(err.Operational){
        return res.status(err.statusCode).render('error',{
            status:err.status,
            message:err.message,
        });
    }
    //Unknown error, no detail to clients
    else{
        //1)log the error
        console.error('ERROR',err);
        return res.status(500).render('error',{
            status:'error',
            message:'Something went wrong',

        });

    }



};

module.exports =(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'fail';
    console.log(err.stack);

    if(process.env.NODE_ENV ==='development'){
        sendDevError(err,req,res);
    }
    else if(process.env.NODE_ENV ==='production'){
        let error={...err};
        error.message=err.message;
        if(error.name==='CastError'){
            error=handleCastError(error);

        }
        if(error.code===11000){
            error=handleDuplicateIdError(error);
        }
        if(error.name==='ValidationError'){
            error=handleInvalidValueError(error);

        }

        if(error.name==='JsonWebTokenError'){
            error=handleJWTError(error);

        }

        if(error.name==='TokenExpiredError'){
            error=handleTokenExpiredError(error);

        }
        sendProdError(error,req,res);

    }
};
