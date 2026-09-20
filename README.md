# NEO-PeriGee

NEO-PeriGee is a real-time Near-Earth Object (NEO) monitoring, orbital trajectory visualization, and planetary defense impact physics simulation platform. The system ingests live telemetry from NASA's NeoWs (Near Earth Object Web Service) API, calculates real-time geocentric polar flyby dynamics, and evaluates kinetic impact threat metrics based on peer-reviewed astrophysical impact equations.

---

## System Architecture and Capabilities

### 1. Real-Time Orbital Telemetry & Polar Radar Visualizer
- **Geocentric Polar Radar Scope**: Interactive SVG radar projecting close-approach trajectories relative to Earth (Terra) with concentric Lunar Distance (LD) range rings (1 LD, 5 LD, 10 LD).
- **Dynamic Orbital Mechanics Simulation**: Time-accelerated playback engine (1x, 60x, 3600x, 86400x) with real-time flyby vectors, approaching/receding indicators, and sweep beam synchronization.
- **Instantaneous Telemetry Deck**:
  - Instantaneous geocentric range ($r(t)$ in Lunar Distances and kilometers)
  - Range rate ($dr/dt$ closing or receding velocity in km/s)
  - Radar Doppler frequency shift (X-band 8.56 GHz radar model)
  - Radar echo delay time ($2d/c$)

### 2. Kinetic Impact Modeling Engine
- **Kinetic Energy Yield**: Calculates kinetic energy in Joules and Megatons TNT equivalent ($E_k = \frac{1}{2} m v^2$) based on estimated diameter, density, and entry velocity.
- **Atmospheric Blast Wave Dynamics**: Overpressure peak (kPa and psi) calculated via scaled blast radius laws ($R / W^{1/3}$).
- **Crater Dimension Estimation**: Transient and final crater diameter and depth based on target rock/soil density models.
- **Thermal Radiation & Fireball Radius**: Radius of thermal ignition and severe skin burn zones.
- **Seismic Shock & Acoustic Overpressure**: Equivalent Richter magnitude and sound pressure level (dB) at designated observer radii.
- **Deflection Requirements**: Calculates impulse velocity requirements ($\Delta v$) and interceptor lead times based on standard DART-scale momentum enhancement factors.

### 3. Threat Classification & Observation Analytics
- **Hazard Categorization**: Automated tagging of Potentially Hazardous Asteroids (PHAs) based on absolute magnitude ($H \le 22.0$) and minimum orbit intersection distance (MOID $\le 0.05$ AU).
- **Dynamical Family Classification**: Identification of Aten, Apollo, Amor, and Atira orbital families.
- **Perigee Scatter Dynamics**: Velocity versus close-approach distance distribution analysis across the tracked population.
- **Torino & Palermo Scale Evaluations**: Standardized planetary defense threat rating indicators.

### 4. NASA NeoWs API Integration
- **Live Feed Mode**: Direct retrieval of real-time close-approach data from NASA's Jet Propulsion Laboratory (JPL) small-body database.
- **Rate Limit Management**: Built-in credential configuration supporting both the public demo rate tier (30 requests/hour) and dedicated personal NASA API keys (1,000 requests/hour).
- **Curated Fallback Telemetry**: Offline and failover datasets including high-interest reference bodies such as 99942 Apophis, 101955 Bennu, and (29075) 1950 DA.

---

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Bundler & Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom glassmorphic telemetry theme tokens
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide React
- **Runtime Environment**: Node.js (v20+)

---

## Getting Started

### Prerequisites

Ensure you have Node.js 20 or higher and npm installed on your system.

```bash
node -v
npm -v
```

### Installation

Clone the repository and install project dependencies:

```bash
git clone <repository-url>
cd neo-perigee
npm install
```

### Environment Configuration

The application operates out-of-the-box using curated telemetry and the default NASA DEMO_KEY. To use your personal NASA API key via environment variables:

1. Create a `.env` file in the project root:

```env
VITE_NASA_API_KEY=your_api_key_here
```

2. Alternatively, configure your key at runtime via the NASA API Key modal in the application sidebar.

### Running Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build

To compile and optimize the application for production deployment:

```bash
npm run build
```

The build artifacts will be output to the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

### Code Verification

Execute static type checking:

```bash
npm run lint
```

---

## User Interface Themes

The dashboard supports two display modes optimized for data legibility:
- **Deep Space Mode**: Dark neutral palette with high-contrast amber, emerald, and coral telemetry accents designed for low-light observation environments.
- **High-Contrast Light Mode**: Cool neutral slate palette adhering to WCAG AA contrast standards for bright viewing conditions.

---

## Planetary Defense Data Sources

- NASA Near-Earth Object Web Service (NeoWs): https://api.nasa.gov
- NASA JPL Center for Near-Earth Object Studies (CNEOS): https://cneos.jpl.nasa.gov
- Minor Planet Center (MPC): https://minorplanetcenter.net

---

## License

This project is open source and available under the MIT License.
