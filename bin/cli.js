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
const minimist_1 = __importDefault(require("minimist"));
const prompts_1 = __importDefault(require("prompts"));
const dotenv_1 = require("dotenv");
const client_1 = require("@notionhq/client");
const applebook_1 = require("./applebook");
const notion_1 = require("./notion");
(0, dotenv_1.config)();
const getApiKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const { apiKey } = yield (0, prompts_1.default)({
        type: 'text',
        name: 'apiKey',
        message: 'What is your Notion API key?',
    });
    return apiKey;
});
const getPageId = () => __awaiter(void 0, void 0, void 0, function* () {
    const { pageId } = yield (0, prompts_1.default)({
        type: 'text',
        name: 'pageId',
        message: 'What is the page id?',
    });
    return pageId;
});
const getDatabaseId = () => __awaiter(void 0, void 0, void 0, function* () {
    const { databaseId } = yield (0, prompts_1.default)({
        type: 'text',
        name: 'databaseId',
        message: 'What is the database id?',
    });
    return databaseId;
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = (0, minimist_1.default)(process.argv.slice(2));
        const message = `
  Invalid option
  Usage: ibooknotion [option]?

  ibooknotion will prompt a menu

  Options:
    --export            Export iBooks notes to JSON, creating a file in the current directory
    --pageId=<id>       Create a Notion database with the iBooks notes
    --databaseId=<id>   Update the current Notion database with the fresh data
  `;
        if (Object.keys(args).length > 3) {
            console.log(message);
            process.exit(0);
        }
        if (Object.keys(args).length === 2) {
            if (args.export) {
                console.log('exporting');
                yield (0, applebook_1.exportAppleBook)();
                console.log('done');
                process.exit(0);
            }
            else if (args.pageId) {
                const apiKey = yield getApiKey();
                const notion = new client_1.Client({ auth: apiKey });
                console.log('creating');
                process.exit(0);
            }
            else if (args.databaseId) {
                const apiKey = yield getApiKey();
                const notion = new client_1.Client({ auth: apiKey });
                console.log('updating');
                process.exit(0);
            }
            else {
                console.log(message);
                process.exit(0);
            }
        }
        const { option } = yield (0, prompts_1.default)({
            type: 'select',
            name: 'option',
            message: 'What do you want to do?',
            initial: 0,
            choices: [
                { title: "Export my book annotation to json 💽", value: "export" },
                { title: "Create a notion database with my ibooks notes 🏗️", value: "create" },
                { title: "Update my current ibooks notion database with the fresh data 🌱", value: "update" }
            ],
        });
        if (option === 'export') {
            console.log('exporting');
            yield (0, applebook_1.exportAppleBook)();
            console.log('done');
            process.exit(0);
        }
        if (option === 'create') {
            try {
                const apiKey = yield getApiKey();
                const notion = new client_1.Client({ auth: apiKey });
                const pageId = yield getPageId();
                const { output: data } = yield (0, applebook_1.extractAppleBookData)();
                yield (0, notion_1.importToNotion)(notion, pageId, data);
            }
            catch (e) {
                console.log("error while creating", e);
            }
            console.log('creating');
        }
        if (option === 'update') {
            const apiKey = yield getApiKey();
            const notion = new client_1.Client({ auth: apiKey });
            const databaseId = yield getDatabaseId();
            const { output: data } = yield (0, applebook_1.extractAppleBookData)();
            yield (0, notion_1.updateNotionDatabase)(notion, databaseId, data);
            console.log('updating');
        }
    });
}
main().catch(console.error);
