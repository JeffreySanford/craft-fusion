import * as fs from 'fs';
import * as axios from 'axios';
import * as path from 'path';
import * as crypto from 'crypto';
import { JSDOM } from 'jsdom';
import { ENTITY, ENTITY_DESCRIPTIONS } from './entities';

// ===================== CONFIGURATION =====================
const ETCSL_BASE_URL = "https://etcsl.orinst.ox.ac.uk/cgi-bin/etcsl.cgi?text=";
const OUTPUT_DIR = "./myths";
const REPORT_FILE = "./report-etscl.json";
const CATEGORIES_FILE = './translation-categories.json';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
let totalMythsProcessed = 0;
let totalParagraphs = 0;
let totalProperNames = 0;
let totalMissingTextEntries = 0;
let totalTransliterations = 0;
let totalTranslations = 0;
let entityMap: { [key: string]: ENTITY } = {};
let categories: { [key: string]: string[] } = {};

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const logMessage = (message: string, color: string = 'default') => {
    const colorCodes: { [key: string]: string } = {
        default: '\x1b[0m',
        blue: '\x1b[34m',
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m'
    };
    console.log(`${colorCodes[color]}[LOG] ${new Date().toISOString()} - ${message}${colorCodes.default}`);
};

// ===================== HASHING FUNCTION =====================
const calculateHash = (content: string): string => {
    logMessage("Calculating SHA-256 hash of content");
    return crypto.createHash('sha256').update(content).digest('hex');
};

// ===================== HTML TO STRUCTURED JSON PARSER =====================
const parseHtmlToJson = (htmlContent: string, transliterationContent: string, mythId: string): any => {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    const title = document.querySelector('h2')?.textContent?.trim() || `Myth ${mythId}`;
    
    // Extract all paragraphs that actually contain the myth text
    const mythParagraphs = Array.from(document.querySelectorAll('td:nth-of-type(2) p'));
    const paragraphs = mythParagraphs.map(p => {
        const lineNumberMatch = p.innerHTML.match(/(\d+[-\d+]*)\./);
        const lineNumber = lineNumberMatch ? lineNumberMatch[1] : "Unknown";

        const text = p.textContent?.trim() || "";
        const properNames = Array.from(new Set(Array.from(p.querySelectorAll('span.proper')).map(el => el.textContent?.trim())));
        const missingText = Array.from(p.querySelectorAll('span.gap')).map(el => el.textContent?.trim());

        totalParagraphs++;
        totalProperNames += properNames.length;
        totalMissingTextEntries += missingText.length;

        properNames.forEach(name => {
            if (name && !entityMap[name]) {
                entityMap[name] = { myths: [], occurrences: 0, type: ENTITY_DESCRIPTIONS[name]?.type || "unknown", description: ENTITY_DESCRIPTIONS[name]?.description };
            }
            if (name && !entityMap[name].myths.includes(mythId)) {
                entityMap[name].myths.push(mythId);
            }
            if (name) {
                entityMap[name].occurrences++;
            }
        });

        return { lineNumber, text, properNames, missingText };
    }).filter(p => p.text.length > 0 && !p.text.includes("© Copyright"));

    const translitDom = new JSDOM(transliterationContent);
    const translitDocument = translitDom.window.document;
    const translitParagraphs = Array.from(translitDocument.querySelectorAll('td:nth-of-type(2) p'));
    const transliterations = translitParagraphs.map(p => p.textContent?.trim() || "");

    totalMythsProcessed++;
    totalTransliterations += transliterations.length;
    totalTranslations += paragraphs.length;

    return { id: mythId, title, paragraphs, transliterations };
};

// ===================== MYTH DOWNLOAD FUNCTION =====================
const downloadMyth = async (mythId: string): Promise<string | null> => {
    const [_, category, section, story] = mythId.split(".");
    const translitUrl = `${ETCSL_BASE_URL}c.${category}.${section}.${story}&display=Crit&charenc=&lineid=c${category}${section}${story}.1#c${category}${section}${story}.1`;
    const url = `${ETCSL_BASE_URL}${mythId}&display=Crit&charenc=gcirc`;
    const filePath = path.join(OUTPUT_DIR, `${mythId}.json`);
    const hashFilePath = path.join(OUTPUT_DIR, `${mythId}.hash`);

    logMessage(`Fetching translation: ${url}`, 'green');
    logMessage(`Fetching transliteration: ${translitUrl}`, 'green');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const [htmlResponse, translitResponse]: [{ data: string }, { data: string }] = await Promise.all([
                axios.get<string>(url, { timeout: 10000 }),
                axios.get<string>(translitUrl, { timeout: 10000 })
            ]);

            const newHash = calculateHash(htmlResponse.data + translitResponse.data);
            if (fs.existsSync(hashFilePath) && fs.readFileSync(hashFilePath, 'utf-8').trim() === newHash) {
                logMessage(`No changes detected for ${mythId}. Skipping.`, 'yellow');
                return null;
            }

            const mythData = parseHtmlToJson(htmlResponse.data as string, translitResponse.data as string, mythId);
            if (!mythData || mythData.paragraphs.length === 0) {
                logMessage(`Blank myth detected for ${mythId}, skipping.`, 'red');
                return null;
            }

            fs.writeFileSync(filePath, JSON.stringify(mythData, null, 2));
            fs.writeFileSync(hashFilePath, newHash);
            logMessage(`Updated and saved myth: ${filePath}`, 'green');
            return filePath;
        } catch (error) {
            logMessage(`Error downloading myth ${mythId}: ${error.message}`, 'red');
            await new Promise(res => setTimeout(res, RETRY_DELAY * (attempt + 1)));
        }
    }
    return null;
};

// ===================== MAIN DOWNLOAD HANDLER =====================
const downloadAllMyths = async () => {
    logMessage("Starting sequential myth downloads", 'yellow');

    for (let section = 1; section <= 6; section++) {
        let blankSectionCount = 0;
        for (let category = 1; category <= 100; category++) {
            let blankCategoryCount = 0;
            for (let story = 1; story <= 100; story++) {
                const mythId = `t.${section}.${category}.${story}`;
                const result = await downloadMyth(mythId);
                if (!result) {
                    blankCategoryCount++;
                    if (blankCategoryCount >= 1) {
                        logMessage(`Skipping category ${section}.${category} after 1 blank myth.`, 'yellow');
                        break;
                    }
                } else {
                    blankCategoryCount = 0;
                }
            }
            if (blankCategoryCount >= 1) {
                blankSectionCount++;
                if (blankSectionCount >= 1) {
                    logMessage(`Skipping section ${section} after 1 blank category.`, 'yellow');
                    break;
                }
            }
        }
    }
};

// ===================== SCRIPT EXECUTION =====================
(async () => {
    logMessage("Initializing ETCSL myth download script", 'yellow');
    await downloadAllMyths();
    logMessage("Myth synchronization completed successfully", 'green');
    logMessage(`Total transliterations found: ${totalTransliterations}`);
    logMessage(`Total translations found: ${totalTranslations}`);
    logMessage(`Total myths processed: ${totalMythsProcessed}`);

    const totalSize = fs.readdirSync(OUTPUT_DIR).reduce((acc, file) => {
        const { size } = fs.statSync(path.join(OUTPUT_DIR, file));
        return acc + size;
    }, 0);

    logMessage(`Estimated total size of the collection: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);

    fs.writeFileSync(REPORT_FILE, JSON.stringify(entityMap, null, 2));
    logMessage(`Entity data successfully saved to ${REPORT_FILE}.`);

    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    logMessage(`Translation categories successfully saved to ${CATEGORIES_FILE}.`);
})();