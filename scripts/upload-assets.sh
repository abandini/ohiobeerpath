#!/bin/bash

# Upload static assets to R2 bucket

BUCKET_NAME="ohio-beer-path-images"

echo "Uploading CSS files..."
wrangler r2 object put $BUCKET_NAME/assets/css/styles.css --file=assets/css/styles.css --content-type=text/css
wrangler r2 object put $BUCKET_NAME/assets/css/mobile.css --file=assets/css/mobile.css --content-type=text/css

echo "Uploading JavaScript files..."
wrangler r2 object put $BUCKET_NAME/service-worker.js --file=service-worker.js --content-type=application/javascript

echo "Uploading manifest and config files..."
wrangler r2 object put $BUCKET_NAME/site.webmanifest --file=site.webmanifest --content-type=application/manifest+json
wrangler r2 object put $BUCKET_NAME/robots.txt --file=robots.txt --content-type=text/plain

echo "Uploading images..."
for img in assets/images/*; do
  if [ -f "$img" ]; then
    filename=$(basename "$img")
    wrangler r2 object put $BUCKET_NAME/assets/images/$filename --file=$img
  fi
done

echo "✅ All assets uploaded to R2"
