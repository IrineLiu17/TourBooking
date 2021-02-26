class AppError extends Error{//Use this class to create all the errors in our application
    constructor(message,statusCode){
        super(message);

        this.statusCode=statusCode;
        this.status= `${statusCode}`.startsWith('4')?'fail':'error';
        this.Operational=true;
        //StackTrace: Where the error happens

        Error.captureStackTrace(this,this.constructor);

    }
}

module.exports=AppError;