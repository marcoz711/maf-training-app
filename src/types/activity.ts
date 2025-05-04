/**
 * Represents a single heart rate data point
 */
export interface HeartRateDataPoint {
  timestamp: string; // ISO 8601 timestamp
  heartRate: number; // bpm
}

/**
 * Represents the heart rate zone percentages for an activity
 */
export interface HeartRateZonePercentages {
  mafZonePercent: number;
  aboveMafPercent: number;
  belowMafPercent: number;
}

/**
 * Represents an activity from FitnessSyncer or other fitness tracking services
 */
export interface Activity {
  id: string;
  date: string; // ISO 8601 date
  type: string; // e.g., "Running", "Cycling"
  duration: string; // HH:MM:SS format
  distance: number; // kilometers
  averageHeartRate: number; // bpm
  maxHeartRate: number; // bpm
  mafZonePercent: number; // percentage
  aboveMafPercent: number; // percentage
  belowMafPercent: number; // percentage
  averagePace: string; // MM:SS format
  source: string; // e.g., "FitnessSyncer", "Strava", "Garmin"
  externalId: string; // ID from the source service
  notes?: string; // optional user notes
  heartRateData?: HeartRateDataPoint[]; // optional raw heart rate data
}

/**
 * Represents the source of the activity data
 */
export type ActivitySource = 'FitnessSyncer' | 'Strava' | 'Garmin' | 'Other';

/**
 * Represents the type of activity
 */
export type ActivityType = 'Running' | 'Cycling' | 'Swimming' | 'Walking' | 'Other'; 