
import '@babel/polyfill';
import {login,logout} from './login';
import {displayMaps} from "./mapbox";
import {update} from "./updateUser";


const maps=document.getElementById('map');
const loginform=document.querySelector('.form--login');
const logoutBtn= document.querySelector('.nav__el--logout');
const updateBtn=document.querySelector('.btn--updateBasic');
const passwordForm=document.querySelector('.form-user-settings');



if(maps){
    const locations=JSON.parse(maps.dataset.locations);
    displayMaps(locations);
}


if(loginform){
    loginform.addEventListener('submit',e=>{
        e.preventDefault();
        const email=document.getElementById('email').value;
        const password=document.getElementById('password').value;
        console.log(email,password);
        login(email,password);
    });

}

if(logoutBtn){
    logoutBtn.addEventListener('click',logout);

}

if(updateBtn){

    updateBtn.addEventListener('click',e=>{
        e.preventDefault();
        const name=document.getElementById('name').value;
        const email=document.getElementById('email').value;
        const form=new FormData();
        form.append('name',name);
        form.append('email',email);
        form.append('photo',document.getElementById('photo').files[0]);

        update(form,'data');
    });
}


if(passwordForm){
    passwordForm.addEventListener('submit',async e=>{
        e.preventDefault();

        document.querySelector('.btn--savePassword').textContent='Updating...';

        const currentPassword=document.getElementById('password-current').value;
        const password=document.getElementById('password').value;
        const passwordConfirm=document.getElementById('password-confirm').value;
        const data={
            currentPassword,
            password,
            passwordConfirm
        };
        await update(data,'password');
        document.querySelector('.btn--savePassword').textContent='Save password';
        document.getElementById('password-current').value='';
        document.getElementById('password').value='';
        document.getElementById('password-confirm').value='';
    })
}


