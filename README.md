# MboaTrust

MboaTrust is organized as a monorepo with one mobile app and separate backend services.

## Structure

```text
MboaTrust/
  apps/
    mobile/              # Expo / React Native mobile app
  services/
    api/                 # FastAPI backend and PostgreSQL models
    data-collection/     # Mobile Money / SMS data collection agent
    credit-scoring/      # Credit scoring model service and model assets
  docs/                  # Cross-project documentation
```

## Local Commands

Mobile app:

```powershell
cd apps/mobile
npm install
npm start
```

Android debug build:

```powershell
cd apps/mobile
npm run android:build
```

API backend:

```powershell
cd services/api
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python main.py
```

Data collection agent:

```powershell
cd services/data-collection
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python cub_data_agent.py
```

## Deployment Notes

- Do not commit generated folders such as `node_modules`, `venv`, `.expo`, Android build output, upload folders, or logs.
- The mobile app should use deployed HTTPS service URLs for production builds.
- Each service can have its own CI/CD job because each one has its own dependencies and deployment target.
