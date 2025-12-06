import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface NpmAuditVulnerability {
    name: string;
    severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
    via: Array<{ name: string; severity: string; title: string; url: string }>;
    effects: string[];
    range: string;
    fixAvailable: boolean | { name: string; version: string };
}

interface NpmAuditResult {
    vulnerabilities: Record<string, NpmAuditVulnerability>;
    metadata: {
        vulnerabilities: {
            info: number;
            low: number;
            moderate: number;
            high: number;
            critical: number;
            total: number;
        };
    };
}

interface VulnerabilityData {
    generatedAt: string;
    summary: {
        total: number;
        critical: number;
        high: number;
        moderate: number;
        low: number;
        info: number;
    };
    packages: Record<string, {
        severity: string;
        title: string;
        url: string;
        fixAvailable: boolean;
    }>;
}

async function generateVulnerabilities() {
    console.log('🔍 Running npm audit...');

    let auditResult: NpmAuditResult;

    try {
        // npm audit returns non-zero exit code if vulnerabilities found
        const output = execSync('npm audit --json', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        auditResult = JSON.parse(output);
    } catch (error: unknown) {
        // npm audit exits with code 1 if vulnerabilities found, but still outputs valid JSON
        if (error && typeof error === 'object' && 'stdout' in error) {
            const execError = error as { stdout: string };
            auditResult = JSON.parse(execError.stdout);
        } else {
            console.error('Failed to run npm audit:', error);
            // Create empty result if audit completely fails
            auditResult = {
                vulnerabilities: {},
                metadata: {
                    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }
                }
            };
        }
    }

    const vulnData: VulnerabilityData = {
        generatedAt: new Date().toISOString(),
        summary: {
            total: auditResult.metadata?.vulnerabilities?.total || 0,
            critical: auditResult.metadata?.vulnerabilities?.critical || 0,
            high: auditResult.metadata?.vulnerabilities?.high || 0,
            moderate: auditResult.metadata?.vulnerabilities?.moderate || 0,
            low: auditResult.metadata?.vulnerabilities?.low || 0,
            info: auditResult.metadata?.vulnerabilities?.info || 0,
        },
        packages: {}
    };

    // Process each vulnerability
    for (const [pkgName, vuln] of Object.entries(auditResult.vulnerabilities || {})) {
        const viaInfo = vuln.via?.find(v => typeof v === 'object');

        vulnData.packages[pkgName] = {
            severity: vuln.severity,
            title: viaInfo?.title || 'Unknown vulnerability',
            url: viaInfo?.url || '',
            fixAvailable: typeof vuln.fixAvailable === 'boolean' ? vuln.fixAvailable : true
        };
    }

    const outputPath = join(process.cwd(), 'public', 'vulnerabilities.json');
    writeFileSync(outputPath, JSON.stringify(vulnData, null, 2));

    console.log(`✅ Vulnerabilities saved to ${outputPath}`);
    console.log(`📊 Summary: ${vulnData.summary.total} vulnerabilities found`);
    console.log(`   Critical: ${vulnData.summary.critical}, High: ${vulnData.summary.high}, Moderate: ${vulnData.summary.moderate}`);
}

generateVulnerabilities().catch(console.error);
