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

        if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('dist')) {
            results = results.concat(scanDirectory(filePath));
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
            const content = fs.readFileSync(filePath, 'utf8');
            ANTI_PATTERNS.forEach(pattern => {
                // Reiniciar el índice de búsqueda de la expresión regular global
                pattern.regex.lastIndex = 0;
                if (pattern.regex.test(content)) {
                    results.push(`[${pattern.severity}] ${pattern.name} found in: ${file}`);
                }
            });
        }
    }
    return results;
}

console.log('[INFO] Scanning project source files for anti-patterns...');

// CORRECCIÓN: Al estar dentro de app/dist, retrocedemos dos niveles para apuntar a la raíz del proyecto
const projectRoot = path.join(__dirname, '..', '..');

// Buscamos si existe la carpeta de componentes/vistas (usualmente "app", "src", o la misma raíz)
const appDir = fs.existsSync(path.join(projectRoot, 'app'))
    ? path.join(projectRoot, 'app')
    : projectRoot;

const findings = scanDirectory(appDir);

if (findings.length === 0) {
    console.log('\x1b[32m%s\x1b[0m', '[SUCCESS] No structural anti-patterns detected!');
} else {
    console.log('\x1b[33m%s\x1b[0m', `[WARN] Found ${findings.length} design anti-patterns:`);
    findings.slice(0, 5).forEach(f => console.log(`  -> ${f}`)); // Muestra los primeros 5
    if (findings.length > 5) console.log(`  ... and ${findings.length - 5} more.`);
}
