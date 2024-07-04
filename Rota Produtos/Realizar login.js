import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '10s', target: 1 },
    ],
};

export default function () {
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
    
    check(loginRes, {
        'login success': (r) => r.status === 200,
    });

    if (loginRes.status !== 200) {
        console.log(`Failed to login: ${loginRes.status} - ${loginRes.body}`);
    }

    sleep(1);
}
