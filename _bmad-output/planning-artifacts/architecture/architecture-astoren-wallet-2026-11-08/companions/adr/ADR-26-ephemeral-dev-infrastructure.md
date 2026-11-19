# ADR-26: Ephemeral dev infrastructure on the EKS Free plan, two Terraform roots

- **Status:** Accepted, 2026-11-19
- **Spine rule:** [AD-26](../../ARCHITECTURE-SPINE.md#ad-26--ephemeral-dev-infrastructure-exposure-and-one-deploy-path-adopted); related AD-23, AD-25
- **Binds:** Terraform, Helm, deploy script, GitHub Actions

## Context

The project runs Kubernetes everywhere: minikube locally, AWS in `dev` (AD-25). The AWS account is on the **Free plan**: new accounts get about USD 100 in credits, and the plan ends after 6 months or when credits run out; the owner will not upgrade to Paid. EKS costs about USD 0.10 per cluster-hour and an ALB charges hourly, both paid from credits. EKS was confirmed available on the Free plan (2026-11-19), so no k3s fallback is needed.

Leaving a cluster, load balancer, NAT gateway and database running around the clock would burn the credits quickly. But some resources must survive: deleting the Cognito user pool would invalidate every test user, and the container registry and secrets should not be recreated each day.

Terms: a **Terraform root** is a directory with its own state file, applied and destroyed independently. **ClusterIP** is a Kubernetes service reachable only inside the cluster.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Always-on dev environment | Zero setup time per session | Idle spend exhausts free-plan credits |
| **Ephemeral session infra, persistent identity/registry** (chosen, user) | Pay only while working | Each session waits for apply; RDS starts empty |
| One Terraform root for everything | Simpler layout | `terraform destroy` would also delete the Cognito user pool. **Rejected**: two roots with separate state |
| NAT gateway for private subnets | Conventional network layout | Hourly cost. **Rejected**: public subnets, no NAT gateway |
| RDS final snapshot restored each session | Data survives | Snapshot handling and cost. **Rejected**: start empty; migrations + seed Job rebuild state |
| Secrets Manager | Rotation features | USD 0.40 per secret per month; rotation not needed. **Rejected** for SSM Parameter Store SecureString |
| Simulators on the ALB under path prefixes | Easy operator access | Simulator controls reachable from the internet. **Superseded**: ClusterIP only |
| Separate CI-only deploy logic | Tailored pipelines | Local and CI deploys diverge. **Rejected**: one script |

## Decision

- **Two Terraform roots with separate state:**
  - `infra/terraform/persistent`: Cognito, ECR, SSM parameters, state bucket. Always on.
  - `infra/terraform/session`: VPC with public subnets and **no NAT gateway**, EKS, ALB, RDS, S3 receipt bucket. **Applied and destroyed per working session**, RDS starting empty.
- The **ALB routes only to `wallet-api` and the web client.** Simulators are **ClusterIP** services: wallet-api and webhooks reach them in-cluster; operators reach them with `kubectl port-forward` or an IP-restricted endpoint whose allowed IPs come from **untracked tfvars, never git**.
- **One deploy script** (build images -> push to ECR -> migration Job -> seed Job -> `helm upgrade` per runnable) is the **only deploy path**, run locally or by GitHub Actions.
- **One Helm chart per runnable** with `values-local.yaml` / `values-dev.yaml`.
- Nothing is configured by hand in the AWS console (AD-25).

## Consequences

**Positive**
- Cloud spend happens only during working sessions, stretching the free-plan credits.
- `destroy` can never delete users or images, because they live in the other root.
- The whole environment is reproducible from Terraform + Helm + migrations + seed; there is no hidden console state.
- Simulator controls are never public.

**Negative**
- Each session starts with a cluster create (slow) and an empty database; anything not in migrations or the seed Job is lost.
- Public subnets without NAT require care with security groups.
- Seeded users must map to existing Cognito `sub`s in the persistent pool (AD-23).

**Follow-ups and revisit triggers**
- **Production/staging environments, backups, AWS account lifetime** (Deferred): revisit when a real launch is planned. When the Free plan ends, cloud deployment stops; no Terraform provision exists for that.
- **Metrics and alerting** and **OpenTelemetry** are their own later epics.
