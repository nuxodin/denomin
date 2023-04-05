import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
//import {dump} from 'https://cdn.jsdelivr.net/gh/nuxodin/dump.js@1.2.2/mod.min.js';
import * as my from './my.js';
import * as system from './system.js';
import { Session } from "https://deno.land/x/oak_sessions/mod.ts"
import { typeByExtension } from "https://deno.land/std@0.145.0/media_types/mod.ts";

const port = 8761;
const app = new Application();
const router = new Router();
const session = new Session();


//import { MysqlDb } from "../item.js/drivers/sql/MysqlDb.js";
//import { resolveAll } from "../item.js/tools/AsyncItem.js";
import { MysqlDb } from 'https://cdn.jsdelivr.net/gh/nuxodin/item.js@0.2.2/drivers/sql/MysqlDb.js';
import { resolveAll } from 'https://cdn.jsdelivr.net/gh/nuxodin/item.js@0.2.2/tools/AsyncItem.js';



import $ from 'https://deno.land/x/dax@0.30.1/mod.ts';

try {
    let x = await $`mysql --version`.text();
    console.log(x);
} catch {
    console.log('sudo yum install mariadb-server');
    //await $`sudo apt-get install mysql-server`;
    await $`sudo yum install mariadb-server`;
    await $`sudo mysql_secure_installation`;
}



const db = new MysqlDb();
await db.connect({host: 'localhost', db:'denomin'});

db.setSchema({
    properties: {
        domain: {
            properties: {
                id:     {type: 'integer', x_autoincrement: true},
                domain: {type: 'string', maxLength: 255},
                path:   {type: 'string', maxLength: 1000},
                ip:     {type: 'string', maxLength: 15, oneOf: [{format: 'ipv4'}, {format: 'ipv6'}]},
                size:   {type: 'number'},
                status: {type: 'string', maxLength: 20, enum: ['active', 'inactive']},
                type:   {type: 'string', maxLength: 20, enum: ['domain', 'subdomain', 'alias']},
                created: {type: 'string', format: 'date-time'},
            },
            required: ['domain', 'path', 'size', 'type'],
        }
    },
});





app.use(session.initMiddleware());

// force login
app.use(async (ctx, next) => {
    const user = await ctx.state.session.get('user');
    if (user) await next();
    else await my.showLogin(ctx);
});


router.get('/', async (ctx) => {

    const free = await system.physicalMemoryFree();
    const available = await system.physicalMemoryTotal();
    const memoryHtml = `
    Memory: <small>${available - free} / ${available}</small>
    <progress value="${available - free}" max="${available}"></progress>
    `;

    const bootedAt = await system.bootTime();
    const systemTime = await system.systemTime();

    ctx.response.type = 'html';
    ctx.response.body = `${my.htmlHeader}
            <body>

            <nav>
                <ul>
                    <li><a href=/file>Files</a></li>
                    <li><a href=/domain>Domains</a></li>
                </ul>
            </nav>

            Last boot:
            <span>
                <u1-time datetime="${bootedAt.toISOString()}" hour minute></u1-time>
                <u1-tooltip>
                    <u1-time datetime="${bootedAt.toISOString()}" hour minute type=date></u1-time>
                </u1-tooltip>
            </span>

            <br>
            System time: <u1-time type=date datetime="${systemTime.toISOString()}" hour minute></u1-time><br>
            ${memoryHtml}
        `;
});


// save api
router.post('/file/:file(.*)', async (ctx, next) => {
    const file = ctx.params.file;
    if (ctx.request.method === 'POST') {
        const data = ctx.request.body();
        const obj = await data.value;
        await Deno.writeTextFile(file, obj.content);
        ctx.response.body = {};
    }
});

// show edit
router.get('/file/:file(.*)', async (ctx, next) => {
    const file = ctx.params.file;
    const line = ctx.request.url.searchParams.get('line');
    const col = ctx.request.url.searchParams.get('col');


    const version = '5.65.5';
    const url = `https://cdn.jsdelivr.net/npm/codemirror@${version}`;
    const min = 'min.';

    const ext = file.replace(/.*\./, '');
    let mime = typeByExtension(ext);
    if (!mime) mime = 'text/plain';
    if (mime === 'image/svg+xml') mime = 'application/xml';
    mime = mime.replace('application/x-javascript', 'text/javascript');

    const content = await Deno.readTextFile(file);

    ctx.response.body = `${my.htmlHeader}
        <link rel="stylesheet" href="${url}/lib/codemirror.${min}css">
        <link rel="stylesheet" href="${url}/theme/eclipse.${min}css">
        <script src="${url}/lib/codemirror.${min}js"></script>
        <script src="${url}/addon/hint/show-hint.${min}js"></script>
        <link rel="stylesheet" href="${url}/addon/hint/show-hint.${min}css">
        <script src="${url}/addon/hint/javascript-hint.${min}js"></script>
        <script src="${url}/addon/scroll/annotatescrollbar.${min}js"></script>
        <script src="${url}/addon/search/matchesonscrollbar.${min}js"></script>
        <script src="${url}/addon/search/searchcursor.${min}js"></script>
        <script src="${url}/addon/search/match-highlighter.${min}js"></script>
        <script src="${url}/addon/fold/xml-fold.${min}js"></script>
        <script src="${url}/addon/edit/matchtags.${min}js"></script>
        <script src="${url}/addon/edit/trailingspace.${min}js"></script>
        <script src="${url}/mode/xml/xml.${min}js"></script>
        <script src="${url}/mode/javascript/javascript.${min}js"></script>
        <script src="${url}/mode/css/css.${min}js"></script>
        <script src="${url}/mode/clike/clike.${min}js"></script>
        <script src="${url}/mode/php/php.${min}js"></script>
        <script src="${url}/mode/htmlmixed/htmlmixed.${min}js"></script>
        <script src="${url}/keymap/sublime.${min}js"></script>
        <style>
        .markLine {
            background:rgba(255,255,180,.8);
        }
        html, body {
            height:100%;
            margin:0 !important;
        }
        .CodeMirror { height:100%; background:#fff; }
        .CodeMirror-scroll { height:100%; }
        .CodeMirror-gutter { min-width:.5em; }

        /* matchhighlighter */
        .CodeMirror-focused .cm-matchhighlight {
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQI12NgYGBgkKzc8x9CMDAwAAAmhwSbidEoSQAAAABJRU5ErkJggg==);
            background-position: bottom;
            background-repeat: repeat-x;
        }
        .cm-matchhighlight {background-color: #90ee9088}
        .CodeMirror-selection-highlight-scrollbar {background-color: green}

        /* trailing space */
        .cm-trailingspace {
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QUXCToH00Y1UgAAACFJREFUCNdjPMDBUc/AwNDAAAFMTAwMDA0OP34wQgX/AQBYgwYEx4f9lQAAAABJRU5ErkJggg==);
          background-position: bottom left;
          background-repeat: repeat-x;
        }

        /* new */
        .CodeMirror {
            line-height:normal;
            font-size:12px;
            scroll-behavior: auto;
        }
        .CodeMirror * {
            line-height:normal;
            scroll-behavior: auto;
        }

        </style>
        <body style="padding:0">
            <button
			class=q1Rst
			id=saveButton
			style="position:fixed;
					right:0;
					top:10px;
                    width:auto;
					z-index:10;
					padding:10px 12px;
					display:none;
					background-image: linear-gradient(rgba(255,255,255,.5),rgba(205,205,205,.5));">
            ${true?'save':'rechte zum speichern fehlen!'}
		</button>
		<div style="height:100%; width:100%">
			<textarea id=editor name="textareaContentCanBeCachedOnReload${Math.random()}" mime="${mime}" line="${line??''}" col="${col??''}" style="width:100%; height:100%;">${my.htmlEscape(content)}</textarea>
		</div>


        <script>



        async function postData(url, data) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            return response.json();
        }



        const btn = document.getElementById('saveButton');
        const editorEl = document.getElementById('editor');
        const mime   = editorEl.getAttribute('mime');
        let cmLine = editorEl.getAttribute('line')-1;
        const cmCol  = editorEl.getAttribute('col')-1;

        async function saveFile(content){
            btn.style.backgroundColor = '#fea';
            const res = await postData(location.href, {content});
            if ('todo') {
                btn.style.backgroundColor = '';
                btn.style.display = 'none';
            }
        };

        btn.addEventListener('click',()=>{
            saveFile(editor.getValue());
        });


        function saveEvent(e){
            if (e.key === 's' && e.ctrlKey) {
                btn.dispatchEvent(new Event('click'));
                e.preventDefault();
            }
        }
        var editor = CodeMirror.fromTextArea(editorEl, {
            lineNumbers: true,
            theme:       'eclipse',
            mode:        {name:mime, globalVars:true},
            keyMap:      'sublime',
            extraKeys:   {"Ctrl-Space": "autocomplete"},
            lineWrapping:true,
            matchTags:   {bothTags: true},
            showTrailingSpace: true,
            indentWithTabs: true,
            smartIndent: true,
            indentUnit: 4,
            tabSize: 4,
            highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
        });
        editor.focus();
        editor.getWrapperElement().ownerDocument.addEventListener('keydown', saveEvent, 0);

        editor.on('change', e=>{
            btn.style.display = 'block';
            btn.style.backgroundColor = '#faa';
        });

        if (cmLine !== '' && cmLine !== -1) {
            cmLine = parseInt(cmLine);
            setTimeout(()=>{
                editor.setCursor(cmLine, cmCol);
                editor.addLineClass(cmLine, null, 'markLine');
                const line = document.querySelector('.CodeMirror-lines .markLine');
                line && line.scrollIntoView({ behavior: 'auto', block:'center'});
            }, 200);
        }
        </script>
        `;

    await next();
});



router.get('/file', async (ctx) => {
    const items = await my.listDir('/');

    ctx.response.type = 'html';
    ctx.response.body = `${my.htmlHeader}
            <body>
            <u1-tree1 name="" id=fileRoot>
                Files
                ${items.map(item=>`<u1-tree1 aria-expanded aria-live=off name="${item.name}">${item.name}</u1-tree1>`).join('')}
            </u1-tree1>
            <script>
            fileRoot.addEventListener('u1-tree1-expand',e=>{
                const tree = e.target;
                if (e.load) {
                    const path = e.target.path().map(el=>el.getAttribute('name'));
                    const encPath = encodeURI(path.join('/'));
                    const load = fetch('/api/dirlist/' + encPath).then(r=>r.json()).then(data=>{
                        let html = '';
                        data.forEach(item=>{
                            const attr = item.type==='file'?'':'aria-expanded aria-live=off';
                            const icon = item.type==='file'?'📄':'📁';
                            html +=
                            '<u1-tree1 '+attr+' name="'+item.name+'">'+
                                '<span slot=icon>'+icon+'</span>'+
                                (item.type==='file'
                                    ?   '<a href="/file/'+encPath+'/'+encodeURI(item.name)+'">'+
                                            item.name+
                                        '</a>'
                                    :    item.name
                                ) +
                            '</u1-tree1>';
                        });
                        tree.innerHTML += html;
                    });
                    e.load(load);
                }
            });
            </script>
        `;
});



router.get('/domain', async (ctx) => {
    const table = db.item('domain');
    await table.loadAll();
    const all = await resolveAll(table);
    ctx.response.type = 'html';
    ctx.response.body = `${my.htmlHeader}
            <body>
            <div u1-focusgroup>

                <u1-splitbutton>
                    <button style="width:auto">
                        <u1-ico>add</u1-ico>
                    </button>
                    <menu>
                        <li><button>Domain</button>
                        <li><button>Subdomain</button>
                        <li><button>Alias Domain</button>
                    </menu>
                </u1-splitbutton>

                &nbsp;
                <button style="width:auto">remove</button>
            </div>

            <u1-table sortable>
                <table>
                    <thead>
                        <tr>
                            <th style="width:2rem">
                            <th>ID
                            <th>Domain
                            <th>IP
                            <th>Type
                            <th>Status
                            <th>Created
                            <th>Size
                    <tbody>
                        ${Object.values(all).map(item=>`
                            <tr>
                                <td><input type=checkbox>
                                <td>${item.id}
                                <td u1-href="/domain/${item.id}"><a href="/domain/${item.id}">${item.domain}</a>
                                <td>${item.ip}
                                <td>${item.type}
                                <td>${item.status}
                                <td>${item.created}
                                <td>${item.size}
                        `).join('')}
                </table>
            </u1-table>
        `;
});

router.get('/domain/:id', async (ctx) => {
    const id = ctx.params.id;
    const Row = db.item('domain').item(id);
    await Row.loadItems();
    const row = await resolveAll(Row);
    ctx.response.type = 'html';
    ctx.response.body = `${my.htmlHeader}
            <body>

            <u1-tabs>
                <h2>Overview</h2>
                <div>
                    <table>
                        <tr><td>ID<td>${row.id}
                        <tr><td>Domain<td>${row.domain}
                        <tr><td>IP<td>${row.ip}
                        <tr><td>Type<td>${row.type}
                        <tr><td>Status<td>${row.status}
                        <tr><td>Created<td>${row.created}
                        <tr><td>Size<td>${row.size}

                    </table>
                </div>
                <h2>Files</h2>
                <div></div>
                <h2>Databases</h2>
                <div></div>
                <h2>DNS</h2>
                <div></div>
                <h2>Settings</h2>
                <div></div>
            </u1-tabs>
        `;
});




// serve directory listing
app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith('/api/dirlist')) {
        const path = ctx.request.url.pathname.split('/api/dirlist/')[1];
        const names = await my.listDir(decodeURI(path));
        ctx.response.body = names;
    } else {
        await next();
    }
});

app.use(router.routes());
//app.use(router.allowedMethods());






app.addEventListener('listen', () => {
  console.log(`Listening on localhost:${port}`);
});
await app.listen({ port });
