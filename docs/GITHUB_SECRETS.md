# GitHub Secrets Configuration

## Required Secrets

Add these secrets in GitHub repo settings (Settings → Secrets and variables → Actions):

### CLOUDFLARE_API_TOKEN

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Permissions:
   - Account: Workers Scripts: Edit
   - Account: Account Settings: Read
   - Account: D1: Edit
   - Account: R2: Edit
   - Account: Workers KV Storage: Edit
5. Copy token and add to GitHub secrets

### CLOUDFLARE_ACCOUNT_ID

Your Cloudflare account ID: `ec81afc4dc58b34ce34e7ad19fd6fbdd`

## Setting Secrets via CLI

```bash
# Navigate to GitHub repo settings
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

## Verifying Setup

After adding secrets, push to main branch and check:
- GitHub Actions tab for deployment status
- https://ohio-beer-path.abandini.workers.dev for live site
