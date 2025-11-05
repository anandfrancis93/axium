/**
 * Beta Distribution Utilities for Thompson Sampling
 *
 * The Beta distribution is used in Thompson Sampling to model the uncertainty
 * about the reward probability of each arm (topic, bloom_level pair).
 */

/**
 * Generate a random sample from a Gamma distribution
 * Using Marsaglia and Tsang's method (2000)
 *
 * @param alpha - Shape parameter
 * @param beta - Rate parameter (default 1)
 * @returns Random sample from Gamma(alpha, beta)
 */
function sampleGamma(alpha: number, beta: number = 1): number {
  // Handle edge cases
  if (alpha < 1) {
    // Use Gamma(alpha + 1) and adjust
    return sampleGamma(alpha + 1, beta) * Math.pow(Math.random(), 1 / alpha)
  }

  // Marsaglia and Tsang's method
  const d = alpha - 1 / 3
  const c = 1 / Math.sqrt(9 * d)

  while (true) {
    let x: number
    let v: number

    // Generate x from N(0,1) using Box-Muller transform
    do {
      x = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
      v = 1 + c * x
    } while (v <= 0)

    v = v * v * v
    const u = Math.random()

    // Accept or reject
    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v / beta
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v / beta
    }
  }
}

/**
 * Sample from a Beta distribution using the fact that
 * if X ~ Gamma(alpha, 1) and Y ~ Gamma(beta, 1), then
 * X / (X + Y) ~ Beta(alpha, beta)
 *
 * @param alpha - First shape parameter (successes + 1)
 * @param beta - Second shape parameter (failures + 1)
 * @returns Random sample from Beta(alpha, beta) in range [0, 1]
 */
export function sampleBeta(alpha: number, beta: number): number {
  // Edge cases
  if (alpha <= 0 || beta <= 0) {
    throw new Error('Beta distribution parameters must be positive')
  }

  // For very small alpha or beta, use uniform distribution approximation
  if (alpha < 0.01 || beta < 0.01) {
    return Math.random()
  }

  // Sample from two independent Gamma distributions
  const x = sampleGamma(alpha)
  const y = sampleGamma(beta)

  // Return Beta sample
  return x / (x + y)
}

/**
 * Calculate the mean of a Beta distribution
 * Mean = alpha / (alpha + beta)
 *
 * @param alpha - First shape parameter
 * @param beta - Second shape parameter
 * @returns Mean of the Beta distribution
 */
export function betaMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta)
}

/**
 * Calculate the variance of a Beta distribution
 * Variance = (alpha * beta) / ((alpha + beta)^2 * (alpha + beta + 1))
 *
 * @param alpha - First shape parameter
 * @param beta - Second shape parameter
 * @returns Variance of the Beta distribution
 */
export function betaVariance(alpha: number, beta: number): number {
  const sum = alpha + beta
  return (alpha * beta) / (sum * sum * (sum + 1))
}

/**
 * Calculate the standard deviation of a Beta distribution
 *
 * @param alpha - First shape parameter
 * @param beta - Second shape parameter
 * @returns Standard deviation of the Beta distribution
 */
export function betaStdDev(alpha: number, beta: number): number {
  return Math.sqrt(betaVariance(alpha, beta))
}

/**
 * Calculate a confidence interval for a Beta distribution
 * Uses the mean ± z * std_dev approximation
 *
 * @param alpha - First shape parameter
 * @param beta - Second shape parameter
 * @param confidence - Confidence level (e.g., 0.95 for 95%)
 * @returns Tuple of [lower_bound, upper_bound]
 */
export function betaConfidenceInterval(
  alpha: number,
  beta: number,
  confidence: number = 0.95
): [number, number] {
  const mean = betaMean(alpha, beta)
  const stdDev = betaStdDev(alpha, beta)

  // Z-score for confidence level (approximation)
  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  }
  const z = zScores[confidence] || 1.96

  const margin = z * stdDev
  return [
    Math.max(0, mean - margin),
    Math.min(1, mean + margin)
  ]
}

/**
 * Sample multiple values from a Beta distribution
 * Useful for Monte Carlo simulations
 *
 * @param alpha - First shape parameter
 * @param beta - Second shape parameter
 * @param n - Number of samples
 * @returns Array of n samples from Beta(alpha, beta)
 */
export function sampleBetaMultiple(alpha: number, beta: number, n: number): number[] {
  return Array.from({ length: n }, () => sampleBeta(alpha, beta))
}
