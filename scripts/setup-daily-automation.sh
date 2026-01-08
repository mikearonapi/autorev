#!/bin/bash
# AutoRev Daily Video Automation Setup
# Sets up launchd job to run video generation every morning at 5 AM EST

PLIST_NAME="com.autorev.daily-video-generator"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
PROJECT_ROOT="/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
SCRIPT_PATH="${PROJECT_ROOT}/scripts/run-daily-videos.sh"

case "$1" in
  install)
    echo "📦 Installing AutoRev Daily Video Generator..."
    
    # Make script executable
    chmod +x "$SCRIPT_PATH"
    
    # Create launchd plist - runs daily at 5 AM
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_PATH}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>5</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/autorev-video-gen-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/autorev-video-gen-stderr.log</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
EOF

    # Load the job
    launchctl unload "$PLIST_PATH" 2>/dev/null
    launchctl load "$PLIST_PATH"
    
    echo "✅ Installed! Video generation will run daily at 5:00 AM"
    echo ""
    echo "📋 Useful commands:"
    echo "   Check status:  launchctl list | grep autorev"
    echo "   View logs:     tail -f /tmp/autorev-video-gen.log"
    echo "   Run now:       bash \"$SCRIPT_PATH\""
    echo "   Uninstall:     $0 uninstall"
    ;;
    
  uninstall)
    echo "🗑️  Uninstalling AutoRev Daily Video Generator..."
    launchctl unload "$PLIST_PATH" 2>/dev/null
    rm -f "$PLIST_PATH"
    echo "✅ Uninstalled"
    ;;
    
  status)
    echo "📊 AutoRev Daily Video Generator Status"
    echo ""
    if launchctl list | grep -q "$PLIST_NAME"; then
      echo "✅ Job is loaded"
      launchctl list "$PLIST_NAME"
    else
      echo "❌ Job is not loaded"
    fi
    echo ""
    echo "📁 Output directory: $PROJECT_ROOT/generated-videos/"
    echo ""
    if [ -f /tmp/autorev-video-gen.log ]; then
      echo "📜 Recent log entries:"
      tail -10 /tmp/autorev-video-gen.log
    fi
    ;;
    
  run)
    echo "🚀 Running video generation now..."
    bash "$SCRIPT_PATH"
    ;;
    
  *)
    echo "AutoRev Daily Video Automation"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install    Install the daily job (runs at 5 AM)"
    echo "  uninstall  Remove the daily job"
    echo "  status     Check job status and recent logs"
    echo "  run        Run generation immediately"
    ;;
esac






