#!/usr/bin/env node
import prompts from 'prompts';
import minimist from 'minimist';
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
        process.exit(0);
    }
    else if (args.pageId) {
        console.log('creating');
        process.exit(0);
    }
    else if (args.databaseId) {
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
}
if (option === 'create') {
    console.log('creating');
}
if (option === 'update') {
    console.log('updating');
}
