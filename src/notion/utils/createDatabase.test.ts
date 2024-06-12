import { CreateDatabaseParameters } from "@notionhq/client/build/src/api-endpoints.js";
import { Client } from "@notionhq/client";
import z from "zod";

export type NotionDatabaseFieldType = "text" | "number"  | "title";

export interface NotionDatabaseProperties {
  title: string;
  properties?: Record<string, NotionDatabaseFieldType>[];
}

export type NotionCreateDatabaseOptions = {
  title: [
    {
      type: "text";
      text: {
        content: string;
      };
    }
  ];
  properties: any;
};

export const parseDatabaseProperties = z.object({
  title: z.array(
    z.object({
      type: z.literal("text"),
      text: z.object({
        content: z.string(),
      }),
    })
  ),
  properties: z.record(
    z.string(),
    z.object({
      type: z.union([z.literal("rich_text"), z.literal("number"), z.literal("title")]),
      rich_text: z.object({}).optional(),
      number: z.object({}).optional(),
      title: z.object({}).optional(),
    })
  ),
});

export const _constructDatabaseProperties = (
  options: NotionDatabaseProperties
): NotionCreateDatabaseOptions => {
  return {
    title: [
      {
        type: "text",
        text: {
          content: options.title,
        },
      },
    ],
    properties:
      options.properties?.reduce((acc, prop) => {
        const key = Object.keys(prop)[0];
        const value = prop[key];
        const newType = value === "text" ? "rich_text" : value;

        return {
          
          [key]: {
            type: newType,
            [newType]: {}
          },
          ...acc,

        } as any;
      }, {}) ?? {},
  };
};

export const createDatabase = async ({
  notion,
  databaseId,
  options,
}: {
  notion: Client;
  databaseId: string;
  options: NotionDatabaseProperties;
}) => {
  const props = _constructDatabaseProperties(options);
  const parsedProps = parseDatabaseProperties.parse(props) as any as CreateDatabaseParameters["properties"];
  const body = {
    parent: {
      type: "page_id" as const,
      page_id: databaseId,
    },
    ...parsedProps
  } as any

  return await notion.databases.create(body);
};