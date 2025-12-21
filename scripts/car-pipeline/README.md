# Car Pipeline Scripts

Scripts for automating car addition and enrichment in the AutoRev database.

## Overview

These scripts support the 8-phase car addition pipeline documented in `docs/CAR_PIPELINE.md`. The system offers both **fully automated AI-driven** and **manual** workflows.

## 🤖 AI-Driven Scripts (Fully Automated)

### `ai-research-car.js` ⭐ **RECOMMENDED**
Fully automated car addition using AI. Just provide the car name!

```bash
# Add any car with just the name - AI does everything
node scripts/car-pipeline/ai-research-car.js "Porsche 911 GT3 (992)"
node scripts/car-pipeline/ai-research-car.js "BMW M3 Competition (G80)" --verbose
node scripts/car-pipeline/ai-research-car.js "McLaren 570S" --dry-run
```

**What AI does automatically:**
- 🔬 **Phase 1-2**: Research specifications, pricing, and core data
- ✅ **Phase 3**: EPA fuel economy, NHTSA safety ratings, recalls
- 🔍 **Phase 4**: Known issues, maintenance specs, service intervals  
- 📊 **Phase 5**: Expert scoring (1-10) and editorial content
- 🖼️ **Phase 6**: Hero image generation
- 📺 **Phase 7**: YouTube video processing (scheduled)
- ✅ **Phase 8**: Data validation and QA

**Time**: 3-5 minutes per car

### `ai-batch-add-cars.js`
Add multiple cars using AI automation.

```bash
# Create a file with car names (one per line)
echo "Porsche 911 GT3 (992)
BMW M3 Competition (G80)
McLaren 570S" > new-cars.txt

# Add all cars with AI
node scripts/car-pipeline/ai-batch-add-cars.js new-cars.txt
node scripts/car-pipeline/ai-batch-add-cars.js new-cars.txt --concurrency=2 --delay=5000
```

**Concurrency**: Processes multiple cars in parallel (default: 2)
**Time**: ~4 minutes per car

## 👤 Manual Scripts (Legacy)

### `enrich-car.js`
Manual enrichment for Phase 3 only (EPA, NHTSA, recalls).

```bash
node scripts/car-pipeline/enrich-car.js porsche-911-gt3 --verbose
```

### `batch-enrich.js`
Manual batch enrichment for Phase 3.

```bash
node scripts/car-pipeline/batch-enrich.js car-slugs.txt
```

### `validate-car.js`
Validation checks for data completeness.

```bash
node scripts/car-pipeline/validate-car.js porsche-911-gt3 --fix-hints
```

## Environment Variables

Required for AI scripts:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (for AI research)

Optional:
- `BLOB_READ_WRITE_TOKEN` (for image upload)

## 🚀 Recommended Workflow

### Single Car Addition
```bash
# Just tell AI the car name - it does everything!
node scripts/car-pipeline/ai-research-car.js "Lamborghini Huracán EVO"

# Done! Car is fully researched and added to database
```

### Multiple Car Addition
```bash
# Create list file
echo "Ferrari 296 GTB
Aston Martin Vantage (2024)
Maserati MC20" > cars-to-add.txt

# Let AI add them all
node scripts/car-pipeline/ai-batch-add-cars.js cars-to-add.txt

# Done! All cars fully researched and added
```

## ✨ AI Capabilities

The AI research system:

- ✅ **Researches real specs** from automotive databases
- ✅ **Finds known issues** from forums and recalls
- ✅ **Calculates maintenance costs** and service intervals  
- ✅ **Assigns expert scores** based on performance, reliability, value
- ✅ **Writes editorial content** (strengths, weaknesses, competitors)
- ✅ **Generates hero images** (placeholder system, expandable)
- ✅ **Updates pipeline tracking** in real-time
- ✅ **Full database integration** - no manual steps needed

## Pipeline Dashboard Integration

- 🌐 **Web interface**: `/internal/car-pipeline`
- 🤖 **"AI Add Car" button**: Triggers `ai-research-car.js`
- 📊 **Real-time progress**: Watch AI research in action
- ✅ **Pipeline tracking**: Visual progress through all 8 phases

## Error Handling

All scripts include:
- ✅ Comprehensive error handling and retries
- ✅ Progress logging and status updates
- ✅ Dry-run modes for testing
- ✅ Pipeline run integration
- ✅ Timeout protection (10min per car)

## Sample Files

- `templates/car-pipeline/sample-cars-list.txt` - Example car list format
- Use proper car names with generation info: "BMW M3 (G80)", not just "M3"

## Exit Codes

- `0` - Success, all operations completed
- `1` - Error occurred or validation issues found