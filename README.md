# Tab Analytics - Chrome Extension

A Chrome Extension (Manifest V3) that provides real-time tab analytics and visual insights to help users manage large numbers of open tabs efficiently.

## Features

### Time Tracking
- **First Opened**: Track when each tab was initially opened with persistent timestamps that survive browser restarts and sleep mode
- **Last Viewed**: Monitor when each tab was last accessed to identify inactive tabs

### Memory Usage Monitoring
- **High Memory Detection**: Automatically identifies the top 3 memory-consuming tabs
- **Visual Indicators**: Red gradient borders highlight high-memory tabs (darkest red = highest usage)
- **Memory Estimates**: Real-time estimation based on site characteristics and tab state

### Audio Activity Detection
- **Active Audio Monitoring**: Detects and displays which tabs are currently playing audio
- **Visual Badges**: Clear audio indicators on active tabs

### Visual Color Coding
- **Red Gradient Borders**: Top 3 memory-consuming tabs (darkest to lightest)
- **Blue Border**: Tabs not viewed for the longest time
- **Theme Support**: Dark and light mode with persistent preferences

### Daily Analytics Dashboard
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

### Quick Setup Guide

Follow these steps to install and run the Tab Analytics Chrome Extension:

#### Step 1: Download the Extension
```bash
# Clone the repository
git clone https://github.com/HarsH-1877/Browser-Tabs-Analytics---Chrome-Extension.git

# Or download as ZIP and extract
```

#### Step 2: Load Extension in Chrome
1. **Open Chrome Extensions Page**
   - Open Google Chrome browser
   - Navigate to `chrome://extensions/` in the address bar
   - Or click the three-dot menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner
   - Click to enable it (it should turn blue/active)

3. **Load the Extension**
   - Click the "Load unpacked" button that appears after enabling Developer mode
   - Navigate to the folder where you cloned/extracted the repository
   - Select the `Tab Analytics` folder (or `Browser-Tabs-Analytics---Chrome-Extension` if you cloned it)
   - Click "Select Folder"

4. **Verify Installation**
   - The extension should now appear in your extensions list
   - You should see the Tab Analytics icon in your Chrome toolbar
   - If the icon is not visible, click the puzzle piece icon in the toolbar and pin Tab Analytics

#### Step 3: Start Using the Extension
- Click the Tab Analytics icon in your Chrome toolbar
- The popup will display all your open tabs with real-time analytics
- Toggle between light and dark themes using the theme switcher

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

### Using the Extension

1. **Open the Popup**
   - Click the Tab Analytics icon in your Chrome toolbar
   - The popup displays all currently open tabs

2. **View Tab Analytics**
   - **Daily Stats**: See tabs opened, closed, peak count, and memory freed today
   - **Red Borders**: Top 3 memory-consuming tabs (darkest = highest usage)
   - **Blue Border**: Tab not viewed for the longest time
   - **Audio Badge**: 🔊 icon on tabs playing audio
   - **Time Information**: View how long each tab has been open and when last viewed

3. **Interact with Tabs**
   - **Click any tab card** to switch to that tab
   - **Click the X button** on a tab card to close that tab
   - **Toggle theme** using the switch in the top-right corner

### Troubleshooting

**Extension not appearing in toolbar:**
- Click the puzzle piece icon (Extensions) in Chrome toolbar
- Find "Tab Analytics" and click the pin icon to pin it

**Popup shows no tabs:**
- Refresh the page or close and reopen the popup
- Make sure you have at least one tab open

**Time tracking not persisting:**
- The extension stores data locally using Chrome's storage API
- Data should persist across browser restarts and sleep mode
- If data is lost, check Chrome's storage quota in `chrome://extensions/`

**Memory estimates seem incorrect:**
- Memory values are estimates based on site characteristics
- Actual memory usage may vary depending on your system and Chrome version

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
