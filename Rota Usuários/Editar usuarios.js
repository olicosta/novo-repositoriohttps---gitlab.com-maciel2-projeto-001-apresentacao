import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1,
    duration: '10s',
};

const userIdToEdit = 'wnd1pu3iHfAh4fgy'; // Substituir pelo ID do usuário que precisa alterar os dados.

export function setup() {
    let loginPayload = JSON.stringify({
        email: 'macielocosta+w7z82j@qa.com.br',
        password: 'teste',
    });

    let loginParams = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    let loginRes = http.post('http://localhost:3000/login', loginPayload, loginParams);
    let loginSuccess = check(loginRes, { 'login success': (r) => r.status === 200 });

    if (!loginSuccess) {
        console.error(`Login failed with status: ${loginRes.status}`);
        console.error(loginRes.body);
    }

    let authToken = loginRes.json('authorization').split(' ')[1];
    return { authToken };
}

export default function (data) {
    let authToken = data.authToken;

    let userUpdatePayload = JSON.stringify({
        nome: 'João da Silva', // Novos dados
        email: 'Joaosilva@qa.com.br',
        password: '292929',
        administrador: 'true'
    });

    let userUpdateParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    };

    let updateUserRes = http.put(`http://localhost:3000/usuarios/${userIdToEdit}`, userUpdatePayload, userUpdateParams);
    let userUpdated = check(updateUserRes, {
        'user updated': (r) => r.status === 200,
    });

    if (!userUpdated) {
        console.error(`Failed to update user ${userIdToEdit}: ${updateUserRes.status} - ${updateUserRes.body}`);
    } else {
        console.log(`User ${userIdToEdit} updated successfully.`);
    }

    sleep(1);
}
