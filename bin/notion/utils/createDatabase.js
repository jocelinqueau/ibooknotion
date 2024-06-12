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
exports.createDatabase = exports._constructDatabaseProperties = exports.parseDatabaseProperties = void 0;
const zod_1 = __importDefault(require("zod"));
exports.parseDatabaseProperties = zod_1.default.object({
    title: zod_1.default.array(zod_1.default.object({
        type: zod_1.default.literal("text"),
        text: zod_1.default.object({
            content: zod_1.default.string(),
        }),
    })),
    properties: zod_1.default.record(zod_1.default.string(), zod_1.default.object({
        type: zod_1.default.union([zod_1.default.literal("rich_text"), zod_1.default.literal("number"), zod_1.default.literal("title")]),
        rich_text: zod_1.default.object({}).optional(),
        number: zod_1.default.object({}).optional(),
        title: zod_1.default.object({}).optional(),
    })),
});
const _constructDatabaseProperties = (options) => {
    var _a, _b;
    return {
        title: [
            {
                type: "text",
                text: {
                    content: options.title,
                },
            },
        ],
        properties: (_b = (_a = options.properties) === null || _a === void 0 ? void 0 : _a.reduce((acc, prop) => {
            const key = Object.keys(prop)[0];
            const value = prop[key];
            const newType = value === "text" ? "rich_text" : value;
            return Object.assign({ [key]: {
                    type: newType,
                    [newType]: {}
                } }, acc);
        }, {})) !== null && _b !== void 0 ? _b : {},
    };
};
exports._constructDatabaseProperties = _constructDatabaseProperties;
const createDatabase = (_a) => __awaiter(void 0, [_a], void 0, function* ({ notion, databaseId, options, }) {
    const props = (0, exports._constructDatabaseProperties)(options);
    const parsedProps = exports.parseDatabaseProperties.parse(props);
    const body = Object.assign({ parent: {
            type: "page_id",
            page_id: databaseId,
        } }, parsedProps);
    return yield notion.databases.create(body);
});
exports.createDatabase = createDatabase;
