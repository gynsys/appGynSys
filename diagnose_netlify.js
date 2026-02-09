#!/usr/bin/env node

/**
 * Diagnostic script to check Netlify deployment status
 */

const https = require('https');

console.log('🔍 Diagnostic: Checking Netlify deployment status...\n');

// 1. Check if site is accessible
https.get('https://gynsys.net/', (res) => {
    console.log(`✅ Site Status: ${res.statusCode}`);
    console.log(`📅 Last-Modified: ${res.headers['last-modified']}`);
    console.log(`🏷️  ETag: ${res.headers['etag']}`);
    console.log(`🔄 Cache-Control: ${res.headers['cache-control']}`);
    console.log(`📦 Server: ${res.headers['server']}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        // Extract JS bundle hash from HTML
        const bundleMatch = data.match(/index-([a-zA-Z0-9]+)\.js/);
        if (bundleMatch) {
            console.log(`\n📦 Current Bundle Hash: ${bundleMatch[1]}`);
            console.log(`   Full: index-${bundleMatch[1]}.js`);

            if (bundleMatch[1] === 'BFuf0DTm') {
                console.log('   ❌ PROBLEMA: Este es el bundle ANTIGUO (con error PushToggle)');
                console.log('   🚨 Netlify NO se ha actualizado con los últimos commits');
            } else {
                console.log('   ✅ Bundle actualizado detectado');
            }
        }

        // Check if PushToggle is referenced
        if (data.includes('PushToggle')) {
            console.log('\n⚠️  "PushToggle" encontrado en HTML source');
        }

        console.log('\n🎯 Próximos pasos:');
        console.log('   1. Verificar logs de Netlify manualmente en https://app.netlify.com');
        console.log('   2. Si no hay builds recientes, verificar webhook de GitHub');
        console.log('   3. Considerar trigger manual en Netlify');
    });

}).on('error', (err) => {
    console.error(`❌ Error: ${err.message}`);
});
