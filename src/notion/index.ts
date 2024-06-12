
import uniqBy from "lodash.uniqby";
import { NotionDatabaseProperties, createDatabase } from "./utils/createDatabase";
import { populateDatabase } from "./utils/populateDatabase";
import { Client } from "@notionhq/client";


const progressMapping = (progress: number) => Number(progress.toFixed(3));

async function createBookInDatabase(notion: Client, book: any, databaseId: string, pages: Record<string, any>) {
  const page = await notion.pages.create({
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
        number: progressMapping(book?.bookProgress ?? 0),
      },
    },
  });

  pages[book.title] = {
    ...book,
    pageId: page.id,
  };
}

export const importToNotion = async (notion:Client, pageId:string, data:any) => {
  const options: NotionDatabaseProperties = {
    title: "Books follow-up",
    properties: [
      { "Books follow-up": "title" },
      { Author: "text" },
      { Progress: "number" },
      { Title: "text" },
    ],
  };

  const _newDatabase = await createDatabase({
    notion,
    databaseId: pageId,
    options
  });
  const databaseId = _newDatabase.id;

  const books = uniqBy(data, "title") as any[];
  const pages: Record<string, { pageId: string; db?: string }> = {};

  console.log(`found ${books.length} books`);

  const { default: ora } = await import('ora');
  const createDbSpinner = ora(`found ${books.length} books`).start();

  for (const [index, book] of books.entries()) {
    const title = `${book.title} Annotations`;
    createDbSpinner.text = `Creating annotation database for ${book.title}, ${index + 1} of ${books.length}`;
    await createBookInDatabase(notion, book, databaseId, pages);
    const page = pages[book.title];
    const pageId = page.pageId;

    const options: NotionDatabaseProperties = {
      title,
      properties: [
        { [title]: "title" },
        { Location: "text" },
        { "Highlight text": "text" },
        { Note: "text" },
        { BookPath: "text" },
        { "Color code": "text" },
      ],
    }
    const _db = await createDatabase({
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
    const page = await populateDatabase({
      notion,
      databaseId: _db ?? "",
      entries: [
        { Note: item.quote ?? "" },
        { Location: item.annotationLocation ?? "" },
        { "Highlight text": item.annotationText ?? "" },
        { BookPath: item.bookPath ?? "" },
        { "Color code": String(item.colorCode) ?? "" },
        {
          [`${item.title} Annotations`]: {
            // i don't like to do that but i want to go to the fun part
            title: true,
            value: item.annotationText ?? ""
          }
        }
      ]
    })
  }

  populateDb.succeed("finished importing notes");
}


export const updateNotionDatabase = async (notion: Client, databaseId: string, data: any) => {
  console.log("not implemented yet")
}