import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '3s', target: 1 },
        { duration: '2s', target: 1 },
        { duration: '3s', target: 0 },
    ],
};

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
    check(loginRes, { 'login success': (r) => r.status === 200 });

    let authToken = loginRes.json('token');

    return { authToken };
}

export default function (data) {
    let authToken = data.authToken;

    let createUserPayload = JSON.stringify({
        nome: 'Maciel Oliveira',
        email: `macielocosta+${Math.random().toString(36).substring(7)}@qa.com.br`,
        password: 'teste',
        administrador: 'true',
    });

    let createUserParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    };

    let createUserRes = http.post('http://localhost:3000/usuarios', createUserPayload, createUserParams);
    check(createUserRes, { 'usuarios created': (r) => r.status === 201 });

    if (createUserRes.status !== 201) {
        console.log(`Failed to create usuarios: ${createUserRes.status} - ${createUserRes.body}`);
    }

    sleep(1);
}
