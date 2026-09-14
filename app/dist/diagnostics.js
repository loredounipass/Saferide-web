const fs = require('fs');
const path = require('path');

// Antipatrones comunes en React / Next.js a buscar
const ANTI_PATTERNS = [
    { name: 'Index as Key in lists', regex: /\.map\(.*,.*index.*\)/g, severity: 'WARNING' },
    { name: 'Inline Styles (Prefer Tailwind)', regex: /style=\{\{\s*[a-zA-Z]/g, severity: 'SUGGESTION' },
    { name: 'Dangerous inner HTML usages', regex: /dangerouslySetInnerHTML/g, severity: 'CRITICAL' },
    { name: 'Legacy React Lifecycle Methods', regex: /componentWillMount|componentWillReceiveProps/g, severity: 'CRITICAL' }
];

function scanDirectory(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
            results = results.concat(scanDirectory(filePath));
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
            const content = fs.readFileSync(filePath, 'utf8');
            ANTI_PATTERNS.forEach(pattern => {
                if (pattern.regex.test(content)) {
                    results.push(`[${pattern.severity}] ${pattern.name} found in: ${filePath}`);
                }
            });
        }
    }
    return results;
}

console.log('[INFO] Scanning project source files for anti-patterns...');
const appDir = path.join(__dirname, 'app'); // Escanea tu carpeta "app"
const findings = scanDirectory(appDir);

if (findings.length === 0) {
    console.log('\x1b[32m%s\x1b[0m', '[SUCCESS] No structural anti-patterns detected!');
} else {
    console.log('\x1b[33m%s\x1b[0m', `[WARN] Found ${findings.length} design anti-patterns:`);
    findings.slice(0, 5).forEach(f => console.log(`  -> ${f}`)); // Muestra los primeros 5
    if (findings.length > 5) console.log(`  ... and ${findings.length - 5} more.`);
}
