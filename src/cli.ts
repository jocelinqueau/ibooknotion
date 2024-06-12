import minimist from 'minimist';
import prompts from 'prompts';
import { config } from "dotenv";
import { Client } from "@notionhq/client";

import { exportAppleBook, extractAppleBookData } from './applebook';
import { importToNotion, updateNotionDatabase } from './notion';

config();

const getApiKey = async () => {
  const { apiKey } = await prompts({
    type: 'text',
    name: 'apiKey',
    message: 'What is your Notion API key?',
  });

  return apiKey;
}

const getPageId = async () => {
  const { pageId } = await prompts({
    type: 'text',
    name: 'pageId',
    message: 'What is the page id?',
  });

  return pageId;
}

const getDatabaseId = async () => {
  const { databaseId } = await prompts({
    type: 'text',
    name: 'databaseId',
    message: 'What is the database id?',
  });

  return databaseId;
}

async function main() {
  const args = minimist(process.argv.slice(2));
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
      await exportAppleBook();
      console.log('done');
      process.exit(0);
    }
    else if (args.pageId) {
      const apiKey = await getApiKey();
      const notion = new Client({ auth: apiKey });
      console.log('creating');
      process.exit(0);
    }
    else if (args.databaseId) {
      const apiKey = await getApiKey();
      const notion = new Client({ auth: apiKey });
      console.log('updating');
      process.exit(0);
    }
    else {
      console.log(message);
      process.exit(0);
    }
  }

  const { option } = await prompts({
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
    await exportAppleBook();
    console.log('done');
    process.exit(0);
  }

  if (option === 'create') {
    try {
      const apiKey = await getApiKey();
      const notion = new Client({ auth: apiKey });
      const pageId = await getPageId();
      const { output: data } = await extractAppleBookData();
      await importToNotion(notion, pageId, data)
    } catch (e) {
      console.log("error while creating", e)
    }
    console.log('creating');
  }

  if (option === 'update') {
    const apiKey = await getApiKey();
    const notion = new Client({ auth: apiKey });
    const databaseId = await getDatabaseId();
    const { output: data } = await extractAppleBookData();
    await updateNotionDatabase(notion, databaseId, data)
    console.log('updating');
  }
}

main().catch(console.error);
