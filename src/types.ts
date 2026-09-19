export type ThemeMode = 'deep-space' | 'frosted-atmosphere';

export type AsteroidComposition = 'stony' | 'iron' | 'carbonaceous' | 'cometary';

export interface AsteroidCompositionInfo {
  name: string;
  density: number; // kg/m3
  description: string;
}

export interface CloseApproachData {
  close_approach_date: string;
  close_approach_date_full: string;
  epoch_date_close_approach: number;
  relative_velocity: {
    kilometers_per_second: string;
    kilometers_per_hour: string;
    miles_per_hour: string;
  };
  miss_distance: {
    astronomical: string;
    lunar: string;
    kilometers: string;
    miles: string;
  };
  orbiting_body: string;
}

export interface EstimatedDiameter {
  kilometers: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
  meters: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
  feet: {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
  };
}

export interface KineticImpactResult {
  diameter_meters: number;
  volume_cubic_meters: number;
  density_kg_m3: number;
  mass_kg: number;
  velocity_km_s: number;
  velocity_m_s: number;
  energy_joules: number;
  megatons_tnt: number;
  crater_diameter_meters: number;
  crater_depth_meters: number;
  fireball_radius_km: number;
  blast_airburst_radius_km: number; // 5 psi overpressure
  seismic_magnitude: number;
  historical_comparison: string;
}

export interface NeoObject {
  id: string;
  neo_reference_id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: EstimatedDiameter;
  close_approach_data: CloseApproachData[];
  is_sentry_object: boolean;
  // Computed fields from Kinetic Impact Engine
  computed_kinetic?: KineticImpactResult;
  orbital_class?: string;
  is_live_feed?: boolean;
}

export type FilterCategory = 'all' | 'hazardous' | '24hours' | 'sub-lunar' | 'high-energy';

export type NavigationTab = 
  | 'telemetry-dashboard'
  | 'hazard-perigee-monitor'
  | 'orbital-trajectory-visualizer'
  | 'impact-assessment';
