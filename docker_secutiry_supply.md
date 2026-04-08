# Docker 2026: The "Secure Supply Chain" Cheatsheet 🛡️🚀

A fast-paced guide to mastering SBOMs, Provenance, and Docker Scout for production-ready images.

---

## 1. The "Digital ID" (Definitions)

*   **SBOM (Software Bill of Materials):** The "Nutrition Label" for your app—a complete list of every library, version, and dependency inside your image.
*   **Provenance:** The "Certificate of Origin"—a digital proof that tells you *who* built the image, *when*, *where* (which repo/branch), and *how*.

---

## 2. Implementation (The Build)

### Via CLI (Manual Build)
Use the `--attest` flag to "bake" security into your image.
```bash
docker buildx build --push \
  --attest type=sbom \
  --attest type=provenance,mode=max \
  --tag your-id/app:latest .
```

### Via `docker-compose.yml` (Native Way)
Add this block inside the `build:` section of each service.
```yaml
services:
  app:
    build:
      context: .
      attestations:
        - type=sbom
        - type=provenance,mode=max
```

---

## 3. Verification (The "Police Check")

| Goal | Command |
| :--- | :--- |
| **Quick Health Check** | `docker scout quickview <image>:<tag>` |
| **List Ingredients** | `docker scout sbom <image>:<tag> --format list` |
| **Check Certificate** | `docker buildx imagetools inspect <image>:<tag>` |
| **Actionable Fixes** | `docker scout recommendations <image>:<tag>` |
| **Detailed CVEs** | `docker scout cves <image>:<tag>` |

---

## 4. Setup & Reference

### Installation (Ubuntu/Linux)
```bash
curl -fsSL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh
```

### Essential Maintenance
- **Login (Required for Scout):** `docker login`
- **Clean Dangling Images:** `docker image prune`
- **Clean All Unused Data:** `docker system prune -a`

---

> [!TIP]
> **The 2026 Mantra:** "Never deploy a black box." If an image doesn't have an SBOM, treat it as infected.

> [!IMPORTANT]
> Always use `mode=max` for provenance in CI/CD pipelines to capture the source code commit and build environment variables.
