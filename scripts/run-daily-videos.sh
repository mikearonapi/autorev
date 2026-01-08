#!/bin/bash
# AutoRev Daily Video Generator Runner
# This script loads environment and runs the generator

cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Log start
echo "$(date): Starting daily video generation" >> /tmp/autorev-video-gen.log

# Run generator
/opt/homebrew/bin/node scripts/generate-daily-videos.mjs >> /tmp/autorev-video-gen.log 2>&1

# Log complete
echo "$(date): Generation complete" >> /tmp/autorev-video-gen.log






