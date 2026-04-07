# AuctionX — Complete Backend Testing Guide (Postman)

> **Base URL:** `http://15.207.20.75:8080` (Replace with your EC2 Public IP)
> **Pre-requisite:** All 7 Docker containers must be running (`docker ps` shows all as `Up`).

---

## ⚠️ PRE-FLIGHT CHECK (Run these BEFORE anything else)

These two commands take 10 seconds and will save you 30 minutes of debugging headaches.

### Check 1: Free the Build Cache (Prevents "no space left on device" error)
Every time you run `docker-compose up --build`, Docker saves 2-3 GB of
build cache on disk silently. On an EC2 Free Tier (8GB disk), this fills up
within one afternoon. Always clean it before a test session:
```bash
docker builder prune -a -f
```

### Check 2: Verify disk space is healthy
```bash
df -h
```
Look at the `/` row. `Use%` must be below `85%`. If it is at `100%`, your
`docker exec` commands will fail with `no space left on device`.

### Check 3: Confirm all 7 containers are alive
```bash
docker ps
```
**All 7 must show `Up`.** If any Java service shows `Exited`, run:
```bash
docker logs <container_name> --tail 30
```

---

## PHASE 1: Seed the Database (Required First Step)

Your `AuctionService` requires a valid `userId` from the `users` table
before it can accept bids. You must create a User and an Auction Item
directly in Postgres before any Postman testing.

### Connect to the live database
```bash
docker exec -it postgres psql -U auctionuser -d auctiondb
```

### Insert two test Users
We create two users so Test 5 (Race Condition) simulates two real humans bidding against each other.
```sql
INSERT INTO users (username, email, created_at) 
VALUES ('vishal_dev', 'vishal@test.com', NOW());

INSERT INTO users (username, email, created_at) 
VALUES ('nandini_dev', 'nandini@test.com', NOW());
```

### Insert a test Auction Item (Ends in 1 HOUR — gives you plenty of test time)
```sql
INSERT INTO auction_item (title, description, starting_price, current_highest_bid, end_time, status, version)
VALUES ('MacBook Pro M3', 'Brand new sealed box', 1000.00, 999.99, NOW() + INTERVAL '1 hour', 'ACTIVE', 0);
```

> ⚠️ **Important:** Do NOT use `INTERVAL '10 minutes'`. The `AuctionEndScheduler`
> runs every 10 seconds. If your auction expires while you are testing, it will
> automatically be marked `ENDED` and all your bids will return
> `"The auction is no longer active"`. Always use at least `1 hour`.

### Note the auto-generated IDs
```sql
SELECT id, username FROM users;
SELECT id, title, status FROM auction_item;
```
Users should return `id = 1` (vishal_dev) and `id = 2` (nandini_dev). AuctionItem should return `id = 1`. **Write these down.**

### Exit Postgres
```bash
\q
```

---

## PHASE 1.5: Verify the New REST API (Phase 1.1 Additions)

We successfully automated the creation of Users and Auctions via the new
REST controllers. No more raw SQL needed for testing.

### Test 1 — Register a User via API
**Method:** `POST`
**URL:** `http://15.207.20.75:8080/api/users/register`
**Body (JSON):**
```json
{
  "username": "frontend_dev",
  "email": "dev@test.com"
}
```
**✅ Expected:** 200 OK with the full User object + ID.

### Test 2 — Create an Auction via API
**Method:** `POST`
**URL:** `http://15.207.20.75:8080/api/auctions`
**Body (JSON):**
```json
{
  "title": "Rolex Submariner",
  "description": "Vintage 1970 collectors piece",
  "startingPrice": 5000.00,
  "endTime": "2026-12-31T23:59:59"
}
```
**✅ Expected:** 200 OK with the full AuctionItem object + ID.

### Test 3 — List All Auctions
**Method:** `GET`
**URL:** `http://15.207.20.75:8080/api/auctions`
**✅ Expected:** 200 OK with a JSON array of all existing auctions.

### Test 4 — Get Single Auction Details
**Method:** `GET`
**URL:** `http://15.207.20.75:8080/api/auctions/1`
**✅ Expected:** 200 OK with details of auction #1.

---

## PHASE 2: Configure Postman

1. Open Postman → Click **`+`** to open a new request tab.
2. Change method from `GET` → **`POST`**.
3. URL: `http://15.207.20.75:8080/api/auctions/1/bids`
4. Click **Body** tab → select **raw** → change dropdown from `Text` to **`JSON`**.
5. Save the request into a Collection named `AuctionX Tests`.

---

## PHASE 3: Test the Core Bidding API

### Test 1 — Happy Path (Successful Bid)

**Request Body:**
```json
{
  "userId": 1,
  "amount": 1100.00
}
```

**✅ Expected Response (200 OK):**
```json
{
  "auctionItemId": 1,
  "username": "vishal_dev",
  "bidAmount": 1100.00,
  "bidTime": "2026-04-07T10:30:00",
  "status": "SUCCESS"
}
```

**✅ Verify in Database:**
```sql
SELECT current_highest_bid FROM auction_item WHERE id = 1;
```
Must return `1100.00`.

---

### Test 2 — Bid Too Low (Business Validation)

**Request Body:**
```json
{
  "userId": 1,
  "amount": 500.00
}
```

**✅ Expected Response (400 Bad Request):**
```
Bid amount must be higher than current highest bid
```

---

### Test 3 — Invalid Input (Missing Fields)

**Request Body:**
```json
{
  "userId": null,
  "amount": -50
}
```

**✅ Expected Response (400 Bad Request)** with validation error messages.

---

### Test 4 — Non-Existent Auction

Change URL to: `http://15.207.20.75:8080/api/auctions/999/bids`

**Request Body:**
```json
{
  "userId": 1,
  "amount": 2000.00
}
```

**✅ Expected Response (400 Bad Request):**
```
Auction Item not found
```

---

### Test 5 — Optimistic Locking / Race Condition Test ⚡

We simulate two real humans (`vishal_dev` and `nandini_dev`) bidding at the exact
same millisecond on the same auction item.

You cannot click Send twice at the same millisecond in Postman.
Use this command from your Ubuntu terminal instead.
The `&` at the end fires both requests in **true parallel threads**:

```bash
curl -s -X POST http://localhost:8080/api/auctions/1/bids \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "amount": 1500.00}' & \
curl -s -X POST http://localhost:8080/api/auctions/1/bids \
  -H "Content-Type: application/json" \
  -d '{"userId": 2, "amount": 1500.00}'
```

**✅ Expected Result (Two responses printed simultaneously):**
- One user: `"status": "SUCCESS"` with `200 OK` → They won the bid!
- Other user: `400 Bad Request` → `"Someone else placed a bid just before you! Please fetch the latest price and try again."`

The second error **IS the success.** It proves `@Version` Optimistic Locking caught the
race condition and protected the data integrity.

**✅ Verify in the logs which user won:**
```bash
docker logs auctionx --tail 20
```
You will see exactly which `userId` won and which was rejected by the lock.

---

## PHASE 4: Trigger the Full Kafka Event Chain

### Step 1: Insert a Flash Auction (expires in 40 seconds)
```bash
docker exec -it postgres psql -U auctionuser -d auctiondb -c "
INSERT INTO auction_item (title, description, starting_price, current_highest_bid, end_time, status, version)
VALUES ('Flash Auction', 'Expires in 40 seconds', 100.00, 99.99, NOW() + INTERVAL '40 seconds', 'ACTIVE', 0);"
```

### Step 2: Place a winning bid on it (note the new ID — probably `2`)
In Postman, update URL to `/api/auctions/2/bids`:
```json
{
  "userId": 1,
  "amount": 200.00
}
```

### Step 3: Wait 50 seconds
The `AuctionEndScheduler` fires every 10 seconds. It will detect the expired auction, mark it `ENDED`, and publish the `AuctionCompletedEvent` to Kafka.

### Step 4: Verify Kafka received the event
```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:29092 \
  --topic auction-completed \
  --from-beginning \
  --max-messages 5
```
**✅ Expected:** JSON payload with the winning user's details printed in the terminal.

### Step 5: Verify Payment Service consumed the event
```bash
docker logs payment --tail 30
```
**✅ Expected:** Log lines showing `Processing payment for auction...`

### Step 6: Verify Email in Mailpit
Open browser: `http://15.207.20.75:8025`

**✅ Expected:** HTML notification email sent to `vishal@test.com`.
This confirms the entire `Kafka → Payment → Notification` chain worked end-to-end.

---

## PHASE 5: Spring Actuator Health Check

| Check           | URL                                                            |
|-----------------|----------------------------------------------------------------|
| App Health      | `GET http://15.207.20.75:8080/actuator/health`                 |
| JVM Memory      | `GET http://15.207.20.75:8080/actuator/metrics/jvm.memory.used`|

**✅ Expected from `/actuator/health`:**
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "UP" }
  }
}
```

---

## Final Checklist

| Test                              | Expected Result                       | Pass? |
|-----------------------------------|---------------------------------------|-------|
| Disk space below 85%              | `df -h` shows available space         | [ ]   |
| All 7 containers running          | `docker ps` shows all `Up`            | [ ]   |
| User + Auction seeded             | SQL INSERT returns successfully        | [ ]   |
| Happy Path Bid                    | 200 OK + BidResponse JSON             | [ ]   |
| Bid Too Low                       | 400 + "must be higher" message        | [ ]   |
| Null / Invalid Fields             | 400 + Validation errors               | [ ]   |
| Non-Existent Auction              | 400 + "not found" message             | [ ]   |
| Concurrent Bids (Race Condition)  | One 200, One 400 with lock error      | [ ]   |
| Kafka topic receives event        | JSON payload in console consumer      | [ ]   |
| Payment logs show processing      | Log lines in `docker logs`            | [ ]   |
| Mailpit shows notification email  | Email visible at port 8025            | [ ]   |
| Actuator health check             | `"status": "UP"` for db + redis       | [ ]   |
