import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;
const PRODUTOS_URL = `${BASE_URL}/produtos`;
const USER_CREDENTIALS = {
    email: 'macielocosta+w7z82j@qa.com.br',
    password: 'teste',
};

export let options = {
    vus: 100,
    duration: '30s',
};

export function setup() {
    const loginPayload = JSON.stringify(USER_CREDENTIALS);
    const loginParams = { headers: { 'Content-Type': 'application/json' } };

    const loginRes = http.post(LOGIN_URL, loginPayload, loginParams);
    const loginSuccess = check(loginRes, { 'login success': (r) => r.status === 200 });

    if (!loginSuccess) {
        console.error('Login failed', loginRes.body);
        throw new Error('Setup failed: Unable to login');
    }

    console.log(`Login response status: ${loginRes.status}`);
    console.log(`Login response body: ${loginRes.body}`);

    let authToken;
    try {
        const authorizationHeader = loginRes.json('authorization');
        authToken = authorizationHeader.split(' ')[1];
        console.log(`Parsed auth token: ${authToken}`);
    } catch (e) {
        console.error('Failed to parse auth token from response:', e);
        throw new Error('Setup failed: Unable to parse auth token');
    }

    if (!authToken) {
        console.error('No auth token received in login response.');
        throw new Error('Setup failed: No auth token received');
    }

    console.log(`Auth token extracted: ${authToken}`);
    return { authToken };
}

export default function (data) {
    if (!data || !data.authToken) {
        console.error('No auth token available. Aborting.');
        return;
    }

    const authToken = data.authToken;
    const produtoParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    };

    const listProdutosRes = http.get(PRODUTOS_URL, produtoParams);
    const listProdutosSuccess = check(listProdutosRes, { 'produtos listed': (r) => r.status === 200 });

    if (!listProdutosSuccess) {
        console.error(`Failed to list produtos: ${listProdutosRes.status} - ${listProdutosRes.body}`);
    } else {
        console.log(`Listed produtos: ${listProdutosRes.body}`);
    }

    sleep(1);
}
