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
        { duration: '30s', target: 100 },
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

    const authToken = loginRes.json('authorization').split(' ')[1];

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
        throw new Error('Setup failed: Unable to create produto');
    }

    const productId = createProdutoRes.json('_id');

    return { authToken, productId };
}

export default function (data) {
    if (!data || !data.authToken || !data.productId) {
        console.error('No auth token or product ID available. Aborting.');
        return;
    }

    const authToken = data.authToken;
    const productId = data.productId;
    const updatedProduto = {
        nome: `Updated_${randomString(10)}`,
        preco: randomIntBetween(200, 1200),
        descricao: 'Updated description',
        quantidade: randomIntBetween(10, 600),
    };

    const produtoPayload = JSON.stringify(updatedProduto);
    const produtoParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    };

    const updateProdutoRes = http.put(`${PRODUTOS_URL}/${productId}`, produtoPayload, produtoParams);
    const updateProdutoSuccess = check(updateProdutoRes, { 'produto updated': (r) => r.status === 200 });

    if (!updateProdutoSuccess) {
        console.error(`Failed to update produto: ${updateProdutoRes.status} - ${updateProdutoRes.body}`);
    } else {
        console.log(`Produto updated successfully: ${updateProdutoRes.body}`);
    }

    sleep(1);
}
