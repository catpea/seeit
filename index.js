#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import lodash from 'lodash';
import { marked } from 'marked';
import {execa} from 'execa';

const moduleURL = new URL(import.meta.url);
const dirname = path.dirname(moduleURL.pathname);

const options = {
  delimiter: '?',
  openDelimiter: '<',
  closeDelimiter: '>',
};

function isImage(name){
  return name.match(/jpg$|png$|bmp$/)
}

let sets = (await fs.readdir('docs', {withFileTypes:true})).filter(dirent => dirent.isDirectory()).filter(dirent => !dirent.name.startsWith('_')).map(({name:location}) => ({ id: location, text:(fs.existsSync(path.join('docs', location, 'README.md'))?  marked.parse(fs.readFileSync(path.join('docs', location, 'README.md')).toString()):'' ),   files: fs.readdirSync(path.join('docs', location), { withFileTypes: true }) .filter(dirent => dirent.isFile())
 .filter(dirent => !dirent.name.startsWith('_'))
 .filter(dirent => isImage(dirent.name))
  .map(({name}) => path.join( location, name)) .map(o=>({
  url:o,
  thumbnail:path.join('preview', o.replace(/\.[a-z0-9]{3,4}$/,'.jpg')),
  image:path.join('docs', o),
  preview:path.join('docs', 'preview', o.replace(/\.[a-z0-9]{3,4}$/,'.jpg'))
 }))}))

// resize files
for (const set of sets) {
  for (const file of set.files) {
    await fs.ensureDir(path.dirname(file.preview));
    await execa('convert', [file.image, '-resize','256x>', file.preview]);
  }
}

// create index file
const indexEjs = await fs.readFile(path.join(dirname, 'templates', 'index.ejs'), 'utf8'); // read text
const indexTemplate = ejs.compile(indexEjs, options);
const indexPage = indexTemplate({sets});
await fs.writeFile(path.join('docs', 'index.html'), indexPage);
