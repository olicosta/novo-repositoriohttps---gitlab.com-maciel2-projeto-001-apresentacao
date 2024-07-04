import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '1s', target: 1 },
    ],
};

export default function () {
    const res = http.get('http://localhost:3000/produtos');

    check(res, { 'status was 200': (r) => r.status === 200 });

    const responseBody = JSON.parse(res.body);

    if (responseBody.produtos) {
        const totalProdutos = responseBody.produtos.length;
        console.log(`Total de produtos listados: ${totalProdutos}`);
    } else {
        console.log('Nenhum produto encontrado na resposta.');
    }

    sleep(1);
}
