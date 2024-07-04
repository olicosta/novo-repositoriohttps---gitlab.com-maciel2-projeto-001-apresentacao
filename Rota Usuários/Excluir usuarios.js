import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1,
    duration: '10s',
};

const userEmailToKeep = 'macielocosta+w7z82j@qa.com.br';

export function setup() {
    let loginPayload = JSON.stringify({
        email: userEmailToKeep,
        password: 'teste',
    });

    let loginParams = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    let loginRes = http.post('http://localhost:3000/login', loginPayload, loginParams);
    check(loginRes, { 'login success': (r) => r.status === 200 });

    let authToken = loginRes.json('authorization').split(' ')[1];
    return { authToken };
}

export default function (data) {
    let authToken = data.authToken;

    let listUsersParams = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    };

    let listUsersRes = http.get('http://localhost:3000/usuarios', listUsersParams);
    check(listUsersRes, { 'users listed': (r) => r.status === 200 });

    let users = listUsersRes.json().usuarios;

    if (Array.isArray(users)) {
        console.log(`Total users: ${users.length}`);

        users.forEach((user) => {
            if (user.email !== userEmailToKeep) {
                let deleteUserParams = {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                };

                let deleteUserRes = http.del(`http://localhost:3000/usuarios/${user._id}`, null, deleteUserParams);
                check(deleteUserRes, { 'user deleted': (r) => r.status === 200 });

                if (deleteUserRes.status !== 200) {
                    console.log(`Failed to delete user ${user._id}: ${deleteUserRes.status} - ${deleteUserRes.body}`);
                }
            }
        });
    } else {
        console.log('The response is not an array. Please check the response format.');
    }

    sleep(1);
}
