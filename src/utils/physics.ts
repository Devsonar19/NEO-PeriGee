import { AsteroidComposition, AsteroidCompositionInfo, KineticImpactResult } from '../types';

export const ASTEROID_COMPOSITIONS: Record<AsteroidComposition, AsteroidCompositionInfo> = {
  stony: {
    name: 'Stony (Chondrite / S-Type)',
    density: 2600,
    description: 'Most common silicate-rich asteroid type. Typical density ~2.6 g/cm³.'
  },
  iron: {
    name: 'Iron-Nickel (M-Type)',
    density: 7800,
    description: 'Metallic core fragments with high density ~7.8 g/cm³ and high penetrative yield.'
  },
  carbonaceous: {
    name: 'Carbonaceous (C-Type)',
    density: 1700,
    description: 'Porous, organic-rich volatiles, fragile density ~1.7 g/cm³ prone to high-altitude airburst.'
  },
  cometary: {
    name: 'Cometary / Icy Matrix',
    density: 1000,
    description: 'Volatile ices and silicate dust aggregate with density ~1.0 g/cm³.'
  }
};

const TNT_JOULES_PER_MEGATON = 4.184e15; // 1 Mt = 4.184 x 10^15 Joules
const EARTH_GRAVITY = 9.807; // m/s^2
const DEFAULT_TARGET_DENSITY = 2500; // kg/m^3 (crustal rock)

/**
 * Calculates the complete kinetic impact parameters of an asteroid
 * based on diameter (meters), relative velocity (km/s), composition, and impact angle (degrees).
 */
export function calculateKineticImpact(
  diameterMeters: number,
  velocityKmPerSec: number,
  composition: AsteroidComposition = 'stony',
  impactAngleDegrees: number = 45
): KineticImpactResult {
  const density = ASTEROID_COMPOSITIONS[composition].density;
  
  // Radius in meters
  const radius = diameterMeters / 2;
  
  // Volume of sphere: (4/3) * pi * r^3
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  
  // Mass in kg: Volume * Density
  const mass = volume * density;
  
  // Velocity in meters per second
  const velocityMetersPerSec = velocityKmPerSec * 1000;
  
  // Kinetic Energy: 0.5 * m * v^2 in Joules
  const energyJoules = 0.5 * mass * Math.pow(velocityMetersPerSec, 2);
  
  // Yield in Megatons of TNT
  const megatons = energyJoules / TNT_JOULES_PER_MEGATON;
  
  // Angle in radians for crater scaling
  const angleRad = (impactAngleDegrees * Math.PI) / 180;
  const sinAngle = Math.sin(angleRad);
  
  // Transient crater diameter (Melosh / Collins scaling formula)
  // D_tc = 1.161 * (rho_i / rho_t)^(1/3) * L^0.78 * v^0.44 * g^(-0.22) * sin(theta)^(1/3)
  const densityRatio = density / DEFAULT_TARGET_DENSITY;
  const rawCraterDiameter = 1.161 * 
    Math.pow(densityRatio, 1 / 3) * 
    Math.pow(diameterMeters, 0.78) * 
    Math.pow(velocityMetersPerSec, 0.44) * 
    Math.pow(EARTH_GRAVITY, -0.22) * 
    Math.pow(Math.max(0.1, sinAngle), 1 / 3);
    
  // If yield is tiny, it creates an airburst or small pit
  const craterDiameter = megatons < 0.0001 ? Math.min(rawCraterDiameter, diameterMeters * 3) : rawCraterDiameter;
  const craterDepth = craterDiameter * 0.28; // standard depth-to-diameter ratio for simple craters
  
  // Thermal radiation (fireball) radius in km
  // Scaling: ~ 1.8 * Y^0.4 (where Y is Megatons)
  const fireballRadius = megatons > 0 ? Math.max(0.05, 1.8 * Math.pow(megatons, 0.4)) : 0.01;
  
  // Severe overpressure blast wave (5 psi: destroys typical residential buildings) radius in km
  // Scaling: ~ 3.2 * Y^0.33
  const blastRadius = megatons > 0 ? Math.max(0.1, 3.2 * Math.pow(megatons, 0.33)) : 0.02;
  
  // Seismic magnitude equivalent: M_L ~ 0.67 * log10(E) - 5.87
  const seismicMagnitude = energyJoules > 1e10 
    ? Math.min(11.5, Math.max(1.0, 0.67 * Math.log10(energyJoules) - 5.87))
    : 0;

  // Real-world benchmark context
  let historicalComparison = '';
  if (megatons < 0.005) {
    historicalComparison = 'Comparable to small high-altitude bolide airburst';
  } else if (megatons < 0.03) {
    const ratio = (megatons / 0.015).toFixed(1);
    historicalComparison = `Equivalent to ${ratio}× Hiroshima atomic blasts (Little Boy ~0.015 Mt)`;
  } else if (megatons < 1.0) {
    const ratio = (megatons / 0.5).toFixed(1);
    historicalComparison = `Comparable to ${ratio}× Chelyabinsk 2013 superbolide (~0.5 Mt)`;
  } else if (megatons < 30) {
    const ratio = (megatons / 15).toFixed(1);
    historicalComparison = `Equivalent to ${ratio}× Tunguska 1908 Siberian forest blast (~15 Mt)`;
  } else if (megatons < 200) {
    const ratio = (megatons / 50).toFixed(1);
    historicalComparison = `Equivalent to ${ratio}× Tsar Bomba (~50 Mt, largest thermonuclear bomb)`;
  } else if (megatons < 5000) {
    historicalComparison = 'Continental scale devastation event (Regional biosphere disruption)';
  } else {
    const ratio = (megatons / 100000000).toFixed(3);
    historicalComparison = `Global mass extinction magnitude (${ratio}× Chicxulub K-Pg impactor)`;
  }

  return {
    diameter_meters: Number(diameterMeters.toFixed(1)),
    volume_cubic_meters: volume,
    density_kg_m3: density,
    mass_kg: mass,
    velocity_km_s: Number(velocityKmPerSec.toFixed(2)),
    velocity_m_s: Number(velocityMetersPerSec.toFixed(1)),
    energy_joules: energyJoules,
    megatons_tnt: Number(megatons.toFixed(megatons > 10 ? 1 : 3)),
    crater_diameter_meters: Number(craterDiameter.toFixed(1)),
    crater_depth_meters: Number(craterDepth.toFixed(1)),
    fireball_radius_km: Number(fireballRadius.toFixed(2)),
    blast_airburst_radius_km: Number(blastRadius.toFixed(2)),
    seismic_magnitude: Number(seismicMagnitude.toFixed(1)),
    historical_comparison: historicalComparison
  };
}

/**
 * Calculates real-time instantaneous distance, range rate (dr/dt),
 * Doppler shift, and radar round-trip travel time for an asteroid approaching/receding from Earth.
 */
export function calculateInstantaneousDistance(
  missDistanceKm: number,
  velocityKmS: number,
  epochCloseApproachMs: number,
  currentMs: number
): {
  distanceKm: number;
  distanceLunar: number;
  rangeRateKmS: number; // dr/dt (+ is receding, - is approaching)
  isApproaching: boolean;
  timeToPerigeeSeconds: number;
  dopplerShiftHz: number; // based on 8.56 GHz Deep Space radar
  radarRoundTripSeconds: number; // 2 * d / c
} {
  const SPEED_OF_LIGHT_KM_S = 299792.458;
  const LUNAR_DISTANCE_KM = 384400;
  const RADAR_CARRIER_FREQ_HZ = 8.56e9; // 8.56 GHz X-band Goldstone/Canberra radar

  const deltaSeconds = (currentMs - epochCloseApproachMs) / 1000;
  const linearOffsetKm = velocityKmS * deltaSeconds;
  
  // Hypotenuse: distance = sqrt(perigee_dist^2 + (v * delta_t)^2)
  const distanceKm = Math.sqrt(Math.pow(missDistanceKm, 2) + Math.pow(linearOffsetKm, 2));
  const distanceLunar = distanceKm / LUNAR_DISTANCE_KM;

  // Range rate dr/dt = (velocity^2 * delta_t) / distance
  const rangeRateKmS = distanceKm > 0 ? (Math.pow(velocityKmS, 2) * deltaSeconds) / distanceKm : 0;
  const isApproaching = deltaSeconds < 0;

  // Doppler shift Delta f = - (2 * (dr/dt) / c) * f_0
  const dopplerShiftHz = -(2 * (rangeRateKmS / SPEED_OF_LIGHT_KM_S)) * RADAR_CARRIER_FREQ_HZ;

  // Radar round trip echo delay in seconds
  const radarRoundTripSeconds = (2 * distanceKm) / SPEED_OF_LIGHT_KM_S;

  return {
    distanceKm: Math.round(distanceKm),
    distanceLunar: Number(distanceLunar.toFixed(3)),
    rangeRateKmS: Number(rangeRateKmS.toFixed(2)),
    isApproaching,
    timeToPerigeeSeconds: Math.round(-deltaSeconds),
    dopplerShiftHz: Math.round(dopplerShiftHz),
    radarRoundTripSeconds: Number(radarRoundTripSeconds.toFixed(2))
  };
}

/**
 * Calculates real-time physical effects at a specific observer distance from ground zero.
 */
export function calculateObserverImpactEffects(
  megatons: number,
  observerDistanceKm: number
): {
  shockwaveArrivalSeconds: number;
  seismicArrivalSeconds: number;
  peakOverpressurePsi: number;
  overpressureDamage: string;
  thermalRadiationCalCm2: number;
  thermalDamage: string;
  soundDecibels: number;
} {
  const SPEED_OF_SOUND_KM_S = 0.343; // ~343 m/s in troposphere
  const SPEED_OF_SEISMIC_P_KM_S = 5.5; // P-wave speed in continental crust

  const shockwaveArrivalSeconds = Math.max(0, observerDistanceKm / SPEED_OF_SOUND_KM_S);
  const seismicArrivalSeconds = Math.max(0, observerDistanceKm / SPEED_OF_SEISMIC_P_KM_S);

  // Scaled distance calculation for overpressure (Brode / Glasstone explosion equations)
  // Scaled distance r_sc = d / (Y^(1/3))
  const scaledDistance = Math.max(0.1, observerDistanceKm / Math.pow(Math.max(0.001, megatons), 1 / 3));
  
  // Peak overpressure in psi approximation
  const peakOverpressurePsi = megatons > 0 ? Math.min(500, 14.5 * Math.pow(scaledDistance, -1.35)) : 0;

  let overpressureDamage = 'Negligible acoustic rumble';
  if (peakOverpressurePsi > 20) {
    overpressureDamage = 'Total structural annihilation: reinforced concrete pulverized';
  } else if (peakOverpressurePsi > 5) {
    overpressureDamage = 'Catastrophic collapse: multi-story residential buildings destroyed';
  } else if (peakOverpressurePsi > 2) {
    overpressureDamage = 'Moderate blast damage: unreinforced masonry roofs and walls collapse';
  } else if (peakOverpressurePsi > 0.5) {
    overpressureDamage = 'Widespread window glass shattering and structural cracking';
  }

  // Thermal radiation flux in cal/cm^2: ~ 2.5 * 10^3 * (Y / d^2) * transmittance
  const atmosphericTransmittance = Math.exp(-observerDistanceKm / 60);
  const thermalRadiationCalCm2 = megatons > 0 
    ? Math.max(0, (2500 * megatons * atmosphericTransmittance) / Math.pow(Math.max(1, observerDistanceKm), 2))
    : 0;

  let thermalDamage = 'No thermal skin injury';
  if (thermalRadiationCalCm2 > 20) {
    thermalDamage = 'Third-degree full thickness burns, flash combustion of dry wood & clothing';
  } else if (thermalRadiationCalCm2 > 8) {
    thermalDamage = 'Second-degree blistering burns to exposed epidermis';
  } else if (thermalRadiationCalCm2 > 3) {
    thermalDamage = 'First-degree painful sunburn-like epidermal erythema';
  }

  // Sound intensity at distance
  const soundDecibels = megatons > 0 
    ? Math.min(220, Math.max(40, 120 + 20 * Math.log10(Math.max(0.1, megatons)) - 20 * Math.log10(Math.max(1, observerDistanceKm))))
    : 0;

  return {
    shockwaveArrivalSeconds: Number(shockwaveArrivalSeconds.toFixed(1)),
    seismicArrivalSeconds: Number(seismicArrivalSeconds.toFixed(1)),
    peakOverpressurePsi: Number(peakOverpressurePsi.toFixed(2)),
    overpressureDamage,
    thermalRadiationCalCm2: Number(thermalRadiationCalCm2.toFixed(1)),
    thermalDamage,
    soundDecibels: Math.round(soundDecibels)
  };
}
