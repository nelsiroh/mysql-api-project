# Coffee Transaction Service

**Production-Style Order Processing API with Observability and Load
Modeling**

A transactional order service built with **Node.js (Express)** and
**MySQL**, instrumented with **Datadog APM**, and validated under
synthetic load using **Locust**.

------------------------------------------------------------------------

## Executive Summary

This service simulates a production-style commerce backend:

-   Product catalog (`coffee_table`)
-   Customer records (`customer_table`)
-   Order creation (`orders`)
-   Order line item snapshots (`order_items`)
-   Stateful order lifecycle transitions
-   Transactional integrity with rollback protection
-   Distributed tracing via Datadog
-   Load validation via Locust

------------------------------------------------------------------------

## Architecture Overview

Load Generator (Locust)
        │
        ▼
Express API (Node.js)
  - Transaction control
  - Validation layer
  - State transitions
  - dd-trace instrumentation
        │
        ▼
MySQL (InnoDB)
  - ACID transactions
  - Foreign keys
  - Snapshot pricing
        │
        ▼
Datadog Agent (APM)
  - HTTP traces
  - DB spans
  - Latency percentiles
  - Error analysis

------------------------------------------------------------------------

## Core Domain Model

### Orders

-   Unique `order_number` (CHAR(26))
-   Monetary fields: `subtotal`, `tax`, `grand_total`
-   Status state machine
-   Transactionally consistent creation

### Order Items

-   Unit price snapshot at time of purchase
-   Line total preserved
-   Referential integrity to `orders`

------------------------------------------------------------------------

## Order Lifecycle

PENDING → PAID → FULFILLED → REFUNDED\
      ↘ CANCELLED

Load tests simulate probabilistic lifecycle transitions to reflect
real-world behavior.

------------------------------------------------------------------------

## API Surface

  Method   Endpoint            Description
  -------- ------------------- ----------------------------
  GET      /health             Health check
  GET      /coffees            Product catalog
  GET      /users              Customer list
  POST     /order              Create transactional order
  PATCH    /order/:id/status   Update order state

------------------------------------------------------------------------

## Transaction Design

Order creation executes inside a database transaction:

1.  Validate customer exists\
2.  Validate coffee exists + fetch price\
3.  Compute totals\
4.  Insert order\
5.  Insert order item\
6.  Commit\
7.  Rollback on any failure

This ensures atomicity, consistency, and monetary integrity.

------------------------------------------------------------------------

## Observability

Tracing is enabled using `dd-trace` prior to Express initialization to
capture full request lifecycle telemetry.

Captured metrics include:

-   HTTP latency per endpoint\
-   MySQL query timing\
-   Transaction duration\
-   Error rates\
-   P95 / P99 latency analysis\
-   Throughput under load

------------------------------------------------------------------------

## Load Testing

Load tests reside in:

test/performance/locustfile.py

Example headless run:

python -m locust -f test/performance/locustfile.py --headless -u 100 -r
10 -t 5m --host http://127.0.0.1:8080

Where:

-   -u = concurrent users\
-   -r = ramp rate\
-   -t = duration

------------------------------------------------------------------------

## Sample Local Test Outcome

-   \~16,000 synthetic orders generated\
-   Multi-stage lifecycle updates\
-   Zero 500-level failures\
-   Stable P95 latency under 100 concurrent users\
-   Clean rollback behavior on validation failures

------------------------------------------------------------------------

## Local Development

Start database:

docker compose up -d

Start API:

node app/backend/server.js

Health check:

curl http://localhost:8080/health

------------------------------------------------------------------------

## Storage Management During Load Testing

Synthetic load generates:

-   1 row in `orders`
-   1 row in `order_items`
-   Multiple status updates

Reset test data:

SET FOREIGN_KEY_CHECKS=0; TRUNCATE order_items; TRUNCATE orders; SET
FOREIGN_KEY_CHECKS=1;

Or reset container:

docker compose down -v

------------------------------------------------------------------------

## What This Project Demonstrates

-   Transactionally correct backend architecture\
-   Realistic lifecycle modeling\
-   Write amplification analysis\
-   Performance instrumentation\
-   Controlled load experimentation\
-   Observability-driven development

------------------------------------------------------------------------

## Positioning

This project serves as:

-   A performance engineering reference\
-   A transactional system design example\
-   A DevOps and observability showcase\
-   A portfolio artifact demonstrating backend rigor
