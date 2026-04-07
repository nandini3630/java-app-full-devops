# AuctionX - Docker Compose Configuration Guide

When moving from local development to Docker Compose, the biggest trap is **localhost**. Inside a Docker container, `localhost` means the container itself. 

If the `auctionx` container tries to connect to `localhost:5432` for the database, it will fail because Postgres lives in the `postgres` container! You must use Environment Variables to override the Java configurations and tell them the correct Docker hostnames.

Here are the exact credentials and environment variables you need to configure your `docker-compose.yml` successfully.

---

## 1. Infrastructure Settings

### Postgres
When booting up Postgres, you need to create the database and user that our Spring Boot applications expect. 
**Environment Variables to set under `postgres`:**
* `POSTGRES_DB=auctiondb`
* `POSTGRES_USER=auctionuser`
* `POSTGRES_PASSWORD=password123`

### Redis & Mailpit
These do not require hardcoded environment variables. Just expose their ports (`6379` for Redis, `1025` and `8025` for Mailpit).

### Apache Kafka (The KRaft Configuration)
KRaft mode removes ZooKeeper, but it requires a very specific set of variables to self-elect as the metadata controller. 
**Environment Variables to set under `kafka`:**
```yaml
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29092,CONTROLLER://0.0.0.0:29093,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:29093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_NUM_PARTITIONS: 3
```

---

## 2. Spring Boot Override Settings

For your three Java applications (`auctionx`, `payment`, `notification`), you must inject Spring Boot environment variables to re-route their connections from `localhost` to the Docker container names.

**Environment variables you will need to add to your Java containers:**

**For `auctionx` & `payment`:**
*   `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/auctiondb`
*   `SPRING_DATASOURCE_USERNAME=auctionuser`
*   `SPRING_DATASOURCE_PASSWORD=password123`
*   `SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092`
*   `SPRING_DATA_REDIS_HOST=redis`

**For `notification` (Email Overrides):**
*   `SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092`
*   `SPRING_MAIL_HOST=mailpit`
*   `SPRING_MAIL_PORT=1025`

**DevOps Pro-Tip:** Do not forget to use `healthcheck` on the Postgres container, and `depends_on: postgres: condition: service_healthy` on your Java containers so they don't crash on startup!
