import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;
const PRODUTOS_URL = `${BASE_URL}/produtos`;
const USER_CREDENTIALS = {
    email: 'macielocosta+w7z82j@qa.com.br',
    password: 'teste',
};

export let options = {
    stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 0 },
    ],
};

function gerarProdutoAleatorio() {
    const nomes = ['Mouse Logitech MX Vertical', 'Teclado Mecânico', 'Monitor 4K', 'Notebook Gamer', 'Headset'];
    const descricao = ['Mouse', 'Teclado', 'Monitor', 'Notebook', 'Headset'];
    const index = Math.floor(Math.random() * nomes.length);

    return {
        nome: `${nomes[index]}_${randomString(10)}`,
        preco: randomIntBetween(100, 1100),
        descricao: descricao[index],
        quantidade: randomIntBetween(1, 500),
    };
}

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
    const produto = gerarProdutoAleatorio();
    const produtoPayload = JSON.stringify(produto);
    const produtoParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    };

    const createProdutoRes = http.post(PRODUTOS_URL, produtoPayload, produtoParams);
    const createProdutoSuccess = check(createProdutoRes, { 'produto created': (r) => r.status === 201 });

    if (!createProdutoSuccess) {
        console.error(`Failed to create produto: ${createProdutoRes.status} - ${createProdutoRes.body}`);
    }

    sleep(1);
}
