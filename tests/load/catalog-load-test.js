import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Metric to track error rate
export const errorRate = new Rate('errors');

export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete under 500ms (SLA target)
    errors: ['rate<0.01'],            // Error rate must be less than 1%
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn':   { loadZone: 'amazon:us:ashburn',   percent: 34 },
        'amazon:sg:singapore': { loadZone: 'amazon:sg:singapore', percent: 33 },
        'amazon:eu:frankfurt': { loadZone: 'amazon:eu:frankfurt', percent: 33 },
      },
    },
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8000';
  
  // 1. Browse list of auction sessions
  const sessionsRes = http.get(`${baseUrl}/api/v1/sessions`);
  const sessionsSuccess = check(sessionsRes, {
    'sessions status is 200': (r) => r.status === 200,
    'sessions success is true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  });
  errorRate.add(!sessionsSuccess);

  sleep(1);

  // If there are sessions, query a random session's lot detail
  try {
    const sessionsBody = JSON.parse(sessionsRes.body);
    if (sessionsBody.success && sessionsBody.data && sessionsBody.data.length > 0) {
      const randomSession = sessionsBody.data[Math.floor(Math.random() * sessionsBody.data.length)];
      const sessionId = randomSession.id;

      // 2. Browse lots for a session
      const lotsRes = http.get(`${baseUrl}/api/v1/sessions/${sessionId}`);
      const lotsSuccess = check(lotsRes, {
        'lots status is 200': (r) => r.status === 200,
        'lots success is true': (r) => {
          const body = JSON.parse(r.body);
          return body.success === true;
        },
      });
      errorRate.add(!lotsSuccess);
    }
  } catch (e) {
    // No-op if JSON parsing fails
  }

  sleep(2);
}
