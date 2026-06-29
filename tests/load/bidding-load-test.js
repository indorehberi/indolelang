import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Metric to track broadcast delay
const broadcastDelayTrend = new Trend('websocket_broadcast_delay');

export const options = {
  vus: 500,
  duration: '5m',
  thresholds: {
    websocket_broadcast_delay: ['p(95)<200'], // Broadcast delay under 200ms (SLA target)
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
  const wsUrl = __ENV.WS_URL || 'ws://localhost:8000';
  const url = `${wsUrl}/socket.io/?EIO=4&transport=websocket`;

  const params = {
    headers: {
      'User-Agent': 'k6-load-test-client',
    },
  };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', function () {
      // 1. Send the socket.io connect packet to Namespace "/"
      socket.send('40');
      
      // Periodically ping to keep connection alive (Socket.io packet 3 is ping)
      socket.setInterval(function () {
        socket.send('3');
      }, 25000);
    });

    socket.on('message', function (data) {
      // Check if it's a Socket.io message event
      if (data.startsWith('42')) {
        try {
          // Packet format: 42["event", payload]
          const payloadStr = data.substring(2);
          const parsed = JSON.parse(payloadStr);
          const eventName = parsed[0];
          const eventData = parsed[1];

          if (eventName === 'bid:update') {
            // Track latency if timestamp is present in the bid data
            if (eventData.timestamp) {
              const delay = Date.now() - new Date(eventData.timestamp).getTime();
              broadcastDelayTrend.add(delay);
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    socket.on('close', function () {
      // Connection closed
    });

    socket.on('error', function (e) {
      // Handle socket error
    });

    // Run each user session for 45 seconds, then close
    socket.setTimeout(function () {
      socket.close();
    }, 45000);
  });

  check(res, {
    'websocket handshake successful': (r) => r && r.status === 101,
  });

  sleep(1);
}
