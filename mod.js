import { Application, Router } from 'https://deno.land/x/oak/mod.ts';

import {dump} from 'https://cdn.jsdelivr.net/gh/nuxodin/dump.js@1.2.1/mod.min.js';


const port = 8761;

const app = new Application();

const router = new Router();

router.get('/', async (ctx) => {


    //const cmd = ["echo", "hello"];
    const cmd = ["cmd", "/c", "echo hello"];
    const p = Deno.run({ cmd });
    await p.status();

    const { code } = await p.status();
    const rawOutput = await p.output();
    const rawError = await p.stderrOutput();

// wmic ComputerSystem get TotalPhysicalMemory
// wmic OS get FreePhysicalMemory


    ctx.response.body = `<!DOCTYPE html>
        <html lang=en>
            <head>
                <meta charset=utf-8>
                <meta name=viewport content="width=device-width">
                <title>Server-Admin - Denomin</title><head>
                <script type=module src="https://cdn.jsdelivr.net/gh/u1ui/u1/auto.min.js"></script>
            <body>
            test
        `;
    ctx.response.body = dump({
        code,
        rawOutput,
        rawError,
    });
});

app.use(router.routes());



app.use(router.allowedMethods());

app.addEventListener('listen', () => {
  console.log(`Listening on localhost:${port}`);
});

await app.listen({ port });
