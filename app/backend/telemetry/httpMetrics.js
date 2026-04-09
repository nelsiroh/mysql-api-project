import client from 'prom-client';
import { registry } from './registry.js';

class HttpMetrics {
	constructor() {
		this.requestCount = new client.Counter({
			name: 'coffee_api_http_requests_total',
			help: 'Total HTTP requests',
			labelNames: ['method', 'route', 'status_code'],
			registers: [registry],
		});

		this.requestDuration = new client.Histogram({
			name: 'coffee_api_http_request_duration_seconds',
			help: 'HTTP request duration in seconds',
			labelNames: ['method', 'route', 'status_code'],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
			registers: [registry],
		});
	}
}

export const httpMetrics = new HttpMetrics();
