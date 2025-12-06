'use client';

import { useState } from 'react';
import { Search, Package, ShieldCheck, ExternalLink, Info } from 'lucide-react';

interface Component {
    name: string;
    version: string;
    description?: string;
    licenses?: { license: { id?: string; name?: string } }[];
    purl?: string;
    externalReferences?: { url: string; type: string }[];
}

interface SbomViewerProps {
    components: Component[];
    lastUpdated: string;
    totalComponents: number;
}

export default function SbomViewer({ components, lastUpdated, totalComponents }: SbomViewerProps) {
    const [search, setSearch] = useState('');

    const filteredComponents = components.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Total Dependencies</p>
                        <p className="text-2xl font-bold text-zinc-100">{totalComponents}</p>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Security Status</p>
                        <p className="text-2xl font-bold text-zinc-100">Monitored</p>
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
            </div>

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
                                <th className="px-6 py-4">License</th>
                                <th className="px-6 py-4">External Links</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredComponents.length > 0 ? (
                                filteredComponents.map((component, idx) => (
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
                                            {component.licenses && component.licenses.length > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                    {component.licenses[0].license.id || 'Custom'}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600 italic">Unknown</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {component.externalReferences && component.externalReferences.length > 0 && (
                                                <a
                                                    href={component.externalReferences[0].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
                                                >
                                                    <span>View</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No components found matching "{search}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
