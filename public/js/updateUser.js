
import axios from "axios";
import {showAlert} from "./alert";
// export const update= async(name,email)=> {
//     try {
//         const res = await axios({
//             method: 'PATCH',
//             url: 'http://127.0.0.1:8000/api/v1/users/updateUser',
//             data: {
//                 name,
//                 email
//             }
//         });
//
//         console.log("RESSSSSSSSSSSS",res);
//
//         if (res.data.state === 'success') {
//             showAlert('success', 'Updated successfully!');
//         }
//     }
//     catch (err) {
//         console.log(err.response.data);
//         showAlert('error', err.response.data.message);
//
//     };
// };

export const update= async(data,type)=> {
    try {
        const url=t
        ype==='password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateUser';
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });

        console.log("RESSSSSSSSSSSS",res);

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} Updated successfully!`);
        }
    }
    catch (err) {
        console.log(err.response.data);
        showAlert('error', err.response.data.message);

    }
};

