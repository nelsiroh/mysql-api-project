import client from 'prom-client';

// Use a dedicated registry so app metrics stay isolated and easy to export.
export const registry = new client.Registry();

registry.setDefaultLabels({
	service: process.env.OTEL_SERVICE_NAME || 'coffee-api',
	env: process.env.DEPLOY_ENV || 'local',
});

client.collectDefaultMetrics({
	register: registry,
	prefix: 'coffee_api_',
});

// Expose the shared registry through the Prometheus scrape endpoint.
export async function metricsHandler(req, res) {
	try {
		res.set('Content-Type', registry.contentType);
		res.end(await registry.metrics());
	} catch (err) {
		res.status(500).end(err.message);
	}
}
