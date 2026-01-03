# Tab Analytics - Chrome Extension

A Chrome Extension (Manifest V3) that provides real-time tab analytics and visual insights to help users manage large numbers of open tabs efficiently.

## Features

### 🎨 Dark/Light Theme Toggle
Modern theme switcher with persistent preference and sleek design.

### 📋 Visual Tab List
Interactive list of all open tabs with click-to-switch functionality.

### 🔴 High Memory Usage Indicators
Top 3 memory-consuming tabs highlighted with red gradient borders (darkest to lightest).

### 🔵 Oldest Tab Highlighting
Blue border on the tab that hasn't been viewed for the longest time.

### 🔊 Audio Activity Detection
Visual badges for tabs currently playing audio.

### ⏱️ Persistent Time Tracking
Track how long each tab has been open with "Opened X ago" tooltips. **Tab creation times persist across laptop sleep and browser restarts.**

### 📊 Daily Tab Usage Analytics
Comprehensive daily metrics including:
- **Tabs Opened**: Total number of new tabs created today
- **Tabs Closed**: Total number of tabs closed today
- **Peak Tabs**: Maximum concurrent tabs reached today
- **Memory Freed**: Estimated memory recovered from closed tabs

All analytics automatically reset at local midnight.

## Technical Implementation

### Architecture
- **Event-Driven**: Uses Chrome Extension APIs with no polling loops
- **Manifest V3**: Built with latest Chrome Extension standards
- **Local Storage**: All data processed and stored locally using `chrome.storage.local`
- **Background Service Worker**: Handles all tab tracking and analytics

### APIs Used
- `chrome.tabs.onCreated` - Track new tabs
- `chrome.tabs.onRemoved` - Track closed tabs and memory freed
- `chrome.tabs.onUpdated` - Monitor audio state and URL changes
- `chrome.tabs.onActivated` - Track tab activation
- `chrome.storage.local` - Persist analytics and metadata

### Memory Estimation
Memory usage is estimated based on:
- Base memory per tab (~50MB)
- Site-specific factors (YouTube, Netflix, Gmail, etc.)
- Audio state (additional overhead)

## Installation

### From Source
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `Tab Analytics` directory

### File Structure
```
Tab Analytics/
├── manifest.json          # Extension configuration
├── service_worker.js      # Background tab tracking logic
├── popup.html            # Popup UI structure
├── popup.js              # Popup UI logic
├── popup.css             # Popup styles
└── README.md             # This file
```

## Usage

1. **Install the extension** using the instructions above
2. **Click the extension icon** in your Chrome toolbar to view analytics
3. **View daily statistics** including tabs opened, closed, peak count, and memory freed
4. **Check visual indicators** to understand audio activity and memory usage

## Privacy

- **100% Local**: All data is processed and stored locally on your device
- **No External APIs**: No data leaves your browser
- **No Tracking**: No analytics or telemetry sent to external servers
- **Automatic Reset**: Data automatically resets at midnight

## Performance

- **Event-Driven**: No polling loops or timers
- **Lightweight**: Minimal CPU and memory overhead
- **Optimized Storage**: Efficient local storage syncing

## Requirements

- Chrome browser version 88 or higher (Manifest V3 support)
- No external dependencies
- No backend required

## Notes

### Icon Placeholder
The extension currently references icon files (`icon16.png`, `icon48.png`, `icon128.png`) in the manifest. You'll need to either:
1. Create these icon files, or
2. Remove the icon references from `manifest.json`

### Memory Estimates
Memory usage values are estimates based on site characteristics and may not reflect exact browser memory consumption.

## License

This project is provided as-is for educational and personal use.

## Version

**v1.0.0** - Initial release
