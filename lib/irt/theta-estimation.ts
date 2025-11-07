/**
 * Theta (Ability) Estimation for Single User
 *
 * Estimates user ability (θ) from response patterns using Maximum Likelihood Estimation (MLE)
 */

import { getDefaultIRTParameters, type IRTParameters } from './default-parameters'

interface Response {
  is_correct: boolean
  bloom_level: number
  question_type?: string
}

interface ThetaEstimate {
  theta: number
  standardError: number
  responsesCount: number
  information: number
}

/**
 * Calculate IRT probability of correct response
 *
 * 3PL Model: P(correct | θ, a, b, c) = c + (1 - c) / (1 + e^(-a(θ - b)))
 */
export function calculateIRTProbability(
  theta: number,
  a: number,
  b: number,
  c: number
): number {
  const exponent = -a * (theta - b)
  const probability = c + ((1 - c) / (1 + Math.exp(exponent)))

  return probability
}

/**
 * Calculate first derivative of log-likelihood (for Newton-Raphson)
 */
function calculateFirstDerivative(
  theta: number,
  params: IRTParameters,
  isCorrect: boolean
): number {
  const { a, b, c } = params
  const prob = calculateIRTProbability(theta, a, b, c)

  // P'(θ) = a * (P - c) * (1 - P) / (1 - c)
  const probDerivative = (a * (prob - c) * (1 - prob)) / (1 - c)

  // d/dθ log P(response | θ)
  if (isCorrect) {
    return probDerivative / prob
  } else {
    return -probDerivative / (1 - prob)
  }
}

/**
 * Calculate second derivative of log-likelihood
 */
function calculateSecondDerivative(
  theta: number,
  params: IRTParameters,
  isCorrect: boolean
): number {
  const { a, b, c } = params
  const prob = calculateIRTProbability(theta, a, b, c)

  const probDerivative = (a * (prob - c) * (1 - prob)) / (1 - c)

  // Second derivative calculation
  const probSecondDerivative =
    (a * a * (prob - c) * (1 - prob) * (1 - 2 * prob + c)) / Math.pow(1 - c, 2)

  if (isCorrect) {
    return (probSecondDerivative * prob - probDerivative * probDerivative) / (prob * prob)
  } else {
    return (
      (-probSecondDerivative * (1 - prob) - probDerivative * probDerivative) /
      ((1 - prob) * (1 - prob))
    )
  }
}

/**
 * Calculate test information at a given theta
 *
 * Information quantifies precision of ability estimate at that level
 */
export function calculateTestInformation(
  theta: number,
  items: IRTParameters[]
): number {
  let information = 0

  for (const params of items) {
    const { a, b, c } = params
    const prob = calculateIRTProbability(theta, a, b, c)

    // I(θ) = a² * (P'(θ))² / (P(θ) * (1 - P(θ)))
    const probDerivative = (a * (prob - c) * (1 - prob)) / (1 - c)
    const itemInformation = Math.pow(probDerivative, 2) / (prob * (1 - prob))

    information += itemInformation
  }

  return information
}

/**
 * Estimate theta using Maximum Likelihood Estimation (MLE)
 *
 * Uses Newton-Raphson method to find θ that maximizes P(responses | θ)
 */
export function estimateTheta(responses: Response[]): ThetaEstimate {
  if (responses.length === 0) {
    return {
      theta: 0,
      standardError: 999,
      responsesCount: 0,
      information: 0
    }
  }

  let theta = 0 // Start at neutral ability
  const maxIterations = 20
  const convergenceThreshold = 0.001

  // Get IRT parameters for each response
  const itemParams: IRTParameters[] = responses.map(r =>
    getDefaultIRTParameters(r.bloom_level)
  )

  // Newton-Raphson iteration
  for (let iter = 0; iter < maxIterations; iter++) {
    let firstDerivSum = 0
    let secondDerivSum = 0

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      const params = itemParams[i]

      firstDerivSum += calculateFirstDerivative(theta, params, response.is_correct)
      secondDerivSum += calculateSecondDerivative(theta, params, response.is_correct)
    }

    // Update theta
    const thetaChange = -firstDerivSum / secondDerivSum
    theta = theta + thetaChange

    // Clamp theta to reasonable range (-4 to +4)
    theta = Math.max(-4, Math.min(4, theta))

    // Check convergence
    if (Math.abs(firstDerivSum) < convergenceThreshold) {
      break
    }
  }

  // Calculate standard error from information function
  const information = calculateTestInformation(theta, itemParams)
  const standardError = information > 0 ? 1 / Math.sqrt(information) : 999

  return {
    theta,
    standardError,
    responsesCount: responses.length,
    information
  }
}

/**
 * Estimate theta using Expected A Posteriori (EAP) - more stable with few responses
 *
 * Bayesian approach with normal prior N(0, 1)
 * Better for small sample sizes (< 20 responses)
 */
export function estimateThetaEAP(responses: Response[]): ThetaEstimate {
  if (responses.length === 0) {
    return {
      theta: 0,
      standardError: 999,
      responsesCount: 0,
      information: 0
    }
  }

  // Quadrature points for numerical integration
  const numPoints = 40
  const thetaMin = -4
  const thetaMax = 4
  const step = (thetaMax - thetaMin) / (numPoints - 1)

  const quadraturePoints: { theta: number; weight: number }[] = []
  for (let i = 0; i < numPoints; i++) {
    const theta = thetaMin + i * step
    const weight = step
    quadraturePoints.push({ theta, weight })
  }

  // Get item parameters
  const itemParams = responses.map(r => getDefaultIRTParameters(r.bloom_level))

  // Calculate posterior distribution
  let numerator = 0
  let denominator = 0
  const posteriors: number[] = []

  for (const point of quadraturePoints) {
    const { theta, weight } = point

    // Calculate likelihood P(responses | theta)
    let logLikelihood = 0
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      const params = itemParams[i]
      const prob = calculateIRTProbability(theta, params.a, params.b, params.c)

      logLikelihood += response.is_correct ? Math.log(prob) : Math.log(1 - prob)
    }
    const likelihood = Math.exp(logLikelihood)

    // Prior: N(0, 1)
    const prior = normalPDF(theta, 0, 1)

    // Posterior ∝ likelihood × prior
    const posterior = likelihood * prior * weight

    posteriors.push(posterior)
    numerator += theta * posterior
    denominator += posterior
  }

  // Expected value (mean of posterior)
  const thetaEstimate = numerator / denominator

  // Variance of posterior
  let variance = 0
  for (let i = 0; i < quadraturePoints.length; i++) {
    const theta = quadraturePoints[i].theta
    const posterior = posteriors[i] / denominator
    variance += posterior * Math.pow(theta - thetaEstimate, 2)
  }

  const standardError = Math.sqrt(variance)

  // Calculate information at estimated theta
  const information = calculateTestInformation(thetaEstimate, itemParams)

  return {
    theta: thetaEstimate,
    standardError,
    responsesCount: responses.length,
    information
  }
}

/**
 * Normal probability density function
 */
function normalPDF(x: number, mean: number, sd: number): number {
  const exponent = -Math.pow(x - mean, 2) / (2 * sd * sd)
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent)
}

/**
 * Choose appropriate estimation method based on sample size
 */
export function estimateThetaAuto(responses: Response[]): ThetaEstimate {
  if (responses.length < 20) {
    // Use EAP for small samples (more stable)
    return estimateThetaEAP(responses)
  } else {
    // Use MLE for larger samples (more efficient)
    return estimateTheta(responses)
  }
}
