"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotionDatabase = exports.importToNotion = void 0;
const lodash_uniqby_1 = __importDefault(require("lodash.uniqby"));
const createDatabase_1 = require("./utils/createDatabase");
const populateDatabase_1 = require("./utils/populateDatabase");
const progressMapping = (progress) => Number(progress.toFixed(3));
function createBookInDatabase(notion, book, databaseId, pages) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const page = yield notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Books follow-up": {
                    title: [
                        {
                            type: "text",
                            text: {
                                content: book.title,
                            },
                        },
                    ],
                },
                Title: {
                    rich_text: [
                        {
                            type: "text",
                            text: {
                                content: book.title,
                            },
                        },
                    ],
                },
                Author: {
                    rich_text: [
                        {
                            type: "text",
                            text: {
                                content: book.author,
                            },
                        },
                    ],
                },
                Progress: {
                    number: progressMapping((_a = book === null || book === void 0 ? void 0 : book.bookProgress) !== null && _a !== void 0 ? _a : 0),
                },
            },
        });
        pages[book.title] = Object.assign(Object.assign({}, book), { pageId: page.id });
    });
}
const importToNotion = (notion, pageId, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const options = {
        title: "Books follow-up",
        properties: [
            { "Books follow-up": "title" },
            { Author: "text" },
            { Progress: "number" },
            { Title: "text" },
        ],
    };
    const _newDatabase = yield (0, createDatabase_1.createDatabase)({
        notion,
        databaseId: pageId,
        options
    });
    const databaseId = _newDatabase.id;
    const books = (0, lodash_uniqby_1.default)(data, "title");
    const pages = {};
    console.log(`found ${books.length} books`);
    const { default: ora } = yield Promise.resolve().then(() => __importStar(require('ora')));
    const createDbSpinner = ora(`found ${books.length} books`).start();
    for (const [index, book] of books.entries()) {
        const title = `${book.title} Annotations`;
        createDbSpinner.text = `Creating annotation database for ${book.title}, ${index + 1} of ${books.length}`;
        yield createBookInDatabase(notion, book, databaseId, pages);
        const page = pages[book.title];
        const pageId = page.pageId;
        const options = {
            title,
            properties: [
                { [title]: "title" },
                { Location: "text" },
                { "Highlight text": "text" },
                { Note: "text" },
                { BookPath: "text" },
                { "Color code": "text" },
            ],
        };
        const _db = yield (0, createDatabase_1.createDatabase)({
            notion,
            databaseId: pageId,
            options,
        });
        pages[book.title].db = _db.id;
    }
    createDbSpinner.succeed("finished creating databases");
    const populateDb = ora(`starting to import notes`).start();
    console.log(`found ${data.length} notes`);
    for (const item of data) {
        populateDb.text = `Importing note on ${item.title}`;
        const _db = pages[item.title].db;
        console.log("item", item);
        const page = yield (0, populateDatabase_1.populateDatabase)({
            notion,
            databaseId: _db !== null && _db !== void 0 ? _db : "",
            entries: [
                { Note: (_a = item.quote) !== null && _a !== void 0 ? _a : "" },
                { Location: (_b = item.annotationLocation) !== null && _b !== void 0 ? _b : "" },
                { "Highlight text": (_c = item.annotationText) !== null && _c !== void 0 ? _c : "" },
                { BookPath: (_d = item.bookPath) !== null && _d !== void 0 ? _d : "" },
                { "Color code": (_e = String(item.colorCode)) !== null && _e !== void 0 ? _e : "" },
                {
                    [`${item.title} Annotations`]: {
                        // i don't like to do that but i want to go to the fun part
                        title: true,
                        value: (_f = item.annotationText) !== null && _f !== void 0 ? _f : ""
                    }
                }
            ]
        });
    }
    populateDb.succeed("finished importing notes");
});
exports.importToNotion = importToNotion;
const updateNotionDatabase = (notion, databaseId, data) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("not implemented yet");
});
exports.updateNotionDatabase = updateNotionDatabase;
