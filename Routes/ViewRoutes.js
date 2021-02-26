const express= require('express');
const app=express();
const Router=express.Router();
const ViewController=require('./../controller/ViewController');
const AuthController=require('./../controller/authController');

// Router.use(AuthController.isLogin);

Router.get('/',AuthController.isLogin,ViewController.getOverview);

Router.get('/tour/:tourslug',AuthController.isLogin,ViewController.getTour);
Router.get('/login',AuthController.isLogin,ViewController.login);
Router.get('/me',AuthController.protect,ViewController.getMe);


module.exports=Router;