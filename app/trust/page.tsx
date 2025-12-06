import { promises as fs } from 'fs';
import path from 'path';
import SbomViewer from './components/SbomViewer';

async function getSbomData() {
    const filePath = path.join(process.cwd(), 'public', 'sbom.json');
    try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        return data;
    } catch (error) {
        console.error('Failed to load SBOM:', error);
        return null;
    }
}

async function getVulnerabilityData() {
    const filePath = path.join(process.cwd(), 'public', 'vulnerabilities.json');
    try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        return data;
    } catch {
        // Vulnerabilities file may not exist yet
        return null;
    }
}

export default async function TrustPage() {
    const sbomData = await getSbomData();
    const vulnData = await getVulnerabilityData();

    if (!sbomData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-zinc-500">Governance data currently unavailable.</p>
            </div>
        );
    }

    const { metadata, components } = sbomData;

    return (
        <div className="min-h-screen bg-black text-zinc-100">
            <div className="bg-zinc-950 border-b border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
                        Trust & Compliance
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-2xl">
                        Transparency is core to our security philosophy. This page lists all third-party software components currently used in the <strong>{metadata?.component?.name || 'Axium'}</strong> application, generated automatically from our build pipeline.
                    </p>
                </div>
            </div>

            <div className="py-8">
                <SbomViewer
                    components={components || []}
                    lastUpdated={metadata?.timestamp || new Date().toISOString()}
                    totalComponents={components?.length || 0}
                    vulnerabilities={vulnData}
                />
            </div>
        </div>
    );
}
