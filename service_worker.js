// Tab Analytics Service Worker
// Handles all tab tracking, analytics, and data persistence

// In-memory state for fast access
let tabMetadata = {}; // { tabId: { createdAt, url, title, hasAudio, memoryEstimate } }
let dailyAnalytics = {
    date: new Date().toDateString(),
    tabsOpened: 0,
    tabsClosed: 0,
    peakTabs: 0,
    memoryFreed: 0
};

// Initialization flag to prevent race conditions
let isInitialized = false;
let initializationPromise = null;

// Load metadata immediately to prevent race conditions
// This runs synchronously before event listeners
(async function loadStoredData() {
    const stored = await chrome.storage.local.get(['dailyAnalytics', 'tabMetadata']);

    console.log('=== Tab Analytics: Pre-loading stored data ===', {
        hasMetadata: !!stored.tabMetadata,
        count: stored.tabMetadata ? Object.keys(stored.tabMetadata).length : 0
    });

    if (stored.tabMetadata) {
        tabMetadata = stored.tabMetadata;
    }

    if (stored.dailyAnalytics) {
        dailyAnalytics = stored.dailyAnalytics;
    }
})();

// Initialize extension on install/startup
chrome.runtime.onInstalled.addListener(() => {
    console.log('Tab Analytics extension installed');
    initializationPromise = initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Tab Analytics extension started');
    initializationPromise = initializeExtension();
});

// Initialize extension state
async function initializeExtension() {
    console.log('=== Tab Analytics: Initializing Extension ===');

    // Data is already pre-loaded at the top, just verify and update as needed
    console.log('Tab Analytics: Current metadata count:', Object.keys(tabMetadata).length);

    // Check if we need to reset for a new day
    const today = new Date().toDateString();
    if (dailyAnalytics.date !== today) {
        resetDailyAnalytics();
    }

    // Query all existing tabs and update/track them
    const tabs = await chrome.tabs.query({});
    console.log('Tab Analytics: Found', tabs.length, 'open tabs with IDs:', tabs.map(t => t.id));

    tabs.forEach(tab => {
        if (!tabMetadata[tab.id]) {
            // New tab we haven't seen before
            console.log(`Tab Analytics: Tracking NEW tab ${tab.id} (${tab.title})`);
            trackNewTab(tab, true);
        } else {
            // Existing tab - update current state but PRESERVE creation time
            const oldCreatedAt = tabMetadata[tab.id].createdAt;
            const oldLastActivated = tabMetadata[tab.id].lastActivated;

            console.log(`Tab Analytics: Updating EXISTING tab ${tab.id} (${tab.title})`, {
                createdAt: new Date(oldCreatedAt).toLocaleString(),
                ageInMinutes: Math.floor((Date.now() - oldCreatedAt) / 60000)
            });

            tabMetadata[tab.id].url = tab.url || tabMetadata[tab.id].url;
            tabMetadata[tab.id].title = tab.title || tabMetadata[tab.id].title;
            tabMetadata[tab.id].hasAudio = tab.audible || false;
            tabMetadata[tab.id].memoryEstimate = estimateTabMemory(tab);
            // PRESERVE timestamps - DO NOT OVERWRITE
            tabMetadata[tab.id].createdAt = oldCreatedAt;
            tabMetadata[tab.id].lastActivated = oldLastActivated;
        }
    });

    // Remove metadata for tabs that no longer exist
    const currentTabIds = new Set(tabs.map(t => t.id));
    Object.keys(tabMetadata).forEach(tabId => {
        if (!currentTabIds.has(parseInt(tabId))) {
            console.log(`Tab Analytics: Removing metadata for closed tab ${tabId}`);
            delete tabMetadata[tabId];
        }
    });

    console.log('Tab Analytics: Final metadata count:', Object.keys(tabMetadata).length);

    // Persist any updates
    persistData();

    // Update peak tabs count
    updatePeakTabs(tabs.length);

    // Schedule midnight reset check
    scheduleMidnightReset();

    // Mark as initialized
    isInitialized = true;
    console.log('=== Tab Analytics: Initialization Complete ===');
}

// Reset analytics at midnight
function resetDailyAnalytics() {
    dailyAnalytics = {
        date: new Date().toDateString(),
        tabsOpened: 0,
        tabsClosed: 0,
        peakTabs: Object.keys(tabMetadata).length,
        memoryFreed: 0
    };
    persistAnalytics();
}

// Schedule next midnight reset
function scheduleMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => {
        resetDailyAnalytics();
        scheduleMidnightReset(); // Schedule next reset
    }, timeUntilMidnight);
}

// Track a newly created tab
function trackNewTab(tab, isInitializing = false) {
    // Estimate memory usage (base + factors)
    // Base: ~50MB, plus factors for media-rich sites
    const memoryEstimate = estimateTabMemory(tab);

    // For new tabs, use current timestamp
    // During initialization, this should only be called if tab wasn't in storage
    const now = Date.now();

    console.log(`Tab Analytics: trackNewTab called for tab ${tab.id}`, {
        title: tab.title,
        isInitializing: isInitializing,
        timestamp: new Date(now).toLocaleString()
    });

    tabMetadata[tab.id] = {
        createdAt: now,
        lastActivated: now,
        url: tab.url || '',
        title: tab.title || '',
        hasAudio: tab.audible || false,
        memoryEstimate: memoryEstimate
    };

    // Only count as "opened today" if it's actually a new tab, not during initialization
    if (!isInitializing) {
        dailyAnalytics.tabsOpened++;
    }
    persistData();
}

// Estimate tab memory usage (in MB)
function estimateTabMemory(tab) {
    let estimate = 50; // Base memory per tab

    // Add extra for media-heavy sites
    if (tab.url) {
        if (tab.url.includes('youtube.com')) estimate += 100;
        else if (tab.url.includes('netflix.com')) estimate += 150;
        else if (tab.url.includes('gmail.com')) estimate += 50;
        else if (tab.url.includes('docs.google.com')) estimate += 70;
        else if (tab.url.includes('github.com')) estimate += 40;
    }

    // Add extra for tabs with audio
    if (tab.audible) estimate += 30;

    return estimate;
}

// Update peak tabs count
function updatePeakTabs(currentCount) {
    if (currentCount > dailyAnalytics.peakTabs) {
        dailyAnalytics.peakTabs = currentCount;
        persistAnalytics();
    }
}

// Persist both metadata and analytics to storage
function persistData() {
    console.log('Tab Analytics: Persisting data - tabs:', Object.keys(tabMetadata).length);
    chrome.storage.local.set({ tabMetadata, dailyAnalytics }, () => {
        console.log('Tab Analytics: Data persisted successfully');
    });
}

// Persist only analytics (lighter operation)
function persistAnalytics() {
    chrome.storage.local.set({ dailyAnalytics });
}

// Event: Tab created
chrome.tabs.onCreated.addListener((tab) => {
    trackNewTab(tab);

    // Update peak count
    chrome.tabs.query({}, (tabs) => {
        updatePeakTabs(tabs.length);
    });
});

// Event: Tab removed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabMetadata[tabId]) {
        // Track memory freed
        dailyAnalytics.memoryFreed += tabMetadata[tabId].memoryEstimate;
        dailyAnalytics.tabsClosed++;

        // Remove from metadata
        delete tabMetadata[tabId];

        persistData();
    }
});

// Event: Tab updated (for audio state changes, URL changes, etc.)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Wait for initialization to complete to avoid race conditions
    if (initializationPromise) {
        await initializationPromise;
    }

    if (!tabMetadata[tabId]) {
        // Tab wasn't tracked yet (edge case)
        console.log(`Tab Analytics: onUpdated fired for untracked tab ${tabId}, tracking now`);
        trackNewTab(tab);
        return;
    }

    let shouldPersist = false;

    // Update audio state
    if (changeInfo.audible !== undefined) {
        tabMetadata[tabId].hasAudio = changeInfo.audible;
        shouldPersist = true;
    }

    // Update URL and title
    if (changeInfo.url) {
        tabMetadata[tabId].url = changeInfo.url;
        tabMetadata[tabId].memoryEstimate = estimateTabMemory(tab);
        shouldPersist = true;
    }

    if (changeInfo.title) {
        tabMetadata[tabId].title = changeInfo.title;
        shouldPersist = true;
    }

    if (shouldPersist) {
        persistData();
    }
});

// Event: Tab activated (track last viewed time)
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (tabMetadata[activeInfo.tabId]) {
        tabMetadata[activeInfo.tabId].lastActivated = Date.now();
        chrome.storage.local.set({ tabMetadata });
    }
});

// Message handler for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAnalytics') {
        // Return current analytics and tab metadata
        sendResponse({
            dailyAnalytics: dailyAnalytics,
            tabMetadata: tabMetadata,
            currentTabCount: Object.keys(tabMetadata).length
        });
    } else if (request.action === 'getTabInfo') {
        // Return info for a specific tab
        if (request.tabId && tabMetadata[request.tabId]) {
            const metadata = tabMetadata[request.tabId];
            const now = Date.now();
            const openedAgo = formatTimeAgo(now - metadata.createdAt);

            sendResponse({
                success: true,
                info: {
                    ...metadata,
                    openedAgo: openedAgo
                }
            });
        } else {
            sendResponse({ success: false });
        }
    } else if (request.action === 'getEnrichedTabs') {
        // Get all tabs with enriched metadata and rankings
        chrome.tabs.query({}, async (tabs) => {
            const enrichedTabs = [];
            const now = Date.now();

            // Build tab data array
            for (const tab of tabs) {
                const metadata = tabMetadata[tab.id];

                // If tab has no metadata, track it now
                if (!metadata) {
                    trackNewTab(tab, true);
                    continue; // Skip this iteration, it will appear in next refresh
                }

                enrichedTabs.push({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    favIconUrl: tab.favIconUrl,
                    active: tab.active,
                    createdAt: metadata.createdAt,
                    lastActivated: metadata.lastActivated,
                    memoryEstimate: metadata.memoryEstimate,
                    hasAudio: metadata.hasAudio
                });
            }

            // Sort by memory usage to find top 3
            const sortedByMemory = [...enrichedTabs].sort((a, b) => b.memoryEstimate - a.memoryEstimate);
            const top3Memory = new Set(sortedByMemory.slice(0, 3).map(t => t.id));

            // Find top 3 oldest unopened tabs (least recently activated)
            const sortedByActivation = [...enrichedTabs].sort((a, b) => a.lastActivated - b.lastActivated);
            const top3Oldest = new Set(sortedByActivation.slice(0, 3).map(t => t.id));

            // Add rankings to tabs
            enrichedTabs.forEach(tab => {
                // Memory rank
                tab.memoryRank = null;
                if (top3Memory.has(tab.id)) {
                    const index = sortedByMemory.findIndex(t => t.id === tab.id);
                    tab.memoryRank = index + 1; // 1, 2, 3
                }

                // Age rank (oldest)
                tab.ageRank = null;
                if (top3Oldest.has(tab.id)) {
                    const index = sortedByActivation.findIndex(t => t.id === tab.id);
                    tab.ageRank = index + 1; // 1, 2, 3
                }

                const timeSinceCreated = now - tab.createdAt;
                const timeSinceActivated = now - tab.lastActivated;

                tab.openedAgo = formatTimeAgo(timeSinceCreated);
                tab.lastViewedAgo = formatTimeAgo(timeSinceActivated);
            });

            sendResponse({
                tabs: enrichedTabs,
                dailyAnalytics: dailyAnalytics,
                currentTabCount: enrichedTabs.length
            });
        });
        return true; // Keep channel open for async response
    } else if (request.action === 'getHighestMemoryTab') {
        // Find tab with highest memory usage
        let highestMemory = 0;
        let highestTabId = null;

        for (const [tabId, metadata] of Object.entries(tabMetadata)) {
            if (metadata.memoryEstimate > highestMemory) {
                highestMemory = metadata.memoryEstimate;
                highestTabId = parseInt(tabId);
            }
        }

        sendResponse({
            tabId: highestTabId,
            memory: highestMemory
        });
    }

    return true; // Keep message channel open for async response
});

// Helper: Format time ago
function formatTimeAgo(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ${days > 1 ? 'days' : 'day'} ago`;
    if (hours > 0) return `${hours} ${hours > 1 ? 'hrs' : 'hr'} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return `${seconds} sec ago`;
}
