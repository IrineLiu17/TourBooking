const express= require('express');
const app=express();
const ReviewController=require('./../controller/ReviewController');
const authController=require('./../controller/authController');
const Router=express.Router({mergeParams:true});//By default, each route only have access to their specific routes

Router.use(authController.protect);
Router.route('/').get(ReviewController.getReviews)
    .post(authController.protect,authController.roleValidate('user'),ReviewController.setReferenceId,ReviewController.addReview);
Router.route('/:id')
    .delete(ReviewController.deleteReview)
    .get(authController.roleValidate('user','admin'),ReviewController.getReview)
    .patch(authController.roleValidate('user','admin'),ReviewController.updateReview);

module.exports=Router;