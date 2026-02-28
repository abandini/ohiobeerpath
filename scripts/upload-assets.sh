#!/bin/bash

# Upload static assets to R2 bucket

BUCKET_NAME="ohio-beer-path-images"

echo "Uploading CSS files..."
for css in assets/css/*.css; do
  if [ -f "$css" ]; then
    wrangler r2 object put $BUCKET_NAME/$css --file=$css --content-type=text/css --remote
  fi
done

echo "Uploading JavaScript files..."
for js in assets/js/*.js; do
  if [ -f "$js" ]; then
    wrangler r2 object put $BUCKET_NAME/$js --file=$js --content-type=application/javascript --remote
  fi
done
if [ -f "service-worker.js" ]; then
  wrangler r2 object put $BUCKET_NAME/service-worker.js --file=service-worker.js --content-type=application/javascript --remote
fi

echo "Uploading manifest and config files..."
wrangler r2 object put $BUCKET_NAME/site.webmanifest --file=site.webmanifest --content-type=application/manifest+json --remote
wrangler r2 object put $BUCKET_NAME/robots.txt --file=robots.txt --content-type=text/plain --remote

echo "Uploading offline page..."
if [ -f "offline.html" ]; then
  wrangler r2 object put $BUCKET_NAME/offline.html --file=offline.html --content-type=text/html --remote
fi

echo "Uploading images..."
for img in assets/images/*; do
  if [ -f "$img" ]; then
    filename=$(basename "$img")
    wrangler r2 object put $BUCKET_NAME/assets/images/$filename --file=$img --remote
  fi
done

echo "✅ All assets uploaded to R2"
