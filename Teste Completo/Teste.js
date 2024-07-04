import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/login`;
const USUARIOS_URL = `${BASE_URL}/usuarios`;
const PRODUTOS_URL = `${BASE_URL}/produtos`;
const USER_CREDENTIALS = {
    email: 'macielocosta+w7z82j@qa.com.br',
    password: 'teste',
};

export let options = {
    stages: [
        { duration: '5s', target: 1 },
        { duration: '5s', target: 1 },
        { duration: '1s', target: 0 },
    ],
};

const userIdToKeep = 'n64e07fZSjsDQThZ';

function gerarUsuarioAleatorio() {
    return {
        nome: `Usuario_${randomString(10)}`,
        email: `usuario_${randomString(5)}@qa.com.br`,
        password: 'senha123',
        administrador: 'true',
    };
}

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
    check(loginRes, { 'login success': (r) => r.status === 200 });

    let authToken;
    try {
        const authorizationHeader = loginRes.json('authorization');
        authToken = authorizationHeader.split(' ')[1];
    } catch (e) {
        throw new Error('Setup failed: Unable to parse auth token');
    }

    return { authToken };
}

export default function (data) {
    let authToken = data.authToken;

    for (let i = 0; i < 5; i++) {
        const userPayload = JSON.stringify(gerarUsuarioAleatorio());
        const userParams = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        };

        const createUserRes = http.post(USUARIOS_URL, userPayload, userParams);
        check(createUserRes, { 'user created': (r) => r.status === 201 });

        if (createUserRes.status !== 201) {
            console.log(`Failed to create user: ${createUserRes.status} - ${createUserRes.body}`);
        }
    }

    // Criar produtos
    for (let i = 0; i < 5; i++) {
        const produtoPayload = JSON.stringify(gerarProdutoAleatorio());
        const produtoParams = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        };

        const createProdutoRes = http.post(PRODUTOS_URL, produtoPayload, produtoParams);
        check(createProdutoRes, { 'produto created': (r) => r.status === 201 });

        if (createProdutoRes.status !== 201) {
            console.log(`Failed to create produto: ${createProdutoRes.status} - ${createProdutoRes.body}`);
        }
    }

    const listUsersParams = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    };

    const listUsersRes = http.get(USUARIOS_URL, listUsersParams);
    check(listUsersRes, { 'users listed': (r) => r.status === 200 });

    const users = listUsersRes.json().usuarios;

    if (Array.isArray(users)) {
        users.forEach((user) => {
            if (user._id !== userIdToKeep) {
                const deleteUserParams = {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                };

                const deleteUserRes = http.del(`${USUARIOS_URL}/${user._id}`, null, deleteUserParams);
                check(deleteUserRes, { 'user deleted': (r) => r.status === 200 });

                if (deleteUserRes.status !== 200) {
                    console.log(`Failed to delete user ${user._id}: ${deleteUserRes.status} - ${deleteUserRes.body}`);
                }
            }
        });
    } else {
        console.log('The response is not an array. Please check the response format.');
    }

    const listProductsParams = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    };

    const listProductsRes = http.get(PRODUTOS_URL, listProductsParams);
    check(listProductsRes, { 'products listed': (r) => r.status === 200 });

    const products = listProductsRes.json().produtos;

    if (Array.isArray(products)) {
        products.forEach((product) => {
            const deleteProductParams = {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            };

            const deleteProductRes = http.del(`${PRODUTOS_URL}/${product._id}`, null, deleteProductParams);
            check(deleteProductRes, { 'product deleted': (r) => r.status === 200 });

            if (deleteProductRes.status !== 200) {
                console.log(`Failed to delete product ${product._id}: ${deleteProductRes.status} - ${deleteProductRes.body}`);
            }
        });
    } else {
        console.log('The response is not an array. Please check the response format.');
    }

    sleep(1);
}
