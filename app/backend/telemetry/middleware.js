import { httpMetrics } from './httpMetrics.js';

export function metricsMiddleware() {
	return (req, res, next) => {
		if (req.path === '/metrics') {
			return next();
		}

		const started = process.hrtime.bigint();

		res.on('finish', () => {
			const durationSeconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;

			// Prefer templated routes like /order/:id/status over raw URLs.
			const route = req.route?.path
				? req.baseUrl
					? `${req.baseUrl}${req.route.path}`
					: req.route.path
				: 'unmatched';

			const labels = {
				method: req.method,
				route,
				status_code: String(res.statusCode),
			};

			// Record both throughput and latency from the same response event.
			httpMetrics.requestCount.inc(labels);
			httpMetrics.requestDuration.observe(labels, durationSeconds);
		});

		next();
	};
}