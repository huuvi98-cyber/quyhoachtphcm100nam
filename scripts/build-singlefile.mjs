import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const STAGE_DIR = path.resolve(ROOT, '.singlefile-stage');
const DIST_DIR = path.resolve(ROOT, 'dist');

const EMBEDDED_ASSET_SPECS = [
  {
    key: '/assets/aistudio/Quy_ho_ch_t_ng_th__TPHCM_th_i_k__2025-2050__t_m_nh_n_100_n_m__2__91fa1a70.mp4',
    file: 'public/assets/aistudio/Quy_ho_ch_t_ng_th__TPHCM_th_i_k__2025-2050__t_m_nh_n_100_n_m__2__91fa1a70.mp4',
    mime: 'video/mp4',
    webpQuality: null,
  },
  {
    key: '/assets/ban_do_5_cuc_clean.png',
    file: 'public/assets/ban_do_5_cuc_clean.png',
    mime: 'image/webp',
    webpQuality: 92,
  },
  {
    key: '/assets/sky_clean_dinhhinh.png',
    file: 'public/assets/sky_clean_dinhhinh.png',
    mime: 'image/png',
    webpQuality: null,
  },
  {
    key: '/assets/headline_band_clean.png',
    file: 'public/assets/headline_band_clean.png',
    mime: 'image/png',
    webpQuality: null,
  },
];

function encodeAsset(spec) {
  const absPath = path.resolve(ROOT, spec.file);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing required asset for single-file bundle: ${spec.file}`);
  }

  let buffer;
  let mime = spec.mime;

  if (spec.webpQuality !== null) {
    try {
      const tmpWebp = path.resolve(STAGE_DIR, 'ban_do_5_cuc_clean.webp');
      execFileSync('ffmpeg', [
        '-v',
        'error',
        '-y',
        '-i',
        absPath,
        '-c:v',
        'libwebp',
        '-quality',
        String(spec.webpQuality),
        tmpWebp,
      ]);
      buffer = fs.readFileSync(tmpWebp);
    } catch {
      buffer = fs.readFileSync(absPath);
      mime = 'image/png';
    }
  } else {
    buffer = fs.readFileSync(absPath);
  }

  return {
    mime,
    b64: buffer.toString('base64'),
  };
}

function escapeInlineScript(code) {
  return code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

function escapeInlineStyle(css) {
  return css.replace(/<\/(style)/gi, '<\\/$1');
}

async function run() {
  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  fs.mkdirSync(STAGE_DIR, { recursive: true });

  try {
    // 1. Compile React + Tailwind + MapLibre GL JS into a single classic IIFE JS + CSS bundle
    await build({
      root: ROOT,
      configFile: false,
      base: './',
      publicDir: false,
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': ROOT,
        },
      },
      build: {
        outDir: STAGE_DIR,
        emptyOutDir: true,
        cssCodeSplit: false,
        assetsInlineLimit: 100_000_000,
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          input: path.resolve(ROOT, 'index.src.html'),
          output: {
            format: 'iife',
            name: 'HcmcMasterplanApp',
            inlineDynamicImports: true,
            entryFileNames: 'bundle.js',
            chunkFileNames: 'bundle.js',
            assetFileNames: 'bundle.[ext]',
          },
        },
      },
    });

    const jsPath = path.resolve(STAGE_DIR, 'bundle.js');
    if (!fs.existsSync(jsPath)) {
      throw new Error('Expected compiled bundle.js in staging output.');
    }
    const jsCode = fs.readFileSync(jsPath, 'utf8');

    const cssFiles = fs
      .readdirSync(STAGE_DIR)
      .filter((f) => f.endsWith('.css'))
      .sort();
    const cssCode = cssFiles
      .map((f) => fs.readFileSync(path.resolve(STAGE_DIR, f), 'utf8'))
      .join('\n');

    // 2. Encode the 4 active runtime assets into self-contained base64 payloads
    const embeddedRegistry = {};
    for (const spec of EMBEDDED_ASSET_SPECS) {
      embeddedRegistry[spec.key] = encodeAsset(spec);
    }

    // 3. Assemble ONE complete, 100% self-contained index.html from index.src.html
    const templateHtml = fs.readFileSync(path.resolve(ROOT, 'index.src.html'), 'utf8');
    const styleBlock = `<style>\n${escapeInlineStyle(cssCode)}\n</style>\n  </head>`;
    const assetsScript = `<script>window.__EMBEDDED_ASSETS__=${JSON.stringify(
      embeddedRegistry
    )};</script>`;
    const appScript = `<script>\n${escapeInlineScript(jsCode)}\n</script>`;

    let finalHtml = templateHtml.replace('</head>', () => styleBlock);
    finalHtml = finalHtml.replace(
      /<script\s+type="module"\s+src="\/src\/main\.tsx"><\/script>/,
      () => `${assetsScript}\n    ${appScript}`
    );

    // 4. Write the complete single-file index.html to BOTH dist/index.html and root /index.html
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(path.resolve(DIST_DIR, 'index.html'), finalHtml, 'utf8');
    fs.writeFileSync(path.resolve(ROOT, 'index.html'), finalHtml, 'utf8');

    const sizeMb = (Buffer.byteLength(finalHtml, 'utf8') / (1024 * 1024)).toFixed(2);
    console.log(`Single-file index.html built successfully (${sizeMb} MB) -> /index.html & /dist/index.html`);
  } finally {
    fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
