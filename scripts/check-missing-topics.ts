
import fs from 'fs';
import path from 'path';

function checkMissing() {
    // 1. Load DB Topics
    const dbTopicsPath = path.join(process.cwd(), 'all-topics-flat.txt');
    const candidatesPath = path.join(process.cwd(), 'missing-candidates.txt');

    if (!fs.existsSync(dbTopicsPath) || !fs.existsSync(candidatesPath)) {
        console.error('Missing input files');
        return;
    }

    // Helper: clean string to just basic alphanumeric lower to avoid encoding/whitespace issues
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Load DB topics, keeping original for display, but creating a "clean map" for checking
    const dbLines = fs.readFileSync(dbTopicsPath, 'utf-8').split(/\r?\n/).filter(x => x.trim());
    const dbCleanSet = new Set(dbLines.map(clean));

    // Also create a set of "Acronym only" from DB if they follow "Name (ACRONYM)" pattern
    const dbAcronyms = new Set();
    dbLines.forEach(l => {
        // Matches (ACRONYM), (A/B), (A-B), (A&B)
        const match = l.match(/\(([\w\/\-&]+)\)$/);
        if (match) {
            dbAcronyms.add(match[1].toLowerCase());
        }
        // Also define "Name / Name" split
        const slashes = l.split(' / ');
        slashes.forEach(s => dbCleanSet.add(clean(s)));
    });

    const candidateLines = fs.readFileSync(candidatesPath, 'utf-8').split(/\r?\n/).filter(x => x.trim());

    const missing = [];
    const found = [];

    candidateLines.forEach(rawCand => {
        const candidate = rawCand.trim();
        const candClean = clean(candidate);

        // 1. Direct match of full string
        if (dbCleanSet.has(candClean)) {
            found.push(candidate);
            return;
        }

        // 2. Check if candidate is "ACRONYM Name" and DB has "Name (ACRONYM)"
        // Candidate usually starts with acronym.
        const firstSpace = candidate.indexOf(' ');
        if (firstSpace > -1) {
            const acronym = candidate.substring(0, firstSpace).toLowerCase();
            const definition = candidate.substring(firstSpace + 1);

            // Check if acronym is known in DB (from parens)
            if (dbAcronyms.has(acronym)) {
                // We found the acronym in DB, e.g. "Secure Shell (SSH)" matches candidate "SSH ..."
                found.push(candidate);
                return;
            }

            // Check if definition matches a DB topic name exactly (ignoring acronym)
            const defClean = clean(definition);
            if (dbCleanSet.has(defClean)) {
                found.push(candidate);
                return;
            }

            // Reverse check: Candidate "Name (ACRONYM)"
            // Not the case in user list, user list is "ACRONYM Name"
        }

        // 3. Check if DB entry *contains* the full candidate definition?
        // e.g. Candidate "Advanced Encryption Standard"
        // DB "Advanced Encryption Standard (AES)"
        // If we strip DB to just letters, does it contain candidate letters?
        const isSubstring = dbLines.some(dbL => {
            const dbC = clean(dbL);
            return dbC.includes(candClean) || candClean.includes(dbC);
        });

        if (isSubstring) {
            found.push(candidate);
            return;
        }

        missing.push(candidate);
    });

    console.log(`Checked ${candidateLines.length}. Found ${found.length}. Missing ${missing.length}.`);
    console.log('\n--- MISSING TOPICS ---');
    missing.forEach(m => console.log(m));
}

checkMissing();
