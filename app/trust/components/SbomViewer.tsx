'use client';

import { useState } from 'react';
import { Search, Package, ShieldCheck, ExternalLink, Info, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface Component {
    name: string;
    version: string;
    description?: string;
    licenses?: { license: { id?: string; name?: string } }[];
    purl?: string;
    externalReferences?: { url: string; type: string }[];
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

interface LiveVulnData {
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

interface SbomViewerProps {
    components: Component[];
    lastUpdated: string;
    totalComponents: number;
    vulnerabilities: VulnerabilityData | null;
}

export default function SbomViewer({ components, lastUpdated, totalComponents, vulnerabilities }: SbomViewerProps) {
    const [search, setSearch] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [liveVulns, setLiveVulns] = useState<Record<string, LiveVulnData>>({});
    const [lastLiveCheck, setLastLiveCheck] = useState<string | null>(null);
    const [selectedVuln, setSelectedVuln] = useState<{ name: string; data: LiveVulnData } | null>(null);

    const filteredComponents = components.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    );

    const vulnCount = vulnerabilities?.summary?.total || 0;
    const criticalCount = (vulnerabilities?.summary?.critical || 0) + (vulnerabilities?.summary?.high || 0);

    const getVulnStatus = (pkgName: string) => {
        // Check live data first
        const liveData = liveVulns[pkgName];
        if (liveData !== undefined) {
            return {
                status: liveData.safe ? 'safe' : 'vulnerable',
                liveData
            };
        }
        // Fall back to build-time data
        if (vulnerabilities?.packages?.[pkgName]) {
            return {
                status: 'vulnerable',
                liveData: null
            };
        }
        return {
            status: 'safe',
            liveData: null
        };
    };

    const getCVSSColor = (score: string) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'text-zinc-400';
        if (numScore >= 9.0) return 'text-red-400';
        if (numScore >= 7.0) return 'text-orange-400';
        if (numScore >= 4.0) return 'text-yellow-400';
        return 'text-green-400';
    };

    const handleCheckForUpdates = async () => {
        setIsChecking(true);
        try {
            // Check first 50 packages
            const packagesToCheck = components.slice(0, 50).map(c => ({
                name: c.name,
                version: c.version
            }));

            const response = await fetch('/api/security/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packages: packagesToCheck })
            });

            if (response.ok) {
                const data = await response.json();
                const newVulns: Record<string, LiveVulnData> = {};

                for (const [key, value] of Object.entries(data.results)) {
                    const pkgName = key.split('@')[0];
                    newVulns[pkgName] = value as LiveVulnData;
                }

                setLiveVulns(newVulns);
                setLastLiveCheck(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Total Dependencies</p>
                        <p className="text-2xl font-bold text-zinc-100">{totalComponents}</p>
                    </div>
                </div>

                <div className={`bg-zinc-900 border p-6 rounded-xl flex items-center space-x-4 ${vulnCount > 0 ? 'border-red-800' : 'border-zinc-800'}`}>
                    <div className={`p-3 rounded-lg ${vulnCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        {vulnCount > 0 ? (
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        ) : (
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Security Status</p>
                        <p className={`text-2xl font-bold ${vulnCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {vulnCount > 0 ? `${vulnCount} Issues` : 'Secure'}
                        </p>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                        <Info className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Last Scan</p>
                        <p className="text-xl font-bold text-zinc-100">
                            {new Date(lastUpdated).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <button
                        onClick={handleCheckForUpdates}
                        disabled={isChecking}
                        className="w-full h-full flex flex-col items-center justify-center space-y-2 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-6 h-6 ${isChecking ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">
                            {isChecking ? 'Checking...' : 'Check for Updates'}
                        </span>
                        {lastLiveCheck && (
                            <span className="text-xs text-zinc-500">Last: {lastLiveCheck}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Critical Warning Banner */}
            {criticalCount > 0 && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-200">
                        <strong>{criticalCount} critical/high severity</strong> vulnerabilities found. Consider updating affected packages.
                    </p>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search dependencies..."
                    className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-lg leading-5 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Dependencies Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-200 font-medium">
                            <tr>
                                <th className="px-6 py-4">Component</th>
                                <th className="px-6 py-4">Version</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">CVE / CVSS</th>
                                <th className="px-6 py-4">License</th>
                                <th className="px-6 py-4">Links</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredComponents.length > 0 ? (
                                filteredComponents.map((component, idx) => {
                                    const { status, liveData } = getVulnStatus(component.name);
                                    const vulnInfo = vulnerabilities?.packages?.[component.name];
                                    const hasLiveDetails = liveData && liveData.vulnerabilities.length > 0;

                                    return (
                                        <tr key={`${component.name}-${idx}`} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-200">{component.name}</div>
                                                {component.description && (
                                                    <div className="text-xs text-zinc-500 mt-1 truncate max-w-xs">
                                                        {component.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{component.version}</td>
                                            <td className="px-6 py-4">
                                                {status === 'safe' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Safe
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => hasLiveDetails ? setSelectedVuln({ name: component.name, data: liveData! }) : null}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700 ${hasLiveDetails ? 'cursor-pointer hover:bg-red-800/50' : 'cursor-help'}`}
                                                        title={vulnInfo?.title || 'Vulnerability detected'}
                                                    >
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        {vulnInfo?.severity || 'Vulnerable'}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasLiveDetails ? (
                                                    <div className="space-y-1">
                                                        {liveData.vulnerabilities.slice(0, 2).map((v, i) => (
                                                            <div key={i} className="flex items-center space-x-2">
                                                                <a
                                                                    href={v.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-400 hover:text-blue-300 text-xs font-mono"
                                                                >
                                                                    {v.cveId}
                                                                </a>
                                                                <span className={`text-xs font-bold ${getCVSSColor(v.cvssScore)}`}>
                                                                    {v.cvssScore !== 'N/A' ? `${v.cvssScore}` : ''}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {liveData.vulnerabilities.length > 2 && (
                                                            <span className="text-xs text-zinc-500">+{liveData.vulnerabilities.length - 2} more</span>
                                                        )}
                                                    </div>
                                                ) : status === 'vulnerable' && vulnInfo?.url ? (
                                                    <a
                                                        href={vulnInfo.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 text-xs"
                                                    >
                                                        View Advisory
                                                    </a>
                                                ) : (
                                                    <span className="text-zinc-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {component.licenses && component.licenses.length > 0 && component.licenses[0].license ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                        {component.licenses[0].license.id || component.licenses[0].license.name || 'Custom'}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600 italic">Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const websiteRef = component.externalReferences?.find(ref => ref.type === 'website');
                                                    const anyRef = component.externalReferences?.[0];
                                                    const ref = websiteRef || anyRef;

                                                    if (ref) {
                                                        return (
                                                            <a
                                                                href={ref.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
                                                            >
                                                                <span>View</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        No components found matching "{search}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vulnerability Details Modal */}
            {selectedVuln && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                            <h3 className="text-lg font-bold text-zinc-100">
                                Vulnerabilities in {selectedVuln.name}
                            </h3>
                            <button
                                onClick={() => setSelectedVuln(null)}
                                className="text-zinc-400 hover:text-zinc-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                            {selectedVuln.data.vulnerabilities.map((vuln, i) => (
                                <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <a
                                            href={vuln.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 font-mono font-bold"
                                        >
                                            {vuln.cveId}
                                        </a>
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-sm font-bold ${getCVSSColor(vuln.cvssScore)}`}>
                                                CVSS: {vuln.cvssScore}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${vuln.severity === 'critical' ? 'bg-red-900 text-red-200' :
                                                    vuln.severity === 'high' ? 'bg-orange-900 text-orange-200' :
                                                        vuln.severity === 'moderate' ? 'bg-yellow-900 text-yellow-200' :
                                                            'bg-green-900 text-green-200'
                                                }`}>
                                                {vuln.severity}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-300">{vuln.summary}</p>
                                    {vuln.cvssVector && (
                                        <p className="text-xs text-zinc-500 font-mono">{vuln.cvssVector}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
