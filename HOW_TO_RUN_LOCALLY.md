# How to Run AuctionX Locally

This guide explains how to boot the microservices ecosystem on your local machine using a hybrid approach: **Docker for Infrastructure**, and **Maven for Java Code**.

## Step 1: Boot The Infrastructure (Your DevOps Task)

The Java code expects 4 things to exist on `localhost` before it can start:
1. Postgres Database (Port `5432`)
2. Redis instance (Port `6379`)
3. Kafka Broker (Port `9092`) + Zookeeper (Port `2181`)
4. Mailpit Server (SMTP Port `1025`, Web UI Port `8025`)

**Your Assignment:** Create a `docker-compose.yml` file in this root directory to spin up these images. Once created, run:
```powershell
docker-compose up -d
```
Verify the containers are healthy by checking Docker Desktop.

## Step 2: Boot The Core Engine (`auctionx`)

Open a new PowerShell terminal and navigate to the core application folder:
```powershell
cd auctionx
mvn clean spring-boot:run
```
*Wait for the console to say `Started AuctionApplication on port 8080`.*

## Step 3: Boot The Payment Service (`payment-service`)

Open a **second** PowerShell terminal:
```powershell
cd payment-service
mvn clean spring-boot:run
```
*Wait for the console to say `Started PaymentApplication on port 8081`.*

## Step 4: Boot The Notification Service (`notification-service`)

Open a **third** PowerShell terminal:
```powershell
cd notification-service
mvn clean spring-boot:run
```
*Wait for the console to say `Started NotificationApplication on port 8082`.*

The entire distributed system is now running on your laptop. You are ready to move to testing.
