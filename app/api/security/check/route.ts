import { NextResponse } from 'next/server';

interface OSVQuery {
    package: {
        name: string;
        ecosystem: string;
    };
    version: string;
}

interface OSVVulnerability {
    id: string;
    summary: string;
    details: string;
    severity: Array<{ type: string; score: string }>;
    references: Array<{ type: string; url: string }>;
}

interface OSVResponse {
    vulns?: OSVVulnerability[];
}

export async function POST(request: Request) {
    try {
        const { packages } = await request.json();

        if (!packages || !Array.isArray(packages)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Limit to prevent abuse
        const limitedPackages = packages.slice(0, 100);

        const results: Record<string, {
            safe: boolean;
            vulnerabilities: Array<{ id: string; summary: string; severity: string }>
        }> = {};

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

                    results[`${pkg.name}@${pkg.version}`] = {
                        safe: !data.vulns || data.vulns.length === 0,
                        vulnerabilities: (data.vulns || []).map(v => ({
                            id: v.id,
                            summary: v.summary || 'No description',
                            severity: v.severity?.[0]?.score || 'unknown'
                        }))
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
