const express= require('express');
const TourController=require('./../controller/TourController');
const authController=require('./../controller/authController');
const reviewController=require('./../controller/ReviewController');
const reviewRouter=require('./../Routes/ReviewRoutes');
const Router=express.Router();

Router.use('/:tourId/reviews',reviewRouter);

// Router.param('id',TourController.checkID);
Router.route('/getFullstats').get(TourController.getTourStats);//Keep in mind that router itself is a middleware
Router.route('/monthlyReports').get(TourController.monthlyReports);
Router.route('/').get(TourController.getTours).post(authController.roleValidate('admin','guide'),TourController.addTour);

Router.route('/tours-within/:distance/center/:latlgt/unit/:unit').get(TourController.geowithin);

Router.route('/center/:latlgt/unit/:unit').get(TourController.getDistances);

Router.route('/:id')
    .get(TourController.getTour)
    .patch(TourController.uploadTourImages,TourController.resizePhoto,TourController.updateTour)
    .delete(authController.protect,
        authController.roleValidate('user'),
        TourController.deleteTour);

// Router.route('/:tourId/reviews').post(
//     authController.protect,
//     authController.roleValidate('user'),
//     reviewController.addReview
//     );



module.exports=Router;