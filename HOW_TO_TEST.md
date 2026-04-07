# How to Test AuctionX

Once all three Java microservices and your Docker infrastructure are running, you must verify that the systems actually talk to each other through the Kafka messages.

## Pre-Requisites (Database Seeding)
Since we have `ddl-auto: update` in our `application.yml`, Postgres automatically created the tables for us. However, they are empty. 

You need to manually insert 1 User and 1 Auction Item into your Postgres database to test bidding. 
Connect to your Postgres database using pgAdmin or Datagrip and run:

```sql
INSERT INTO users (username, email, created_at) 
VALUES ('johndoe', 'john@example.com', CURRENT_TIMESTAMP);

INSERT INTO auction_item (title, description, starting_price, current_highest_bid, status, end_time, version) 
VALUES ('Rolex Watch', 'Brand new', 1000.00, 1000.00, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '1 minute', 0);
```

## Test 1: Place a Web Bid (Tests WebSockets & Database Locking)

Open Postman (or use cURL) to simulate a user placing a high bid.

**HTTP Method:** `POST`
**URL:** `http://localhost:8080/api/auctions/1/bids`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "userId": 1,
  "amount": 1500.00
}
```

**Expected Result:**
1. Postman receives a `200 OK` with JSON confirming the bid.
2. If you look at the `auctionx` console logs, you will see output proving the bid was saved.

## Test 2: Watch the Microservices Cascade

Since we set the Auction interval to end 1 minute from now, simply watch your three PowerShell terminals.

**1. Watch the `auctionx` Terminal:**
You will see the Cron job fire:
`Cron: Checking for expired auctions...`
`Auction 1 has expired. Closing it down.`
`Publishing AuctionCompletedEvent to Kafka for Item 1`

**2. Watch the `payment-service` Terminal:**
Less than a second later, this terminal will react:
`RECEIVED KAFKA EVENT: Auction Ended! Processing Payment`
`Initiating Stripe Charge for 1500.00 to user john@example.com...`
`STRIPE SUCCESS: Card charged successfully.`

**3. Watch the `notification-service` Terminal:**
It will instantly react to the payment success:
`RECEIVED EVENT: Payment Successful! Sending Confirmation Email`
`Email successfully sent to john@example.com`

## Test 3: Verify the Email sent to Mailpit
Open your web browser and navigate to the Mailpit UI:
**http://localhost:8025**

You will see a beautiful HTML email waiting for you. Open it and verify the price and username match your REST request.

If all three tests pass, you have successfully built and orchestrated a Production-Ready Event-Driven Java platform.
