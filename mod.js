import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
//import {dump} from 'https://cdn.jsdelivr.net/gh/nuxodin/dump.js@1.2.1/mod.min.js';
import * as system from './system.js';
import * as my from './my.js';

const port = 8761;
const app = new Application();
const router = new Router();

router.get('/', async (ctx) => {

    const free = await system.physicalMemoryFree();
    const available = await system.physicalMemoryTotal();
    const memoryHtml = `
    Memory: <small>${available - free} / ${available}</small>
    <progress value="${available - free}" max="${available}"></progress>
    `;

    let bootedAt = await my.run(["cmd", "/c", "wmic os get lastbootuptime"]);
    bootedAt = my.yyyymmddhhmmssToDate( bootedAt.split("\r\n")[1].trim() );

    let systemTime = await my.run(["cmd", "/c", "wmic os get LocalDateTime"]);
    systemTime = my.yyyymmddhhmmssToDate( systemTime.split("\r\n")[1].trim() );

    ctx.response.type = 'html';
    ctx.response.body = `<!DOCTYPE html>
        <html lang=en>
            <head>
                <meta charset=utf-8>
                <meta name=viewport content="width=device-width">
                <title>Server-Admin - Denomin</title><head>
                <script type=module src="https://cdn.jsdelivr.net/gh/u1ui/u1/auto.min.js"></script>
            <body>

            Last boot:
            <span>
                <u1-time datetime="${bootedAt.toISOString()}" hour minute></u1-time>
                <u1-tooltip>
                    <u1-time datetime="${bootedAt.toISOString()}" hour minute type=date></u1-time>
                </u1-tooltip>
            </span>

            <br>
            System time: <u1-time type=date datetime="${bootedAt.toISOString()}" hour minute></u1-time><br>
            ${memoryHtml}
        `;
});


router.get('/files', async (ctx) => {



    async function printFilesNames(dir) {
        const names = [];
        for await (const dirEntry of Deno.readDir(dir)) {
            names.push(dirEntry.name);
        }
        return names;
    }
    const names = await printFilesNames('/');

    ctx.response.type = 'html';
    ctx.response.body = `<!DOCTYPE html>
        <html lang=en>
            <head>
                <meta charset=utf-8>
                <meta name=viewport content="width=device-width">
                <title>Server-Admin - Denomin</title><head>
                <script type=module src="https://cdn.jsdelivr.net/gh/u1ui/u1@3.0.4/auto.min.js"></script>
            <body>
            <u1-tree1>
                Files
                ${names.map(name=>`<u1-tree1>${name}</u1-tree1>`).join('')}
            </u1-tree1>
        `;
});


app.use(router.routes());
app.use(router.allowedMethods());





app.addEventListener('listen', () => {
  console.log(`Listening on localhost:${port}`);
});
await app.listen({ port });
