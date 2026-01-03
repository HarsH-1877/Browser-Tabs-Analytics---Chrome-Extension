// Popup UI Script
// Fetches and displays analytics data and enriched tab list from the service worker

document.addEventListener('DOMContentLoaded', async () => {
    await initializeTheme();
    await loadAnalytics();
    setupThemeToggle();
});

// Load and display analytics data with enriched tab information
async function loadAnalytics() {
    try {
        // Request enriched analytics from service worker
        const response = await chrome.runtime.sendMessage({ action: 'getEnrichedTabs' });

        if (response) {
            displayAnalytics(response.dailyAnalytics);
            displayTabList(response.tabs);
            document.getElementById('currentTabs').textContent = response.currentTabCount;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        displayError();
    }
}

// Display daily analytics in the UI
function displayAnalytics(dailyAnalytics) {
    document.getElementById('tabsOpened').textContent = dailyAnalytics.tabsOpened;
    document.getElementById('tabsClosed').textContent = dailyAnalytics.tabsClosed;
    document.getElementById('peakTabs').textContent = dailyAnalytics.peakTabs;
    document.getElementById('memoryFreed').textContent = `${dailyAnalytics.memoryFreed} MB`;
}

// Display tab list with color coding and rankings
function displayTabList(tabs) {
    const tabsList = document.getElementById('tabsList');
    tabsList.innerHTML = ''; // Clear existing content

    if (tabs.length === 0) {
        tabsList.innerHTML = '<div class="no-tabs">No tabs open</div>';
        return;
    }

    tabs.forEach(tab => {
        const tabItem = createTabItem(tab);
        tabsList.appendChild(tabItem);
    });
}

// Create a single tab item element with all indicators
function createTabItem(tab) {
    const item = document.createElement('div');
    item.className = 'tab-item';

    // Add active class
    if (tab.active) {
        item.classList.add('active');
    }

    // Add memory rank classes (top 3)
    if (tab.memoryRank === 1) {
        item.classList.add('memory-rank-1');
    } else if (tab.memoryRank === 2) {
        item.classList.add('memory-rank-2');
    } else if (tab.memoryRank === 3) {
        item.classList.add('memory-rank-3');
    }

    // Add age rank classes (top 3 oldest)
    if (tab.ageRank === 1) {
        item.classList.add('age-rank-1');
    } else if (tab.ageRank === 2) {
        item.classList.add('age-rank-2');
    } else if (tab.ageRank === 3) {
        item.classList.add('age-rank-3');
    }

    // Create colored indicator bar
    const indicator = document.createElement('div');
    indicator.className = 'tab-indicator';
    item.appendChild(indicator);

    // Create favicon container
    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'tab-favicon-container';

    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="14" font-size="14">📄</text></svg>';
    favicon.onerror = () => {
        favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="14" font-size="14">📄</text></svg>';
    };
    faviconContainer.appendChild(favicon);

    // Audio badge overlay on favicon
    if (tab.hasAudio) {
        const audioBadge = document.createElement('span');
        audioBadge.className = 'audio-badge-overlay';
        audioBadge.textContent = '🔊';
        faviconContainer.appendChild(audioBadge);
    }

    item.appendChild(faviconContainer);

    // Create content container
    const content = document.createElement('div');
    content.className = 'tab-content';

    // Tab title
    const title = document.createElement('div');
    title.className = 'tab-title';
    title.textContent = tab.title || 'Untitled';
    content.appendChild(title);

    // Tab URL
    const url = document.createElement('div');
    url.className = 'tab-url';
    url.textContent = truncateUrl(tab.url || '');
    content.appendChild(url);

    item.appendChild(content);

    // Create time info container (right side)
    const timeInfo = document.createElement('div');
    timeInfo.className = 'tab-time-info';

    const openedTime = document.createElement('div');
    openedTime.className = 'time-label';
    openedTime.innerHTML = `<img src="o1.png" class="time-icon-img" alt="Opened"> ${tab.openedAgo}`;
    timeInfo.appendChild(openedTime);

    const viewedTime = document.createElement('div');
    viewedTime.className = 'time-label';
    viewedTime.innerHTML = `<img src="e1.png" class="time-icon-img" alt="Viewed"> ${tab.lastViewedAgo}`;
    timeInfo.appendChild(viewedTime);

    item.appendChild(timeInfo);

    // Create info badges container (currently empty, can be used for future badges)
    const badges = document.createElement('div');
    badges.className = 'tab-badges';
    item.appendChild(badges);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close tab';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent tab switch when clicking close
        chrome.tabs.remove(tab.id);
        item.remove(); // Remove from UI immediately
    });
    item.appendChild(closeBtn);

    // Click to switch to tab
    item.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
        window.close(); // Close popup after switching
    });

    return item;
}

// Truncate URL for display
function truncateUrl(url) {
    try {
        const urlObj = new URL(url);
        let display = urlObj.hostname + urlObj.pathname;
        if (display.length > 50) {
            display = display.substring(0, 47) + '...';
        }
        return display;
    } catch {
        return url.substring(0, 50);
    }
}

// Display error state
function displayError() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(el => {
        el.textContent = '--';
    });

    document.getElementById('currentTabs').textContent = '--';
    document.getElementById('tabsList').innerHTML = '<div class="error">Error loading tabs</div>';
}

// Initialize theme from storage
async function initializeTheme() {
    try {
        const { theme } = await chrome.storage.local.get(['theme']);
        const savedTheme = theme || 'dark'; // Default to dark
        const toggleCheckbox = document.getElementById('themeToggle');

        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            if (toggleCheckbox) toggleCheckbox.checked = true;
        } else {
            if (toggleCheckbox) toggleCheckbox.checked = false;
        }
    } catch (error) {
        console.error('Error loading theme:', error);
    }
}

// Setup theme toggle button
function setupThemeToggle() {
    const toggleCheckbox = document.getElementById('themeToggle');
    if (toggleCheckbox) {
        toggleCheckbox.addEventListener('change', toggleTheme);
    }
}

// Toggle between light and dark theme
async function toggleTheme(e) {
    const isChecked = e.target.checked;

    if (isChecked) {
        // Switch to light
        document.body.classList.add('light-theme');
        await chrome.storage.local.set({ theme: 'light' });
    } else {
        // Switch to dark
        document.body.classList.remove('light-theme');
        await chrome.storage.local.set({ theme: 'dark' });
    }
}
