import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { glob } from "glob";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Annotation, Book } from "./types";
import groupBy from "lodash.groupby";

const username = os.userInfo().username;
const ANNOTATION_DB_PATH = `/users/${username}/Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation/`;
const BOOK_DB_PATH = `/users/${username}/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary/`;
const annotationsFiles = glob.sync(`${ANNOTATION_DB_PATH}/*.sqlite`);
const booksFiles = glob.sync(`${BOOK_DB_PATH}/*.sqlite`);

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

async function createDB(filename: string) {
  return await open({
    filename: filename,
    driver: sqlite3.Database,
  });
}

async function getBooksFromDBFile(filename: string): Promise<Book[]> {
  const db = await createDB(filename);
  return await db.all<Book[]>(SELECT_ALL_BOOKS_QUERY);
}

async function getBooks() {
  const books = await Promise.all(booksFiles.map(getBooksFromDBFile));
  return books.flat();
}

async function getAnnotationsFromDBFile(filename: string) {
  const db = await createDB(filename);
  return await db.all<Annotation[]>(SELECT_ALL_ANNOTATIONS_QUERY);
}

async function getAnnotations() {
  const annotations = await Promise.all(
    annotationsFiles.map(getAnnotationsFromDBFile)
  );
  return annotations.flat();
}

const APPLE_EPOCH_START = new Date("2001-01-01").getTime();

function convertAppleTime(appleTime: number): number {
  return new Date(APPLE_EPOCH_START + appleTime * 1000).getTime();
}

export const exportAppleBook = (async () => {
  const books = await getBooks();
  const annotations = await getAnnotations();
  const annotationsByBooksIds = groupBy(annotations, "assetId");
  const annotationsByBooks: Record<string, any> = {}
  const output = [];

  for (const [bookId, annotations] of Object.entries(annotationsByBooksIds)) {
    const book = books.find((b) => b.id === bookId);
    console.log("processing book", book?.title ?? bookId)
    for (const annotation of annotations) {
      const data = {
        ...annotation,
        modifiedAt: convertAppleTime(annotation.modifiedAt),
        createdAt: convertAppleTime(annotation.createdAt),
        author: book?.author ?? "Unknown Author",
        title: book?.title ?? "Unknown Title",
      }
      output.push(data)
      annotationsByBooks[book?.title ?? bookId] = [
        ...(annotationsByBooks[book?.title ?? bookId] || []),
        data
      ]
    }
  }

  const annotationsPath = path.resolve(process.cwd(), 'annotations.json');
  fs.writeFileSync(annotationsPath, JSON.stringify(output));
  console.log(`exported annotations.json in ${annotationsPath}`);

  const annotationsByBooksPath = path.resolve(process.cwd(), 'annotationsByBooks.json');
  fs.writeFileSync(annotationsByBooksPath, JSON.stringify(annotationsByBooks));
  console.log(`exported annotationsByBooks.json in ${annotationsByBooksPath}`);
})