import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 users
    { duration: '40s', target: 100 }, // Sustain 100 concurrent users for baseline
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // 1. Health check
  const resHealth = http.get(`${baseUrl}/api/health`);
  check(resHealth, { 'Health status is 200': (r) => r.status === 200 });

  // 2. Fetch meals
  const resMeals = http.get(`${baseUrl}/api/meals`);
  check(resMeals, { 'Meals status is 200': (r) => r.status === 200 });

  sleep(0.5);
}
