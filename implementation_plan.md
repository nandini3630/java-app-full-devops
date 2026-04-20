# Production Kubernetes Deployment Strategy: AuctionX

Congratulations on getting the 4 nodes up! (1 Control Plane, 3 Worker Nodes).

To make this architecture **truly production-ready**, we must ensure High Availability (HA), Fault Tolerance, Security, and Scalability across your 3 worker nodes. Here is the upgraded production-grade plan:

## User Review Required
> [!WARNING]
> This upgraded plan introduces advanced Kubernetes concepts (Anti-Affinity, PDBs, Operators, Network Policies) necessary for a true production environment. Please review to ensure this aligns with your goals.

## 1. Namespace Isolation & Network Security
- **Namespaces**: `auction-data`, `auction-apps`, `auction-frontend`, `observability`.
- **Network Policies**: We will implement strict network isolation. For example, `auction-frontend` pods will ONLY be allowed to talk to the Ingress Controller and `auction-apps`. The `auction-data` namespace will ONLY accept traffic from `auction-apps`.

## 2. Dealing with Secrets and Configs
- **Sealed Secrets / External Secrets**: Default Base64 K8s Secrets are easily decoded and not safe to commit to Git. We will implement [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) to encrypt your `.env` variables so they can be safely stored in GitHub.
- **ConfigMaps**: For non-sensitive configs like `SPRING_KAFKA_BOOTSTRAP_SERVERS`.

## 3. The Data Layer (Stateful vs. Managed Services)
You are 100% correct. Running a relational database inside Kubernetes adds immense operational overhead. For a true production environment, **offloading stateful data to AWS Managed Services** is the industry standard.
- **PostgreSQL**: We will **NOT** run Postgres in Kubernetes. Instead, we will use **AWS RDS (Relational Database Service) for PostgreSQL**. RDS handles automated backups, point-in-time recovery, multi-AZ high availability, and patch management for us automatically. Your `auctionx` and `payment` pods will simply connect to the RDS endpoint URL.
- **Redis**: We can deploy a Redis Sentinel setup inside K8s (using Bitnami's Helm chart) since it is primarily an ephemeral cache. (Alternatively, you could use AWS ElastiCache if you want zero maintenance).
- **Kafka**: We will deploy the Strimzi Operator in KRaft mode. We will configure 3 Kafka brokers (one per worker node) using Pod Anti-Affinity. (Alternatively, AWS MSK is an option, but Strimzi is very robust for self-hosted K8s).
- **Storage Classes**: For Redis and Kafka K8s volumes, we will configure an AWS EBS CSI Driver `StorageClass` (e.g., `gp3`) so PVCs dynamically provision real AWS Elastic Block Store volumes.

## 4. The Application Layer (Stateless, Scalable, Resilient)
Your Java applications and React frontend.
- **Resource Requests & Limits**: Every pod MUST have CPU and Memory limits defined (e.g., `requests: cpu: 500m, memory: 512Mi`) to prevent a single buggy app from crashing an entire worker node.
- **Horizontal Pod Autoscaler (HPA)**: We will configure HPA to automatically spin up more Java/React pods if CPU/Memory usage spikes during a busy auction.
- **Pod Disruption Budgets (PDB)**: We will set PDBs to ensure at least 2 replicas of your apps are ALWAYS running during voluntary AWS node upgrades or maintenance.
- **Pod Anti-Affinity**: We will force K8s to spread the 3 replicas of `auctionx` across the 3 distinct worker nodes.
- **Probes**: Liveness, Readiness, and Startup probes pinging `/actuator/health` or `/api/health`.

## 5. Security Contexts (Least Privilege)
- We will enforce `securityContext` at the Pod and Container level to prevent container breakouts:
  - `runAsNonRoot: true`
  - `allowPrivilegeEscalation: false`
  - `readOnlyRootFilesystem: true` (where possible)

## 6. External Networking
- **Ingress Controller**: NGINX Ingress Controller or Kubernetes Gateway API to route internet traffic to your frontend and APIs.
- **Cert-Manager**: Automatically provision free SSL/TLS certificates via Let's Encrypt so your site uses HTTPS.

## 7. Observability (The "No Black Box" Policy)
- We need to see what's happening inside the cluster. We will deploy the **Prometheus & Grafana Stack** to monitor CPU/Memory, JVM metrics, Kafka lag, and Postgres health.

---

## Open Questions

**Do you approve of incorporating these advanced production features (Anti-Affinity, Sealed Secrets, Operators, HPA, PDBs, Observability)?** 
If yes, I will begin by writing the YAML manifests for the foundational layers (Namespaces, Storage Classes, Sealed Secrets) first.
