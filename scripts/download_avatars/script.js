const { parse } = require("yaml")
const fs = require("fs/promises");
const path = require("node:path");

const avatarDir = path.join(__dirname, "../../", "static", "img", "authors");

function fileExists(pathName) {
    return require("fs").existsSync(pathName)
}

async function ensureDir() {
    if (fileExists(avatarDir)) {
        return;
    }
    await fs.mkdir(avatarDir);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
            console.log(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`);
            await sleep(delay * Math.pow(2, i));
        }
    }
}

async function download(name, link) {
    const localFile = path.join(avatarDir, `${name}.png`);
    if (fileExists(localFile)) {
        return;
    }
    const response = await fetchWithRetry(link);
    const image = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localFile, image);
}

async function processBatch(items, batchSize, fn) {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(fn));
    }
}

async function exec() {
    await ensureDir();
    const fileDir = path.join(__dirname, "../../", "blog", "authors.yml");
    const fileContent = (await fs.readFile(fileDir)).toString();
    const authors = parse(fileContent);
    const entries = Object.entries(authors).filter(([, author]) => author?.url);
    await processBatch(entries, 5, async ([name, author]) => {
        await download(name, `${author.url}.png`);
    });
}

exec();