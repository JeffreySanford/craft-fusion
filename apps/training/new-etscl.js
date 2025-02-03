"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var axios = require("axios");
var path = require("path");
var crypto = require("crypto");
var jsdom_1 = require("jsdom");
var entities_1 = require("./entities");
// ===================== CONFIGURATION =====================
var ETCSL_BASE_URL = "https://etcsl.orinst.ox.ac.uk/cgi-bin/etcsl.cgi?text=";
var OUTPUT_DIR = "./myths";
var REPORT_FILE = "./report-etscl.json";
var CATEGORIES_FILE = './translation-categories.json';
var MAX_RETRIES = 3;
var RETRY_DELAY = 2000;
var totalMythsProcessed = 0;
var totalParagraphs = 0;
var totalProperNames = 0;
var totalMissingTextEntries = 0;
var totalTransliterations = 0;
var totalTranslations = 0;
var entityMap = {};
var categories = {};
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
var logMessage = function (message, color) {
    if (color === void 0) { color = 'default'; }
    var colorCodes = {
        default: '\x1b[0m',
        blue: '\x1b[34m',
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m'
    };
    console.log("".concat(colorCodes[color], "[LOG] ").concat(new Date().toISOString(), " - ").concat(message).concat(colorCodes.default));
};
// ===================== HASHING FUNCTION =====================
var calculateHash = function (content) {
    logMessage("Calculating SHA-256 hash of content");
    return crypto.createHash('sha256').update(content).digest('hex');
};
// ===================== HTML TO STRUCTURED JSON PARSER =====================
var parseHtmlToJson = function (htmlContent, transliterationContent, mythId) {
    var _a, _b;
    var dom = new jsdom_1.JSDOM(htmlContent);
    var document = dom.window.document;
    var title = ((_b = (_a = document.querySelector('h2')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || "Myth ".concat(mythId);
    // Extract all paragraphs that actually contain the myth text
    var mythParagraphs = Array.from(document.querySelectorAll('td:nth-of-type(2) p'));
    var paragraphs = mythParagraphs.map(function (p) {
        var _a;
        var lineNumberMatch = p.innerHTML.match(/(\d+[-\d+]*)\./);
        var lineNumber = lineNumberMatch ? lineNumberMatch[1] : "Unknown";
        var text = ((_a = p.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        var properNames = Array.from(new Set(Array.from(p.querySelectorAll('span.proper')).map(function (el) { var _a; return (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim(); })));
        var missingText = Array.from(p.querySelectorAll('span.gap')).map(function (el) { var _a; return (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim(); });
        totalParagraphs++;
        totalProperNames += properNames.length;
        totalMissingTextEntries += missingText.length;
        properNames.forEach(function (name) {
            var _a, _b;
            if (name && !entityMap[name]) {
                entityMap[name] = { myths: [], occurrences: 0, type: ((_a = entities_1.ENTITY_DESCRIPTIONS[name]) === null || _a === void 0 ? void 0 : _a.type) || "unknown", description: (_b = entities_1.ENTITY_DESCRIPTIONS[name]) === null || _b === void 0 ? void 0 : _b.description };
            }
            if (name && !entityMap[name].myths.includes(mythId)) {
                entityMap[name].myths.push(mythId);
            }
            if (name) {
                entityMap[name].occurrences++;
            }
        });
        return { lineNumber: lineNumber, text: text, properNames: properNames, missingText: missingText };
    }).filter(function (p) { return p.text.length > 0 && !p.text.includes("© Copyright"); });
    var translitDom = new jsdom_1.JSDOM(transliterationContent);
    var translitDocument = translitDom.window.document;
    var translitParagraphs = Array.from(translitDocument.querySelectorAll('td:nth-of-type(2) p'));
    var transliterations = translitParagraphs.map(function (p) { var _a; return ((_a = p.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ""; });
    totalMythsProcessed++;
    totalTransliterations += transliterations.length;
    totalTranslations += paragraphs.length;
    return { id: mythId, title: title, paragraphs: paragraphs, transliterations: transliterations };
};
// ===================== MYTH DOWNLOAD FUNCTION =====================
var downloadMyth = function (mythId) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _, category, section, story, translitUrl, url, filePath, hashFilePath, _loop_1, attempt, state_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = mythId.split("."), _ = _a[0], category = _a[1], section = _a[2], story = _a[3];
                translitUrl = "".concat(ETCSL_BASE_URL, "c.").concat(category, ".").concat(section, ".").concat(story, "&display=Crit&charenc=&lineid=c").concat(category).concat(section).concat(story, ".1#c").concat(category).concat(section).concat(story, ".1");
                url = "".concat(ETCSL_BASE_URL).concat(mythId, "&display=Crit&charenc=gcirc");
                filePath = path.join(OUTPUT_DIR, "".concat(mythId, ".json"));
                hashFilePath = path.join(OUTPUT_DIR, "".concat(mythId, ".hash"));
                logMessage("Fetching translation: ".concat(url), 'green');
                logMessage("Fetching transliteration: ".concat(translitUrl), 'green');
                _loop_1 = function (attempt) {
                    var _c, htmlResponse, translitResponse, newHash, mythData, error_1;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                _d.trys.push([0, 2, , 4]);
                                return [4 /*yield*/, Promise.all([
                                        axios.get(url, { timeout: 10000 }),
                                        axios.get(translitUrl, { timeout: 10000 })
                                    ])];
                            case 1:
                                _c = _d.sent(), htmlResponse = _c[0], translitResponse = _c[1];
                                newHash = calculateHash(htmlResponse.data + translitResponse.data);
                                if (fs.existsSync(hashFilePath) && fs.readFileSync(hashFilePath, 'utf-8').trim() === newHash) {
                                    logMessage("No changes detected for ".concat(mythId, ". Skipping."), 'yellow');
                                    return [2 /*return*/, { value: null }];
                                }
                                mythData = parseHtmlToJson(htmlResponse.data, translitResponse.data, mythId);
                                if (!mythData || mythData.paragraphs.length === 0) {
                                    logMessage("Blank myth detected for ".concat(mythId, ", skipping."), 'red');
                                    return [2 /*return*/, { value: null }];
                                }
                                fs.writeFileSync(filePath, JSON.stringify(mythData, null, 2));
                                fs.writeFileSync(hashFilePath, newHash);
                                logMessage("Updated and saved myth: ".concat(filePath), 'green');
                                return [2 /*return*/, { value: filePath }];
                            case 2:
                                error_1 = _d.sent();
                                logMessage("Error downloading myth ".concat(mythId, ": ").concat(error_1.message), 'red');
                                return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, RETRY_DELAY * (attempt + 1)); })];
                            case 3:
                                _d.sent();
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                };
                attempt = 0;
                _b.label = 1;
            case 1:
                if (!(attempt < MAX_RETRIES)) return [3 /*break*/, 4];
                return [5 /*yield**/, _loop_1(attempt)];
            case 2:
                state_1 = _b.sent();
                if (typeof state_1 === "object")
                    return [2 /*return*/, state_1.value];
                _b.label = 3;
            case 3:
                attempt++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/, null];
        }
    });
}); };
// ===================== MAIN DOWNLOAD HANDLER =====================
var downloadAllMyths = function () { return __awaiter(void 0, void 0, void 0, function () {
    var section, blankSectionCount, category, blankCategoryCount, story, mythId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logMessage("Starting sequential myth downloads", 'yellow');
                section = 1;
                _a.label = 1;
            case 1:
                if (!(section <= 6)) return [3 /*break*/, 9];
                blankSectionCount = 0;
                category = 1;
                _a.label = 2;
            case 2:
                if (!(category <= 100)) return [3 /*break*/, 8];
                blankCategoryCount = 0;
                story = 1;
                _a.label = 3;
            case 3:
                if (!(story <= 100)) return [3 /*break*/, 6];
                mythId = "t.".concat(section, ".").concat(category, ".").concat(story);
                return [4 /*yield*/, downloadMyth(mythId)];
            case 4:
                result = _a.sent();
                if (!result) {
                    blankCategoryCount++;
                    if (blankCategoryCount >= 1) {
                        logMessage("Skipping category ".concat(section, ".").concat(category, " after 1 blank myth."), 'yellow');
                        return [3 /*break*/, 6];
                    }
                }
                else {
                    blankCategoryCount = 0;
                }
                _a.label = 5;
            case 5:
                story++;
                return [3 /*break*/, 3];
            case 6:
                if (blankCategoryCount >= 1) {
                    blankSectionCount++;
                    if (blankSectionCount >= 1) {
                        logMessage("Skipping section ".concat(section, " after 1 blank category."), 'yellow');
                        return [3 /*break*/, 8];
                    }
                }
                _a.label = 7;
            case 7:
                category++;
                return [3 /*break*/, 2];
            case 8:
                section++;
                return [3 /*break*/, 1];
            case 9: return [2 /*return*/];
        }
    });
}); };
// ===================== SCRIPT EXECUTION =====================
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var totalSize;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logMessage("Initializing ETCSL myth download script", 'yellow');
                return [4 /*yield*/, downloadAllMyths()];
            case 1:
                _a.sent();
                logMessage("Myth synchronization completed successfully", 'green');
                logMessage("Total transliterations found: ".concat(totalTransliterations));
                logMessage("Total translations found: ".concat(totalTranslations));
                logMessage("Total myths processed: ".concat(totalMythsProcessed));
                totalSize = fs.readdirSync(OUTPUT_DIR).reduce(function (acc, file) {
                    var size = fs.statSync(path.join(OUTPUT_DIR, file)).size;
                    return acc + size;
                }, 0);
                logMessage("Estimated total size of the collection: ".concat((totalSize / (1024 * 1024)).toFixed(2), " MB"));
                fs.writeFileSync(REPORT_FILE, JSON.stringify(entityMap, null, 2));
                logMessage("Entity data successfully saved to ".concat(REPORT_FILE, "."));
                fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
                logMessage("Translation categories successfully saved to ".concat(CATEGORIES_FILE, "."));
                return [2 /*return*/];
        }
    });
}); })();
