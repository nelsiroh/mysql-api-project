import client from 'prom-client';
import { registry } from './registry.js';

class OrderMetrics {
	constructor() {
		this.ordersCreated = new client.Counter({
			name: 'coffee_api_orders_created_total',
			help: 'Orders successfully created',
			labelNames: ['status'],
			registers: [registry],
		});

		this.orderCreateFailures = new client.Counter({
			name: 'coffee_api_order_create_failures_total',
			help: 'Order creation failures',
			labelNames: ['stage', 'reason'],
			registers: [registry],
		});

		this.orderValidationFailures = new client.Counter({
			name: 'coffee_api_order_validation_failures_total',
			help: 'Validation failures during order creation',
			labelNames: ['field'],
			registers: [registry],
		});

		this.orderCreateDuration = new client.Histogram({
			name: 'coffee_api_order_create_duration_seconds',
			help: 'End-to-end order creation duration',
			labelNames: ['outcome'],
			buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
			registers: [registry],
		});

		this.orderStatusTransitions = new client.Counter({
			name: 'coffee_api_order_status_transitions_total',
			help: 'Order status transitions',
			labelNames: ['from_status', 'to_status', 'outcome'],
			registers: [registry],
		});

		this.rollbacks = new client.Counter({
			name: 'coffee_api_db_rollbacks_total',
			help: 'Transaction rollbacks',
			labelNames: ['reason'],
			registers: [registry],
		});
	}

	startOrderCreateTimer() {
		const started = process.hrtime.bigint();

		// Return a completion function so callers can label the final outcome once.
		return (outcome) => {
			const durationSeconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;
			this.orderCreateDuration.observe({ outcome }, durationSeconds);
		};
	}

	recordValidationFailure(field) {
		this.orderValidationFailures.inc({ field });
	}

	recordCreateFailure(stage, reason) {
		this.orderCreateFailures.inc({ stage, reason });
	}

	recordRollback(reason) {
		this.rollbacks.inc({ reason });
	}

	recordOrderCreated(status = 'PENDING') {
		this.ordersCreated.inc({ status });
	}

	recordStatusTransition(fromStatus, toStatus, outcome = 'updated') {
		this.orderStatusTransitions.inc({
			from_status: fromStatus,
			to_status: toStatus,
			outcome,
		});
	}
}

export const orderMetrics = new OrderMetrics();
