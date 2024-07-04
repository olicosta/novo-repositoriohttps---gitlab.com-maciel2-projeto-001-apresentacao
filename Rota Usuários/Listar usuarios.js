import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 1 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/usuarios');
  
  check(res, { 'status was 200': (r) => r.status === 200 });
  
  console.log('Response body:', res.body);

  sleep(1);
}