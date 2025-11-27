/**
 * Calibration Utility Functions
 *
 * Calibration measures how well a user's confidence matches their actual performance.
 * Raw calibration scores range from -1.5 (severe overconfidence) to +1.5 (severe underconfidence).
 * A score of 0 means perfectly calibrated.
 */

/**
 * Normalize calibration score from [-1.5, +1.5] to [0, 1]
 *
 * @param calibration - Raw calibration score (-1.5 to +1.5)
 * @returns Normalized score (0 to 1)
 *
 * Mapping:
 *   -1.5 → 0.0  (severe overconfidence)
 *   -1.0 → 0.17
 *   -0.5 → 0.33
 *    0.0 → 0.5  (perfectly calibrated)
 *   +0.5 → 0.67
 *   +1.0 → 0.83
 *   +1.5 → 1.0  (severe underconfidence)
 */
export function normalizeCalibration(calibration: number | null): number {
  const value = calibration ?? 0
  // Clamp to valid range before normalizing
  const clamped = Math.max(-1.5, Math.min(1.5, value))
  // Round to 2 decimal places to avoid floating point precision issues
  // e.g., (0.90 + 1.5) / 3 = 0.7999999999999999 instead of 0.8
  return Math.round((clamped + 1.5) / 3 * 100) / 100
}

/**
 * Denormalize calibration score from [0, 1] back to [-1.5, +1.5]
 *
 * @param normalized - Normalized score (0 to 1)
 * @returns Raw calibration score (-1.5 to +1.5)
 */
export function denormalizeCalibration(normalized: number): number {
  const clamped = Math.max(0, Math.min(1, normalized))
  return (clamped * 3) - 1.5
}

/**
 * Calculate priority from calibration (lower calibration = higher priority)
 * Used for topic selection where poorly calibrated topics need more practice
 *
 * @param calibration - Raw calibration score (-1.5 to +1.5)
 * @returns Priority score (0 to 1), where 1 = highest priority
 *
 * Mapping:
 *   -1.5 → 1.0  (highest priority - severe overconfidence)
 *    0.0 → 0.5  (medium priority)
 *   +1.5 → 0.0  (lowest priority - well calibrated or underconfident)
 */
export function calibrationToPriority(calibration: number | null): number {
  const value = calibration ?? 0
  const clamped = Math.max(-1.5, Math.min(1.5, value))
  return (1.5 - clamped) / 3
}

/**
 * Get calibration status label and color
 *
 * @param calibration - Raw calibration score (-1.5 to +1.5)
 * @returns Object with label and Tailwind color class
 */
export function getCalibrationStatus(calibration: number | null): {
  label: string
  color: string
  description: string
} {
  const value = calibration ?? 0

  if (value >= 1.0) {
    return {
      label: 'Excellent',
      color: 'text-green-400',
      description: 'Confidence matches performance very well'
    }
  } else if (value >= 0.5) {
    return {
      label: 'Good',
      color: 'text-green-400',
      description: 'Confidence matches performance'
    }
  } else if (value >= 0.0) {
    return {
      label: 'Fair',
      color: 'text-yellow-400',
      description: 'Slightly overconfident'
    }
  } else if (value >= -0.5) {
    return {
      label: 'Developing',
      color: 'text-yellow-400',
      description: 'Moderately overconfident'
    }
  } else if (value >= -1.0) {
    return {
      label: 'Poor',
      color: 'text-orange-400',
      description: 'Significantly overconfident'
    }
  } else {
    return {
      label: 'Critical',
      color: 'text-red-400',
      description: 'Severely overconfident - needs calibration work'
    }
  }
}
