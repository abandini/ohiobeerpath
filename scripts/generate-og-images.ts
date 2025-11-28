import { createCanvas, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// OG Image dimensions (standard)
const WIDTH = 1200;
const HEIGHT = 630;

// Brand colors
const COLORS = {
  primary: '#d97706',      // Amber
  primaryLight: '#fbbf24',  // Light amber
  primaryDark: '#b45309',   // Dark amber
  dark: '#1f2937',
  white: '#ffffff',
};

function generateMainOGImage(): Buffer {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, COLORS.primaryDark);
  gradient.addColorStop(0.5, COLORS.primary);
  gradient.addColorStop(1, '#15803d'); // Green accent
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Add subtle texture overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let i = 0; i < HEIGHT; i += 4) {
    ctx.fillRect(0, i, WIDTH, 2);
  }

  // Beer mug icon (simplified)
  ctx.save();
  ctx.translate(100, HEIGHT / 2 - 80);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  // Mug body
  ctx.roundRect(0, 0, 120, 160, 10);
  ctx.fill();
  // Handle
  ctx.beginPath();
  ctx.arc(140, 80, 40, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineWidth = 20;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();
  // Foam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(60, 10, 70, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Main title
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ohio Beer Path', WIDTH / 2, 220);

  // Subtitle
  ctx.font = '36px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText("Discover Ohio's Craft Beer Scene", WIDTH / 2, 290);

  // Stats boxes
  const statsY = 380;
  const boxWidth = 180;
  const boxHeight = 100;
  const gap = 40;
  const startX = WIDTH / 2 - boxWidth - gap / 2;

  // Box 1: Breweries
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.roundRect(startX, statsY, boxWidth, boxHeight, 12);
  ctx.fill();

  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText('351', startX + boxWidth / 2, statsY + 50);
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('BREWERIES', startX + boxWidth / 2, statsY + 80);

  // Box 2: Regions
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.roundRect(startX + boxWidth + gap, statsY, boxWidth, boxHeight, 12);
  ctx.fill();

  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText('6', startX + boxWidth + gap + boxWidth / 2, statsY + 50);
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('REGIONS', startX + boxWidth + gap + boxWidth / 2, statsY + 80);

  // Tagline
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Plan Your Ultimate Brewery Tour', WIDTH / 2, 550);

  // URL at bottom
  ctx.font = '20px Arial, sans-serif';
  ctx.fillStyle = COLORS.primaryLight;
  ctx.fillText('ohio-beer-path.bill-burkey.workers.dev', WIDTH / 2, 600);

  return canvas.toBuffer('image/png');
}

function generateBreweryOGImage(
  name: string,
  city: string,
  region: string,
  hue: number
): Buffer {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Dynamic gradient based on brewery's hue
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, `hsl(${hue}, 70%, 35%)`);
  gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 60%, 25%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Add texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = 0; i < HEIGHT; i += 4) {
    ctx.fillRect(0, i, WIDTH, 2);
  }

  // Beer icon (large, faded)
  ctx.save();
  ctx.translate(WIDTH - 250, HEIGHT / 2 - 100);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(0, 0, 150, 200, 15);
  ctx.fill();
  ctx.restore();

  // Region badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(80, 80, region.length * 14 + 40, 40, 20);
  ctx.fill();

  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'left';
  ctx.fillText(region.toUpperCase(), 100, 107);

  // Brewery name
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'left';

  // Handle long names
  const maxWidth = WIDTH - 200;
  let fontSize = 64;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(name).width > maxWidth && fontSize > 36) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  }
  ctx.fillText(name, 80, 220);

  // Location
  ctx.font = '32px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`${city}, Ohio`, 80, 280);

  // Divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 320);
  ctx.lineTo(400, 320);
  ctx.stroke();

  // "View on Ohio Beer Path"
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('View on Ohio Beer Path', 80, 380);

  // Site branding at bottom
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = COLORS.primaryLight;
  ctx.textAlign = 'left';
  ctx.fillText('Ohio Beer Path', 80, HEIGHT - 60);

  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText("Discover Ohio's Craft Beer Scene", 80, HEIGHT - 30);

  return canvas.toBuffer('image/png');
}

// Hash function for consistent brewery colors
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

async function main() {
  const outputDir = path.join(__dirname, '../generated-og-images');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate main OG image
  console.log('Generating main OG image...');
  const mainImage = generateMainOGImage();
  fs.writeFileSync(path.join(outputDir, 'og-image.png'), mainImage);
  console.log('  ✓ og-image.png');

  // Generate sample brewery OG images
  const sampleBreweries = [
    { name: '13 Below Brewery', city: 'Cincinnati', region: 'Southwest' },
    { name: 'Great Lakes Brewing Co.', city: 'Cleveland', region: 'Northeast' },
    { name: 'Columbus Brewing Company', city: 'Columbus', region: 'Central' },
    { name: 'Rhinegeist Brewery', city: 'Cincinnati', region: 'Southwest' },
    { name: 'Platform Beer Co.', city: 'Cleveland', region: 'Northeast' },
  ];

  console.log('\nGenerating sample brewery OG images...');
  for (const brewery of sampleBreweries) {
    const hue = Math.abs(hashCode(brewery.name)) % 360;
    const image = generateBreweryOGImage(
      brewery.name,
      brewery.city,
      brewery.region,
      hue
    );
    const filename = brewery.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-og.png';
    fs.writeFileSync(path.join(outputDir, filename), image);
    console.log(`  ✓ ${filename}`);
  }

  console.log(`\nOG images saved to: ${outputDir}`);
  console.log('\nTo upload to R2:');
  console.log(`  wrangler r2 object put ohio-beer-path-images/assets/images/og-image.png --file=${outputDir}/og-image.png --content-type=image/png --remote`);
}

main().catch(console.error);
