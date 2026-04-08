# AuctionX - Application Architecture & Tech Stack

## Overview
AuctionX is a highly concurrent, event-driven microservices platform designed for real-time bidding. It is designed to handle high throughput, mitigate data race conditions, and gracefully handle third-party service failures (like payment gateways falling offline).

---

## 1. The Tech Stack & "The Why"

### Language & Framework
* **Java 21 & Spring Boot 3.2+**
  * **Why:** Java remains the enterprise standard for high-performance, strictly typed backend engines. Spring Boot 3 provides out-of-the-box integrations for Kafka, Redis, and WebSockets while supporting modern Java 21 features (like Virtual Threads) for massive throughput.

### Primary Database
* **PostgreSQL**
  * **Why:** We are dealing with money and financial ledgers. We absolutely require ACID compliance (Atomicity, Consistency, Isolation, Durability). Postgres guarantees that a bid is either 100% saved or completely rejected. 

### In-Memory Cache
* **Redis**
  * **Why:** In an auction, users are constantly asking "What is the current price?". If 10,000 users hit Postgres every second to check the price, the database will crash. Redis allows us to cache this data in RAM, returning the price in less than 1 millisecond.

### Message Broker
* **Apache Kafka (with Zookeeper)**
  * **Why:** To completely decouple the system. When an auction ends, the main API should not freeze while it waits for a credit card to process or an email to send. Instead, it drops an event into Kafka and moves on. If the Notification service crashes, the event stays safe in Kafka until the service reboots.

### Real-Time Communication
* **Spring WebSockets (STOMP Protocol)**
  * **Why:** Standard REST APIs require the user to constantly refresh the page (polling). WebSockets keep a permanent open pipe to the client, allowing the server to push the new price the exact millisecond a bid is accepted.

### Local Mocking Tools
* **Mailpit (SMTP)**
  * **Why:** During development, spamming real email servers gets your IP blacklisted. Mailpit acts like a fake email provider on your local machine, catching all HTML emails so you can view them safely.

---

## 2. The Microservices Breakdown

### A. The Core Engine (`auctionx`)
This is the heart of the platform. It receives REST HTTP requests from users attempting to place bids. 
* **Key Feature - Optimistic Locking:** It uses Hibernate's `@Version` annotation. If two users bid simultaneously at the exact millisecond, Postgres will throw an `ObjectOptimisticLockingFailureException` on the second bid, cleanly rejecting it without freezing the database tables.
* **Key Feature - The Scheduler:** It runs a background cron job checking for expired auctions. When one expires, it fires an `auction-completed` event into Kafka.

### B. The Payment Handler (`payment-service`)
This service has absolutely no web traffic. It exists purely to listen to Kafka.
* **Key Feature - The Saga Pattern:** It listens for `auction-completed`. It mocks a connection to Stripe. If the user's credit card is declined, it publishes a `payment-failed` event. If it succeeds, it publishes `payment-successful`.

### C. The Notification Engine (`notification-service`)
This service listens for `payment-successful` events in Kafka.
* **Key Feature - Thymeleaf HTML Templates:** Instead of sending ugly text, it dynamically compiles the winning user's name and bid amount into a clean HTML template and fires it off via SMTP.
