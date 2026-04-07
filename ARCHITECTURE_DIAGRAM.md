# System Architecture Diagram

This document contains Mermaid diagrams visualizing the structure and data flow of the AuctionX platform. Native Markdown rendering handles these diagrams.

## High-Level Component Architecture
Visualizing the physical boundaries of our services and their mapped databases.

```mermaid
graph TD
    Client[Web/Mobile Client]
    
    subgraph "Core API Layer (Port 8080)"
    AuctionX[auctionx (Core Engine)]
    end
    
    subgraph "Background Microservices"
    Payment[payment-service (Port 8081)]
    Notification[notification-service (Port 8082)]
    end
    
    subgraph "Data & Infrastructure Layer"
    PG[(PostgreSQL)]
    Redis[(Redis Cache)]
    Kafka{{Apache Kafka}}
    SMTP[Mailpit SMTP]
    end

    Client -- REST / WebSockets --> AuctionX
    AuctionX -- R/W --> PG
    AuctionX -- R/W --> Redis
    
    AuctionX -- Publishes 'auction-completed' --> Kafka
    Kafka -- Consumes 'auction-completed' --> Payment
    Payment -- Publishes 'payment-successful' --> Kafka
    Kafka -- Consumes 'payment-successful' --> Notification
    Notification -- Sends HTML Email --> SMTP
```

## Event-Driven Sequence Flow
Visualizing the exact chronological flow of an auction ending.

```mermaid
sequenceDiagram
    participant User
    participant AuctionService as Auction Service
    participant Kafka
    participant PaymentService as Payment Service
    participant NotificationService as Notification Service
    participant Mailpit as Mailpit

    User->>AuctionService: POST /api/auctions/1/bids (Places Bid)
    AuctionService-->>User: STOMP Push (Bid accepted)
    
    Note over AuctionService: 10 seconds later...
    AuctionService->>AuctionService: Cron checks for expired auctions
    AuctionService->>Kafka: PUBLISH: TOPIC: auction-completed
    
    Kafka->>PaymentService: EXECUTE: Stripe Charge
    Note over PaymentService: Simulating Payment Network...
    
    alt Edge Case: Insufficient Funds
        PaymentService->>Kafka: PUBLISH: payment-failed
    else Happy Path: Card Accepted
        PaymentService->>Kafka: PUBLISH: payment-successful
    end

    Kafka->>NotificationService: RECEIVE: payment-successful
    NotificationService->>NotificationService: Render Thymeleaf HTML Template
    NotificationService->>Mailpit: DISPATCH: SMTP Email
```
