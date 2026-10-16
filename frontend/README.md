# POLITARIA frontend

This React application joins the existing landing, registration, login, city campaign screens, and React Three Fiber city world. The Express API remains the source of truth for authentication, city state, construction, policies, missions, events, turn advancement, and win/loss status.

## Run locally

Start MongoDB, then open one terminal for the backend:

```powershell
cd ..\backend
npm install
Copy-Item .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm run dev
```

In a second terminal, run the frontend:

```powershell
cd ..\frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The frontend talks to `http://localhost:5000/api` by default. Set `VITE_API_BASE_URL` in a frontend `.env` file if the API is hosted elsewhere.

## City world controls

- Drag to orbit the camera.
- Scroll to zoom.
- Right-drag to pan.
- Select a building to see its role and current condition.
- Use **Reset view** to return the camera to the overview.

The scene reads city stats and constructed buildings from the API response. Sector scores shape visible facility upgrades, infrastructure changes the road network, population and infrastructure affect traffic, environment drives haze and vegetation, and approval drives public unrest effects. Catalog actions and turn outcomes stay on the backend.

The facilities use procedural Three.js geometry so the project does not depend on a remote model server or downloaded proprietary assets. Their low-poly proportions follow the supplied city-building references; external model-library examples include [Poly Pizza healthcare models](https://poly.pizza/search/healthcare) and [Poly Haven's CC0 asset library](https://polyhaven.com/).
