import { NextResponse } from 'next/server';

interface OSVQuery {
    package: {
        name: string;
        ecosystem: string;
    };
    version: string;
}

interface OSVSeverity {
    type: string;
    score: string;
}

interface OSVVulnerability {
    id: string;
    summary: string;
    details: string;
    severity: OSVSeverity[];
    references: Array<{ type: string; url: string }>;
    database_specific?: {
        severity?: string;
        cvss?: {
            score?: number;
            vector?: string;
        };
    };
}

interface OSVResponse {
    vulns?: OSVVulnerability[];
}

interface VulnResult {
    safe: boolean;
    vulnerabilities: Array<{
        cveId: string;
        summary: string;
        cvssScore: string;
        cvssVector: string;
        severity: string;
        url: string;
    }>;
}

function extractCVSSScore(vuln: OSVVulnerability): { score: string; vector: string } {
    // Try to get CVSS from severity array
    const cvss = vuln.severity?.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V2');
    if (cvss) {
        // CVSS is usually in format "CVSS:3.1/AV:N/AC:L/..." - extract score
        const match = cvss.score?.match(/(\d+\.?\d*)/);
        return {
            score: match ? match[1] : 'N/A',
            vector: cvss.score || ''
        };
    }

    // Try database_specific
    if (vuln.database_specific?.cvss?.score) {
        return {
            score: vuln.database_specific.cvss.score.toString(),
            vector: vuln.database_specific.cvss.vector || ''
        };
    }

    return { score: 'N/A', vector: '' };
}

function getSeverityFromScore(score: string): string {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'unknown';
    if (numScore >= 9.0) return 'critical';
    if (numScore >= 7.0) return 'high';
    if (numScore >= 4.0) return 'moderate';
    if (numScore >= 0.1) return 'low';
    return 'info';
}

export async function POST(request: Request) {
    try {
        // Rate limiting
        const { rateLimiters, getIdentifier, rateLimitResponse, isRateLimitEnabled } = await import('@/lib/ratelimit');

        if (isRateLimitEnabled()) {
            const identifier = getIdentifier(request);
            const { success, reset } = await rateLimiters.securityCheck.limit(identifier);

            if (!success) {
                return rateLimitResponse(reset);
            }
        }

        const { packages } = await request.json();

        if (!packages || !Array.isArray(packages)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Limit to prevent abuse
        const limitedPackages = packages.slice(0, 100);

        const results: Record<string, VulnResult> = {};

        // Query OSV API for each package
        for (const pkg of limitedPackages) {
            const query: OSVQuery = {
                package: {
                    name: pkg.name,
                    ecosystem: 'npm'
                },
                version: pkg.version
            };

            try {
                const response = await fetch('https://api.osv.dev/v1/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(query)
                });

                if (response.ok) {
                    const data: OSVResponse = await response.json();

                    const vulnList = (data.vulns || []).map(v => {
                        const { score, vector } = extractCVSSScore(v);
                        const cveRef = v.references?.find(r => r.url?.includes('cve.org') || r.url?.includes('nvd.nist.gov'));

                        return {
                            cveId: v.id,
                            summary: v.summary || 'No description available',
                            cvssScore: score,
                            cvssVector: vector,
                            severity: getSeverityFromScore(score) || v.database_specific?.severity || 'unknown',
                            url: cveRef?.url || v.references?.[0]?.url || `https://osv.dev/vulnerability/${v.id}`
                        };
                    });

                    results[`${pkg.name}@${pkg.version}`] = {
                        safe: vulnList.length === 0,
                        vulnerabilities: vulnList
                    };
                } else {
                    results[`${pkg.name}@${pkg.version}`] = { safe: true, vulnerabilities: [] };
                }
            } catch {
                // If individual package check fails, assume safe
                results[`${pkg.name}@${pkg.version}`] = { safe: true, vulnerabilities: [] };
            }
        }

        return NextResponse.json({
            checkedAt: new Date().toISOString(),
            results
        });
    } catch (error) {
        console.error('Security check error:', error);
        return NextResponse.json({ error: 'Failed to check security' }, { status: 500 });
    }
}
