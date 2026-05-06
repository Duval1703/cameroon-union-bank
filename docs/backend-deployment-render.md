# Backend Deployment on Render

This guide deploys the public backend needed by the installed APK.

## What Gets Deployed

- `mboatrust-api`: main FastAPI backend and database API.
- `mboatrust-data-collection`: transaction data collection agent.
- `mboatrust-provider-simulator`: MTN/Orange consent simulator for demo testing.
- `mboatrust-credit-scoring`: AI credit scoring service.
- `mboatrust-db`: PostgreSQL database.

## Deploy From GitHub

1. Commit and push the latest code to GitHub.
2. Open [Render](https://dashboard.render.com/).
3. Click **New +**.
4. Choose **Blueprint**.
5. Connect the GitHub repository `Duval1703/MboaTrust-AI`.
6. Select the `main` branch.
7. Render should detect `render.yaml` at the repository root.
8. Click **Apply** or **Create Blueprint**.
9. Wait for all services to finish deploying.

Render Postgres uses the `basic-256mb` database plan in `render.yaml`. Render will show pricing before creating resources; confirm it only if you accept the database cost.

## Expected Public URLs

If the names are available, Render will create these URLs:

- API: `https://mboatrust-api.onrender.com`
- Data agent: `https://mboatrust-data-collection.onrender.com`
- Provider simulator: `https://mboatrust-provider-simulator.onrender.com`
- Credit scoring: `https://mboatrust-credit-scoring.onrender.com`

If Render gives a different URL, update:

- `render.yaml`
- `apps/mobile/eas.json`

Then commit, push, and rebuild the APK.

## Test After Deployment

Open these links in the browser:

- `https://mboatrust-api.onrender.com/health`
- `https://mboatrust-data-collection.onrender.com/health`
- `https://mboatrust-provider-simulator.onrender.com/health`
- `https://mboatrust-credit-scoring.onrender.com/health`

Each should return JSON with a healthy status.

## Rebuild the APK

After the backend is live, run the GitHub Actions workflow:

1. Go to GitHub repository **Actions**.
2. Open **Android EAS Build**.
3. Click **Run workflow**.
4. Use branch `main`.
5. Use profile `preview`.
6. Wait for the EAS build.
7. Download or install the new APK from Expo.

## Important Notes

- The old APK was built before the Render URLs were configured. Use the next APK build.
- Render free web services can sleep when inactive. The first request after sleep can take longer.
- File uploads currently use local service storage. For production, move receipt/document uploads to persistent object storage such as S3, Cloudflare R2, or Render Disk.
- The provider simulator is for testing. Real MTN/Orange integrations need official API access or the final SMS consent workflow.
