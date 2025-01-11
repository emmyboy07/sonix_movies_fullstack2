const puppeteer = require('puppeteer-core');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Retry logic for actions with multiple attempts
async function retryAction(action, retries = 3, delay = 2000) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await action();
        } catch (error) {
            console.warn(`Action failed. Attempt ${attempt}/${retries}: ${error.message}`);
            lastError = error;
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

// Function to search and download movie
async function searchAndDownloadMovie(movieName) {
    const chromePath = process.env.CHROME_PATH || '/usr/bin/chromium';
    console.log(`Using Chromium at path: ${chromePath}`);  // Log the executable path

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath,  // Use the correct Chromium path
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    try {
        await retryAction(() => page.setViewport({ width: 1280, height: 800 }));
        await retryAction(() => page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'));

        console.log("Navigating to MovieBox...");
        await retryAction(() => page.goto('https://moviebox.ng', { waitUntil: 'load', timeout: 60000 }));

        async function performSearch() {
            console.log("Waiting for the search input...");
            await retryAction(() => page.waitForSelector('.pc-search-input', { timeout: 5000 }));

            console.log(`Typing movie name: ${movieName}`);
            await retryAction(async () => {
                const searchInput = await page.$('.pc-search-input');
                await searchInput.focus();
                await searchInput.type(movieName);
                await page.keyboard.press('Enter');
            });

            console.log("Waiting for search results...");
            await retryAction(() => page.waitForSelector('.pc-card', { timeout: 15000 }));
        }

        await retryAction(performSearch);

        const movieCards = await page.$$('.pc-card');
        if (movieCards.length === 0) {
            throw new Error("No search results found.");
        }

        async function selectFirstResult() {
            console.log("Selecting the first search result...");
            await retryAction(async () => {
                const watchNowButton = await movieCards[0].$('.pc-card-btn');
                if (!watchNowButton) throw new Error("No 'Watch Now' button found.");
                await watchNowButton.click();
            });

            console.log("Waiting for the movie details page...");
            await retryAction(() => page.waitForSelector('.flx-ce-ce.pc-download-btn', { timeout: 30000 }));
        }

        await retryAction(selectFirstResult);

        async function initiateDownload() {
            console.log("Clicking the download button...");
            await retryAction(async () => {
                const downloadButton = await page.$('.flx-ce-ce.pc-download-btn');
                if (!downloadButton) throw new Error("No download button found.");
                await downloadButton.click();
            });

            console.log("Waiting for quality options...");
            await retryAction(async () => {
                try {
                    await page.waitForSelector('.pc-quality-list .pc-itm', { timeout: 30000 });
                } catch (error) {
                    console.warn("Quality options not found, retrying download button...");
                    const downloadButton = await page.$('.flx-ce-ce.pc-download-btn');
                    if (downloadButton) {
                        await downloadButton.click();
                    }
                    throw error;
                }
            });
        }

        await retryAction(initiateDownload);

        console.log("Selecting a random quality...");
        const selectedResolution = await retryAction(async () => {
            const qualityOptions = await page.$$('.pc-quality-list .pc-itm');
            if (qualityOptions.length === 0) throw new Error("No quality options available.");
            const randomIndex = Math.floor(Math.random() * qualityOptions.length);
            const selectedOption = qualityOptions[randomIndex];
            const resolution = await selectedOption.$eval('.pc-resolution', (el) => el.textContent.trim());
            console.log(`Randomly selected resolution: ${resolution}`);
            await selectedOption.click();
            return resolution;
        });

        // Simulate download process
        console.log("Starting download simulation...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate 5 seconds of download time
        console.log("Download simulation complete!");

        // Generate a fake download link
        const fakeDownloadLink = `https://example.com/download/${movieName.replace(/\s+/g, '-')}-${selectedResolution}.mp4`;

        return { downloadLink: fakeDownloadLink, resolution: selectedResolution };

    } catch (error) {
        console.error("An error occurred:", error.message);
        console.error("Stack trace:", error.stack);
        throw error;
    } finally {
        if (browser && browser.isConnected()) {
            await browser.close();
        }
    }
}

// Create Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.post('/download', async (req, res) => {
    const { movieTitle } = req.body;

    if (!movieTitle) {
        return res.status(400).json({ error: 'Movie title is required.' });
    }

    try {
        const { downloadLink, resolution } = await searchAndDownloadMovie(movieTitle);
        if (!downloadLink) {
            return res.status(500).json({ error: 'Failed to simulate download.' });
        }
        res.json({ downloadLink, resolution, message: 'Download simulated successfully.' });
    } catch (error) {
        console.error('Error during download process:', error);
        res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
});

// Listen on the assigned port or fallback to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
