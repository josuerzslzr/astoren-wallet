---
epic: 2
title: "Pilot on AWS (dev environment)"
status: stories-drafted
master: ../epics.md
---

## Epic 2: Pilot on AWS (dev environment)

Testers open the wallet on a public HTTPS URL and sign up with real Amazon Cognito, on infrastructure created and destroyed per working session. Users, images, logs and Terraform state survive between sessions. The database starts empty each session and is rebuilt by the migration and seed Jobs. From here on, every epic deploys to dev too.

The epic is sliced as a **walking skeleton**. The first four stories put a thin but real wallet-api on AWS that answers from RDS over HTTPS. Later stories add one capability each (logs, real identity, CI) on top of something already running.

**FRs covered:** FR-1 (real identity provider). **Architecture:** AD-20, AD-23 (dev seed mapped to Cognito `sub`s), AD-24 (logs to CloudWatch), AD-25, AD-26, ADR-26.

### Build order

This epic interleaves with Epic 1, so **don't build it in number order after Epic 1 closes**. Decided 2026-11-26:

1. Story 1.2 → Story 1.3 (API conventions and `/readyz`, migrations, charts, `deploy.sh local`)
2. Stories 2.1 → 2.2 → 2.3 → 2.4: **walking skeleton**, `/readyz` against RDS on the CloudFront URL
3. Story 2.5 (logs), and optionally Story 2.7 so PR checks run from here on
4. Stories 1.4 → 1.11, each deployed to dev as it lands
5. Story 2.6 (real identity, sign-up on the internet), then Story 2.7 if not done yet

Each story lists its prerequisites. A story never depends on a later-numbered story in this epic.

### Decisions

Decided 2026-11-26 while drafting the stories:

- **HTTPS through CloudFront's default domain.** A CloudFront distribution on `*.cloudfront.net` sits in front of the session ALB, and the ALB accepts traffic only from CloudFront. The URL changes per session until an own domain is added (deferred follow-up). AD-26 says nothing about HTTPS. Recording it in the spine is **deferred** (user decision 2026-11-27) until the own-domain / ALB exploration, since CloudFront may turn out to be a temporary workaround.
- **Terraform owns the ALB.** The session root creates the ALB, its target groups and listener rules, so CloudFront's origin is known at apply time and `destroy` leaves nothing behind. The AWS Load Balancer Controller only attaches pods to those target groups (`TargetGroupBinding`). It never creates load balancers.
- **Session lifecycle.** `infra/scripts/session.sh up|down` runs locally. A nightly scheduled GitHub workflow runs `down` as a safety net against a forgotten session.
- **Cluster add-ons are installed by `session.sh up`** with `helm upgrade --install` from one pinned versions file, after `terraform apply`. They are not installed through the Terraform Helm provider, so the session root never configures a provider from a cluster it is creating. Each story adds the add-on it needs to that file.

### Database design

No new tables. RDS is created empty each session (ADR-26). The migration Job rebuilds the schemas and reference data, and the seed Job (once Story 1.11 exists) rebuilds test users and balances. Nothing in this epic may depend on data surviving a session.

### Story 2.1: Persistent AWS foundation

**Prerequisites:** Story 1.1.

As the project owner,
I want the always-on AWS resources defined in Terraform with remote state and a spend alarm,
So that sessions can come and go without losing state or images, and free-plan credits are never burned silently.

**Acceptance Criteria:**

**Given** an AWS account with no project resources
**When** I follow the bootstrap in `infra/terraform/persistent/README.md` (first apply on local state, then `terraform init -migrate-state`)
**Then** a state bucket (versioned, encrypted, public access blocked) holds the persistent root's own state, and every later apply uses it with S3-native state locking
**And** the README documents the key the session root (Story 2.2) uses in the same bucket

**Given** the persistent root applied
**When** I list its resources
**Then** there is one ECR repository per deployable image (wallet-api, which serves both the api and worker entry points; web; bank-sim, cash-sim, fx-sim), with scan on push and a lifecycle policy keeping the last N images. mock-jwt-issuer has no repository because it is local-only
**And** an AWS Budgets cost budget sends email alerts at configurable thresholds of the monthly credit burn
**And** an SSM Parameter Store naming convention `/astoren-wallet/dev/<runnable>/<VAR>` is documented, with persistent values under it and session values under `/astoren-wallet/dev/session/` (Story 2.2)

**Given** the public repository
**When** the root is committed
**Then** only `*.tf`, `*.tfvars.example` and the README are tracked. Alert emails, region and any account-specific value come from untracked tfvars, and no state file, account ID or ARN appears in git
**And** nothing in this story requires a click in the AWS console beyond creating the bootstrap credentials

### Story 2.2: Session environment up and down

**Prerequisites:** Story 2.1.

As the project owner,
I want one command that creates the dev environment and one that destroys it,
So that I pay for the cluster and database only while I'm working (ADR-26).

**Acceptance Criteria:**

**Given** the persistent root applied
**When** I run `infra/scripts/session.sh up`
**Then** the session root (state in the persistent bucket) creates: a VPC across two AZs with public subnets and an internet gateway and **no NAT gateway** (the plan contains no `aws_nat_gateway`); an EKS 1.36 cluster with a managed node group sized from tfvars and the Pod Identity agent add-on; an EKS access entry for my admin principal; and writes a kubeconfig context for it locally (never committed)
**And** RDS PostgreSQL 18.6 (single-AZ, smallest suitable class, storage encrypted, `publicly_accessible = false`, a security group allowing 5432 only from the node security group, `skip_final_snapshot`, no deletion protection) with a generated master password stored as an SSM `SecureString` under `/astoren-wallet/dev/session/`
**And** an S3 receipts bucket (public access blocked, encrypted, `force_destroy`) for AD-31. Its browser CORS rule is added in Story 2.4, once the public origin exists
**And** the database host, port, name and user, the bucket name and other session outputs are written as SSM parameters under `/astoren-wallet/dev/session/`, so they disappear with the session

**Given** a running session
**When** I run `infra/scripts/session.sh down`
**Then** the session root is destroyed with no resources left behind, and the persistent root (ECR, budget, state) is untouched
**And** running `down` when no session exists succeeds as a no-op, and running `up` twice is idempotent

**Given** the session root README
**When** I read it
**Then** it lists every hourly-billed resource with its approximate cost, and how long `up` and `down` take

### Story 2.3: Wallet on dev, answering from RDS

**Prerequisites:** Stories 1.2, 1.3 and 2.2.

As the developer,
I want `deploy.sh dev` to put the wallet on the dev cluster with its config pulled from SSM,
So that the same deploy path I use locally proves the wallet runs on AWS against RDS (AD-25, AD-26).

**Acceptance Criteria:**

**Given** `session.sh up`
**When** add-ons are installed after `terraform apply`
**Then** External Secrets Operator is installed with `helm upgrade --install` at a version pinned in the add-ons versions file, under its own EKS Pod Identity association whose role allows only `ssm:GetParameter*` on `/astoren-wallet/dev/*` and `kms:Decrypt` for that key. No IRSA, no widened node role, no static keys
**And** a `ClusterSecretStore` for SSM in the session's region exists, and re-running `up` is idempotent

**Given** a running session
**When** I run `infra/scripts/deploy.sh dev`
**Then** it runs the same steps as `deploy.sh local` (build images, push to ECR tagged with the git SHA, migration Job, then the seed Job once Story 1.11 adds it, then `helm upgrade` per runnable with `values-dev.yaml`), with the environment as the only difference (AD-26)
**And** it fails fast with a clear message if no session is up, and resolves the ECR registry at run time, so no account ID is in any committed file
**And** mock-jwt-issuer is never deployed to dev, and wallet-worker keeps `replicas: 1` and `strategy: Recreate`

**Given** the dev charts
**When** pods and the migration Job start
**Then** their env comes from Kubernetes Secrets synced by `ExternalSecret`s from SSM (database host, port, name, user and password at this point; later stories add their own). A missing value fails the pod at boot through the zod config schema, and no secret value appears in `values-dev.yaml` (AD-25)

**Given** the deploy finished
**When** I `kubectl port-forward` to wallet-api and call `/healthz` and `/readyz`
**Then** liveness answers 200, readiness reports the RDS connection as up, and the migration Job's log shows every migration applied to RDS (the per-module schemas exist)
**And** after `session.sh down` and `up`, a fresh `deploy.sh dev` reaches the same state on an empty RDS

### Story 2.4: Public HTTPS entry: ALB behind CloudFront

**Prerequisites:** Story 2.3.

As a pilot tester,
I want to reach the wallet on an HTTPS URL,
So that my password and data never cross the internet unencrypted.

**Acceptance Criteria:**

**Given** `session.sh up`
**When** the session root applies
**Then** it creates an internet-facing ALB whose security group admits HTTP only from the CloudFront origin-facing managed prefix list, with one target group for web and one for wallet-api (target type `ip`)
**And** listener rules route the API and socket.io paths to the wallet-api target group and everything else to web. wallet-worker and every simulator have no route (AD-26)
**And** the ALB idle timeout is set above 2× the socket.io ping interval (spine infrastructure rule; exercised end to end when socket.io lands in Epic 3)

**Given** the ALB
**When** the CloudFront distribution is created
**Then** it uses the default `*.cloudfront.net` certificate, redirects HTTP viewers to HTTPS, forwards to the ALB with caching disabled and all viewer headers, query strings and cookies passed for the API and socket.io paths, and allows WebSocket upgrades
**And** CloudFront adds a secret origin header (generated, stored in SSM) and the ALB listener returns 403 to any request without it, so the ALB DNS name is not a usable bypass
**And** `session.sh up` prints the HTTPS URL, and the receipts bucket's CORS allows browser POST from exactly that origin

**Given** `session.sh up` installing add-ons
**When** the AWS Load Balancer Controller is installed (pinned in the versions file, own Pod Identity role limited to the target-group registration `TargetGroupBinding` needs)
**Then** `deploy.sh dev` creates `TargetGroupBinding`s that attach the web and wallet-api Services to the Terraform-created target groups, and the controller creates no load balancer of its own

**Walking-skeleton check:**

**Given** a session up and `deploy.sh dev` run
**When** I call `/readyz` on the CloudFront URL from the internet
**Then** it answers over HTTPS with the RDS connection up, the same call to the ALB DNS name is refused with 403, and the web root loads
**And** `session.sh down` destroys CloudFront, the ALB and the target groups with the rest of the session

### Story 2.5: Logs to CloudWatch

**Prerequisites:** Story 2.3.

As the developer,
I want every pod's logs in CloudWatch, kept after the session is destroyed,
So that I can investigate yesterday's session without a running cluster (AD-24).

**Acceptance Criteria:**

**Given** the persistent root
**When** it is applied
**Then** a dev CloudWatch log group exists with a configurable retention (default 7 days), owned by the persistent root so logs outlive a session

**Given** `session.sh up` installing add-ons
**When** Fluent Bit is installed (pinned in the versions file)
**Then** it runs under its own Pod Identity association whose role allows only log-stream create and put on that log group
**And** no Fluent Bit config forwards anything other than container logs

**Given** a deployed wallet-api
**When** it handles a request
**Then** its structured JSON log line appears in CloudWatch, parsed as JSON, with namespace, pod and container metadata, and with no token or secret in any line (AD-24)
**And** after `session.sh down`, the log group and its events are still there

### Story 2.6: Real identity: sign up on the internet

**Prerequisites:** Stories 1.6, 1.8, 1.9, 1.11, 2.4 and 2.5.

As a pilot tester,
I want to open the pilot URL, sign up with my email and see my wallet,
So that I can try the pilot from anywhere with an account that survives between sessions (FR-1).

**Acceptance Criteria:**

**Given** the persistent root
**When** it is applied
**Then** a Cognito user pool exists with email as the username, email verification required, a password policy, and Cognito's default email sender (pilot volume stays within its daily quota)
**And** the pool has deletion protection on and `lifecycle { prevent_destroy = true }`, so a plan that would destroy it fails
**And** there is one public app client with no secret, the SRP and refresh-token auth flows, configured access-token validity, and no hosted UI or OAuth callbacks (custom in-app forms, AD-20)
**And** an `operator` group exists, and the issuer URL, JWKS URL, user pool id and client id are written to SSM as plain `String` parameters

**Given** seed test users listed in untracked tfvars (emails only)
**When** the persistent root is applied
**Then** each exists in the pool with `email_verified = true` and a generated password stored as an SSM `SecureString`, and the ones flagged as operators are in the `operator` group
**And** their Cognito `sub`s are written to SSM as the dev seed mapping, which the seed Job reads to map seeded wallets to real users (AD-23)
**And** applying twice changes nothing

**Given** `deploy.sh dev`
**When** wallet-api and web start
**Then** wallet-api's JWT guard gets the Cognito issuer, JWKS URL and client id through `ExternalSecret`s, with no code path checking the environment name, while locally the mock issuer stays selected (AD-20, AD-25)
**And** web selects the Amplify Auth adapter against the Cognito pool through config supplied by the chart at runtime, so the same web image serves local and dev

**Given** the CloudFront URL
**When** a new person signs up with email, password and display name
**Then** Cognito emails a verification code, the verify-email screen accepts it, `POST /me` provisions the wallet, and Home shows USD and EUR at 0.00
**And** a seeded test user signs in with its SSM password and sees its seeded balances read from RDS, and an operator-flagged user's token carries the `operator` group
**And** a mock-issuer token sent to dev wallet-api is refused with HTTP 401 (wrong `iss`), proving there is no bypass
**And** the reconciliation job's result line appears in CloudWatch

**Given** a tester who signed up in an earlier session (Cognito user exists, RDS was rebuilt empty)
**When** they sign in and `GET /me` reports no wallet
**Then** the client asks for a display name (reusing the sign-up form's display-name field and validation) and calls `POST /me`, then lands on Home at zero balances
**And** this is flagged as a UX handoff for final copy

### Story 2.7: GitHub Actions: PR checks, deploy and nightly teardown

**Prerequisites:** Story 2.3.

As the developer,
I want PR checks, a one-click deploy and an automatic nightly teardown in GitHub Actions,
So that main stays green, CI deploys exactly like my laptop, and a forgotten session can't drain the credits.

**Acceptance Criteria:**

**Given** a pull request
**When** `.github/workflows/ci.yml` runs on `pull_request`
**Then** it installs with the repo's pinned Node and pnpm, runs `pnpm install --frozen-lockfile` and `pnpm turbo build lint test` (Testcontainers included), with top-level `permissions: contents: read` and no AWS access
**And** every third-party action is pinned to a commit SHA, and no workflow uses `pull_request_target`

**Given** the persistent root
**When** it is applied
**Then** it adds a GitHub OIDC identity provider and two roles, trusted only for this repository's `main` branch: `deploy` (ECR push to the project repositories, EKS access via an access entry the session root creates for it, read of `/astoren-wallet/dev/*`) and `session-teardown` (what destroying the session root needs, plus state bucket access, with IAM actions limited to session-root role names)
**And** no long-lived AWS access key exists in GitHub secrets. Role ARNs are stored as repository variables, never committed

**Given** a running session
**When** I trigger `deploy.yml` (`workflow_dispatch`)
**Then** only that job gets `id-token: write`, it assumes the `deploy` role, and it runs `infra/scripts/deploy.sh dev` with no deploy logic of its own in the YAML

**Given** the nightly schedule (time configurable in the workflow)
**When** `session-teardown.yml` runs (also available as `workflow_dispatch`)
**Then** it assumes `session-teardown` and runs `infra/scripts/session.sh down`, succeeding as a no-op if no session is up, and the persistent root is never touched

### Deferred follow-ups (no stories yet)

- **Own domain + ACM certificate** for a stable HTTPS URL (Route 53 hosted zone in the persistent root, an alias to CloudFront from the session root). Replaces the per-session `*.cloudfront.net` URL.
- **IP-restricted operator endpoint for simulators** (AD-26). It arrives with the first simulator deployed to dev (fx-sim, Epic 3). Until then, operators use `kubectl port-forward`.
- **Metrics and alerting, OpenTelemetry**: their own later epics (spine Deferred).
