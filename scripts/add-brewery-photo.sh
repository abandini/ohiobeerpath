#!/bin/bash
# Add a photo to a specific brewery
# Usage: ./scripts/add-brewery-photo.sh <brewery_id> <image_path>

if [ $# -lt 2 ]; then
    echo "Usage: ./scripts/add-brewery-photo.sh <brewery_id> <image_path>"
    echo "Example: ./scripts/add-brewery-photo.sh 2 ./photos/13-below-brewery.jpg"
    exit 1
fi

BREWERY_ID=$1
IMAGE_PATH=$2
FILENAME=$(basename "$IMAGE_PATH")
R2_KEY="breweries/${BREWERY_ID}/${FILENAME}"
R2_URL="https://ohio-beer-path.bill-burkey.workers.dev/assets/images/${R2_KEY}"

echo "Uploading photo for brewery ID: $BREWERY_ID"
echo "Source: $IMAGE_PATH"
echo "R2 Key: $R2_KEY"

# Upload to R2
wrangler r2 object put ohio-beer-path-images/assets/images/${R2_KEY} \
    --file="$IMAGE_PATH" \
    --content-type=image/jpeg \
    --remote

if [ $? -eq 0 ]; then
    echo ""
    echo "Upload successful!"
    echo "Image URL: $R2_URL"
    echo ""
    echo "Now update the database:"
    echo "wrangler d1 execute ohio-beer-path-db --remote --command=\"UPDATE breweries SET image_url = '$R2_URL' WHERE id = $BREWERY_ID;\""
else
    echo "Upload failed!"
    exit 1
fi
