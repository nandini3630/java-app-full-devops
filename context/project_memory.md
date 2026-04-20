# AuctionX Project Memory Context

## Project Overview
**AuctionX** is a production-grade microservices application tailored for a real-time auctioning platform. It features an 8-tier architecture (including infrastructure components) and is designed with an emphasis on high availability, security, and a premium user experience ("Stellar Obsidian" UI/UX).

## Technology Stack
- **Backend**: Java 17+ with Spring Boot (Microservices Architecture).
- **Frontend**: React (Next.js) leveraging TypeScript and TailwindCSS (Stellar Obsidian design system).
- **Databases & Caching**: PostgreSQL (Relational DB), Redis (Caching layer).
- **Message Broker**: Apache Kafka (Event-driven communication).
- **Testing/Email**: Mailpit (local SMTP testing).

## Microservices Architecture
1. **auctionx**: Core service handling auction creation, bidding logic, and user registration.
2. **payment**: Handles transactional operations related to the auctions.
3. **notification**: Listens to Kafka topics to trigger email notifications (via Mailpit/SMTP).
4. **frontend**: The Next.js UI application for end users.

## DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose (`docker-compose.yml`, `docker-compose.prod.yml`).
- **CI/CD**: GitHub Actions. Features parallelized multi-architecture builds (AMD64/ARM64) using Docker Buildx and QEMU. Includes security attestations (SBOM/Provenance) and Docker Scout vulnerability scanning.
- **Orchestration**: Kubernetes cluster bootstrapped via `kubeadm`. 
- **Cloud Provider**: AWS EC2 instances (1 Master Node, 2 Worker Nodes).
- **Security Strategy**: "No black box" deployment strategy, enforcing non-root privileges (`no-new-privileges=true`) across containers.

## Current Project State & Recent Activity
- **UI Refinement**: Transitioned frontend to a "Cyber-Luxury" / "Stellar Obsidian" aesthetic, fixing hydration errors and styling bugs.
- **Backend Optimization**: Fixed slow Maven build times by implementing `.m2/repository` caching.
- **Infrastructure Migration**: In the process of migrating from local Docker Compose setups to the production-grade Kubernetes cluster on AWS EC2.

---
*Note to LLMs/Agents: When assisting with this project, strictly adhere to the established architecture, use production-ready security practices, and maintain the high-quality UI/UX standards set by the Stellar Obsidian design guidelines.*
