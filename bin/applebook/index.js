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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAppleBook = exports.extractAppleBookData = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const glob_1 = require("glob");
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const lodash_groupby_1 = __importDefault(require("lodash.groupby"));
const username = node_os_1.default.userInfo().username;
const ANNOTATION_DB_PATH = `/users/${username}/Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation/`;
const BOOK_DB_PATH = `/users/${username}/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary/`;
const annotationsFiles = glob_1.glob.sync(`${ANNOTATION_DB_PATH}/*.sqlite`);
const booksFiles = glob_1.glob.sync(`${BOOK_DB_PATH}/*.sqlite`);
const SELECT_ALL_ANNOTATIONS_QUERY = `select 
  ZANNOTATIONASSETID as assetId,
  ZANNOTATIONSELECTEDTEXT as quote,
  ZANNOTATIONNOTE as comment,
  ZFUTUREPROOFING5 as chapter,
  ZANNOTATIONSTYLE as colorCode,
  ZANNOTATIONMODIFICATIONDATE as modifiedAt,
  ZANNOTATIONCREATIONDATE as createdAt
from ZAEANNOTATION
where ZANNOTATIONDELETED = 0 
  and ZANNOTATIONSELECTEDTEXT is not null 
  and ZANNOTATIONSELECTEDTEXT <> ''
order by ZANNOTATIONASSETID, ZPLLOCATIONRANGESTART;
`;
const SELECT_ALL_BOOKS_QUERY = `select 
  ZASSETID as id, 
  ZASSETGUID as guid,
  ZTITLE as title, 
  ZAUTHOR as author
from ZBKLIBRARYASSET`;
function createDB(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, sqlite_1.open)({
            filename: filename,
            driver: sqlite3_1.default.Database,
        });
    });
}
function getBooksFromDBFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield createDB(filename);
        return yield db.all(SELECT_ALL_BOOKS_QUERY);
    });
}
function getBooks() {
    return __awaiter(this, void 0, void 0, function* () {
        const books = yield Promise.all(booksFiles.map(getBooksFromDBFile));
        return books.flat();
    });
}
function getAnnotationsFromDBFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield createDB(filename);
        return yield db.all(SELECT_ALL_ANNOTATIONS_QUERY);
    });
}
function getAnnotations() {
    return __awaiter(this, void 0, void 0, function* () {
        const annotations = yield Promise.all(annotationsFiles.map(getAnnotationsFromDBFile));
        return annotations.flat();
    });
}
const APPLE_EPOCH_START = new Date("2001-01-01").getTime();
function convertAppleTime(appleTime) {
    return new Date(APPLE_EPOCH_START + appleTime * 1000).getTime();
}
const extractAppleBookData = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const books = yield getBooks();
    const annotations = yield getAnnotations();
    const annotationsByBooksIds = (0, lodash_groupby_1.default)(annotations, "assetId");
    const annotationsByBooks = {};
    const output = [];
    for (const [bookId, annotations] of Object.entries(annotationsByBooksIds)) {
        const book = books.find((b) => b.id === bookId);
        console.log("processing book", (_a = book === null || book === void 0 ? void 0 : book.title) !== null && _a !== void 0 ? _a : bookId);
        for (const annotation of annotations) {
            const data = Object.assign(Object.assign({}, annotation), { modifiedAt: convertAppleTime(annotation.modifiedAt), createdAt: convertAppleTime(annotation.createdAt), author: (_b = book === null || book === void 0 ? void 0 : book.author) !== null && _b !== void 0 ? _b : "Unknown Author", title: (_c = book === null || book === void 0 ? void 0 : book.title) !== null && _c !== void 0 ? _c : "Unknown Title" });
            output.push(data);
            annotationsByBooks[(_d = book === null || book === void 0 ? void 0 : book.title) !== null && _d !== void 0 ? _d : bookId] = [
                ...(annotationsByBooks[(_e = book === null || book === void 0 ? void 0 : book.title) !== null && _e !== void 0 ? _e : bookId] || []),
                data
            ];
        }
    }
    return { output, annotationsByBooks };
});
exports.extractAppleBookData = extractAppleBookData;
exports.exportAppleBook = (() => __awaiter(void 0, void 0, void 0, function* () {
    const { output, annotationsByBooks } = yield (0, exports.extractAppleBookData)();
    const annotationsPath = node_path_1.default.resolve(process.cwd(), 'annotations.json');
    node_fs_1.default.writeFileSync(annotationsPath, JSON.stringify(output));
    console.log(`exported annotations.json in ${annotationsPath}`);
    const annotationsByBooksPath = node_path_1.default.resolve(process.cwd(), 'annotationsByBooks.json');
    node_fs_1.default.writeFileSync(annotationsByBooksPath, JSON.stringify(annotationsByBooks));
    console.log(`exported annotationsByBooks.json in ${annotationsByBooksPath}`);
}));
