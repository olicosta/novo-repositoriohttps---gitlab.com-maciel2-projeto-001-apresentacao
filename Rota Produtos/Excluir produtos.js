import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1,
    duration: '2s',
};

const productIdToKeep = 'someProductIdToKeep';

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

    let authToken = loginRes.json('authorization').split(' ')[1];
    return { authToken };
}

export default function (data) {
    let authToken = data.authToken;

    let listProductsParams = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    };

    let listProductsRes = http.get('http://localhost:3000/produtos', listProductsParams);
    check(listProductsRes, { 'products listed': (r) => r.status === 200 });

    let products = listProductsRes.json().produtos;

    if (Array.isArray(products)) {
        console.log(`Total products: ${products.length}`);
        
        products.forEach((product) => {
            if (product._id !== productIdToKeep) {
                let deleteProductParams = {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                };

                let deleteProductRes = http.del(`http://localhost:3000/produtos/${product._id}`, null, deleteProductParams);
                check(deleteProductRes, { 'product deleted': (r) => r.status === 200 });

                if (deleteProductRes.status !== 200) {
                    console.log(`Failed to delete product ${product._id}: ${deleteProductRes.status} - ${deleteProductRes.body}`);
                }
            }
        });
    } else {
        console.log('The response is not an array. Please check the response format.');
    }

    sleep(1);
}
