const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const WEB = path.join(__dirname, '..', 'web');
const ICON_SRC = path.join(__dirname, '..', 'assets', 'images', 'icon.png');

async function main() {
  // Copy PWA files: sw.js, manifest.json
  for (const file of ['sw.js', 'manifest.json']) {
    const src = path.join(WEB, file);
    const dest = path.join(DIST, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Copied ${file}`);
    } else {
      console.warn(`  ⚠ ${file} not found in web/`);
    }
  }

  // Generate PWA icons from source icon (1024x1024)
  const SIZES = [192, 512];
  if (fs.existsSync(ICON_SRC)) {
    try {
      const sharp = require('sharp');
      for (const size of SIZES) {
        const dest = path.join(DIST, `icon-${size}x${size}.png`);
        await sharp(ICON_SRC).resize(size, size).png().toFile(dest);
        console.log(`  ✓ Generated icon-${size}x${size}.png`);
      }
    } catch {
      const sizesDone = [];
      for (const size of SIZES) {
        const dest = path.join(DIST, `icon-${size}x${size}.png`);
        try {
          fs.copyFileSync(ICON_SRC, dest);
          sizesDone.push(size);
        } catch {}
      }
      if (sizesDone.length > 0) {
        console.log(`  ✓ Copied icon for sizes: ${sizesDone.join(', ')} (not resized — sharp not available)`);
      }
    }
  } else {
    console.warn('  ⚠ icon.png not found at', ICON_SRC);
  }

  // Inject PWA tags into all HTML files in dist
  const PWA_TAGS = [
    '<link rel="manifest" href="/manifest.json" />',
    '<meta name="theme-color" content="#F9F7F2" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="BM Booking" />',
    '<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){})}</script>',
  ].join('\n    ');

  const htmlFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
  let injected = 0;
  for (const file of htmlFiles) {
    const filePath = path.join(DIST, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('</head>') && !content.includes('manifest.json')) {
      content = content.replace('</head>', PWA_TAGS + '\n  </head>');
      fs.writeFileSync(filePath, content);
      injected++;
    }
  }

  console.log(`  ✓ Injected PWA tags into ${injected} HTML files`);
}

main().catch((err) => {
  console.error('Post-build script failed:', err);
  process.exit(1);
});
