// Convert WebP texture to JPEG in GLB, remove EXT_texture_webp
(async () => {
  const core = await import('@gltf-transform/core');
  const ext = await import('@gltf-transform/extensions');
  const { readFileSync, writeFileSync, unlinkSync } = await import('fs');
  const sharp = (await import('sharp')).default;

  const io = new core.NodeIO()
    .registerExtensions([ext.EXTTextureWebP]);

  const doc = await io.read('public/models/model-final.glb');

  for (const tex of doc.getRoot().listTextures()) {
    const img = tex.getImage();
    const mime = tex.getMimeType();
    console.log('Texture:', tex.getName(), 'mime:', mime, 'size:', img?.byteLength);

    if (img && mime === 'image/webp') {
      const jpg = await sharp(Buffer.from(img)).jpeg({ quality: 82 }).toBuffer();
      tex.setImage(new Uint8Array(jpg));
      tex.setMimeType('image/jpeg');
      console.log('  -> JPEG', (jpg.byteLength / 1024).toFixed(1), 'KB');
    }
  }

  // Remove EXT_texture_webp extensions
  const root = doc.getRoot();
  for (const e of [...root.listExtensionsUsed()]) {
    if (e.extensionName === 'EXT_texture_webp') { e.dispose(); console.log('Removed EXT_texture_webp (used)'); }
  }
  for (const e of [...root.listExtensionsRequired()]) {
    if (e.extensionName === 'EXT_texture_webp') { e.dispose(); console.log('Removed EXT_texture_webp (required)'); }
  }

  const glb = await io.writeBinary(doc);
  writeFileSync('public/models/model-final.glb', Buffer.from(glb));
  console.log('Done!', (glb.byteLength / 1024 / 1024).toFixed(2), 'MB');

  try { unlinkSync('public/models/model-temp.glb'); } catch {}
  try { unlinkSync('public/models/model-temp2.glb'); } catch {}
  try { unlinkSync('public/models/model-final-jpeg.glb'); } catch {}
})();
