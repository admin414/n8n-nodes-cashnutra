# n8n-nodes-cashnutra

Phase-1 read-only community node for Cash Nutra.

## Resources

- Offers: cursor-aware `GET /offers`; tracking URLs are disabled by default with `include_tracking_url=false&dry_run=true`.
- Conversions: cursor-aware `GET /conversions`, scoped to the authenticated affiliate.

The API token is stored as an n8n credential and is never embedded in a workflow export. No payment, payout, conversion, postback, offer-access, or tracking-link mutation is exposed.

Publication remains pending. n8n requires a package named `n8n-nodes-*`, the community-node keyword, lint/testing, npm publication, and—since May 1, 2026—GitHub Actions provenance for verified-node review.

Documentation: https://www.cash-nutra.com/docs/affiliate-api

## Credentials

Create a revocable token in Cash Nutra Dashboard → Integrations and store it only in the n8n credential. Never place the token in workflow fields, exports, screenshots, or public repositories.

## Local validation

```sh
npm ci
npm run validate
npm audit --omit=dev
```

The package is published only through the manual GitHub Actions workflow with npm provenance. A GitHub repository or npm package does not imply n8n verification; the node remains unofficial until n8n approves it in the Creator Portal.
