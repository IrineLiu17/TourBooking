const express= require('express');
const app=express();
const UserController=require('./../controller/UserController');
const authController=require('./../controller/authController');
const Router=express.Router();

Router.post('/signup',authController.signup);
Router.post('/login',authController.passwordLimit,authController.login);
Router.get('/logout',authController.logout);
Router.post('/forgetPassword',authController.forgetPassword);
Router.patch('/resetPassword/:token',authController.resetPassword);

Router.use(authController.protect);//After the 4 routes above, the protect will protect all the following routes
Router.patch('/updatePassword',authController.updatePassword);


Router.get('/getme',UserController.getMe,UserController.getUser);
Router.patch('/updateUser',UserController.uploadUserPhoto,UserController.resizePhoto,UserController.updateUser);
Router.delete('/deleteUser',UserController.deleteUser);

Router.use(authController.roleValidate('admin'));
Router.route('/').get(UserController.getUsers).post(UserController.addUser);
Router.route('/:id').get(UserController.getUser).patch(UserController.updateUserByAdmin).delete(UserController.deleteUserByAdmin);

module.exports=Router;