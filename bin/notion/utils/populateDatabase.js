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
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateDatabase = exports._constructDatabaseEntryProps = void 0;
const _constructDatabaseEntryProps = (entries) => {
    return entries.reduce((acc, record) => {
        const key = Object.keys(record)[0];
        const value = record[key];
        const type = typeof value;
        if (typeof value === "object") {
            if (value.title) {
                return Object.assign(Object.assign({}, acc), { [key]: {
                        title: [
                            {
                                type: "text",
                                text: {
                                    content: value.value,
                                },
                            },
                        ],
                    } });
            }
        }
        if (key === "Title" && typeof value === "string") {
            return Object.assign(Object.assign({}, acc), { [value]: {
                    title: [
                        {
                            type: "text",
                            text: {
                                content: value,
                            },
                        },
                    ],
                } });
        }
        switch (type) {
            case "string":
                return Object.assign(Object.assign({}, acc), { [key]: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: value,
                                },
                            },
                        ],
                    } });
            case "number":
                return Object.assign(Object.assign({}, acc), { [key]: {
                        number: value,
                    } });
            default:
                const message = `Invalid type for ${key}: ${type}`;
                throw new Error(message);
        }
    }, {});
};
exports._constructDatabaseEntryProps = _constructDatabaseEntryProps;
const populateDatabase = (_a) => __awaiter(void 0, [_a], void 0, function* ({ notion, databaseId, entries, }) {
    const props = (0, exports._constructDatabaseEntryProps)(entries);
    // retrieve database 
    const database = yield notion.databases.retrieve({ database_id: databaseId });
    const databaseProperties = database.properties;
    const databasePropertiesKeys = Object.keys(databaseProperties);
    // validate entries throw invalid asap
    entries.forEach((entry) => {
        const entryKeys = Object.keys(entry);
        const invalidKeys = entryKeys.filter((key) => !databasePropertiesKeys.includes(key));
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid properties found: ${invalidKeys.join(", ")}`);
        }
    });
    yield notion.pages.create({
        parent: { database_id: databaseId },
        properties: props
    });
});
exports.populateDatabase = populateDatabase;
