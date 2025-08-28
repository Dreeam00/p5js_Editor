$(document).ready(function() {
    const codeEditor = document.getElementById('codeEditor');
    const runButton = document.getElementById('runButton');
    const outputFrame = document.getElementById('outputFrame');
    const referenceButton = document.getElementById('referenceButton');
    const referenceModal = document.getElementById('referenceModal');
    // const referenceFrame = document.getElementById('referenceFrame'); // iframe削除のためコメントアウト
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const shareButton = document.getElementById('shareButton');
    const qrCodeModal = document.getElementById('qrCodeModal');
    const qrcodeDiv = document.getElementById('qrcode');
    const presetButton = document.getElementById('presetButton');
    const presetModal = document.getElementById('presetModal');
    const presetList = document.getElementById('presetList');
    const presentButton = document.getElementById('presentButton');
    const logOutput = document.getElementById('logOutput');
    const clearLogButton = document.getElementById('clearLogButton');

    let editor; // editor変数をトップレベルで宣言
    let emmetSnippets = {};
    // let p5ShowcaseWorks = []; // 作品データを格納する配列 (削除)

    $.getJSON('data/emmet_snippets.json')
        .done(data => {
            emmetSnippets = data;

            // emmetSnippetsの読み込みが完了したらCodeMirrorを初期化
            editor = CodeMirror.fromTextArea(codeEditor, {
                mode: 'p5js',
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                indentWithTabs: false,
                theme: 'default',
                autoCloseBrackets: true, // 自動括弧補完を有効にする
                extraKeys: {
                    'Tab': function(cm) { // TabキーでのEmmet風スニペット展開
                        const cursor = cm.getCursor();
                        const line = cm.getLine(cursor.line);
                        const token = cm.getTokenAt(cursor);
                        const word = token.string.trim(); // 空白を除去

                        // 最も長くマッチするスニペットを見つける (部分マッチ対応)
                        let bestMatchKey = '';
                        for (const snippetKey in emmetSnippets) {
                            if (snippetKey.toLowerCase().startsWith(word.toLowerCase()) && snippetKey.length > bestMatchKey.length) {
                                bestMatchKey = snippetKey;
                            }
                        }

                        if (bestMatchKey) {
                            // 現在の単語をスニペットで置き換え
                            cm.replaceRange(emmetSnippets[bestMatchKey], { line: cursor.line, ch: token.start }, cursor);
                        } else {
                            // Emmetスニペットにマッチしない場合は、通常のタブ動作
                            cm.execCommand('indentMore');
                        }
                    },
                    'Shift-Tab': 'indentLess',
                    // Ctrl-Space (Mac) または Cmd-Space (Win) で補完をトリガー
                    'Ctrl-Space': 'autocomplete',
                    'Cmd-Space': 'autocomplete'
                },
                // 自動補完設定
                hintOptions: {
                    hint: CodeMirror.hint.combined, // カスタムの統合補完機能を使用
                    completeSingle: false // 1つしか補完候補がない場合でも自動補完しない
                }
            });

            // URLからコードを読み込む処理をCodeMirror初期化後に移動
            const urlParams = new URLSearchParams(window.location.search);
            const initialCode = urlParams.get('code');
            if (initialCode) {
                try {
                    const decodedCode = decodeURIComponent(atob(initialCode));
                    editor.setValue(decodedCode);
                    editor.refresh(); // CodeMirrorをリフレッシュ
                } catch (e) {
                    console.error('Invalid code in URL', e);
                }
            }

            // グローバルスコープにeditorを公開 (必要であれば)
            window.editor = editor;

            // カスタム補完（Emmet風スニペット、p5.jsキーワード、JavaScriptデフォルト補完）の統合
            CodeMirror.defineHint('combined', function(cm) {
                const cursor = cm.getCursor();
                const token = cm.getTokenAt(cursor);
                const currentWord = token.string.trim(); // 空白を除去
                const hints = [];

                console.log('currentWord:', currentWord);
                console.log('emmetSnippets:', emmetSnippets);

                // Emmet風スニペットを補完候補に追加
                for (const snippetKey in emmetSnippets) {
                    // 大文字小文字を区別せず部分マッチ
                    if (snippetKey.toLowerCase().startsWith(currentWord.toLowerCase()) && snippetKey !== currentWord) { 
                        hints.push({
                            text: snippetKey,
                            displayText: snippetKey + ' (Snippet)',
                            render: function(elt, data, cur) {
                                elt.textContent = cur.displayText;
                            },
                            hint: function(cm, self, data) {
                                cm.replaceRange(emmetSnippets[cur.text], data.from, data.to);
                            }
                        });
                    }
                }

                console.log('Emmet Hints after filtering:', hints);

                // p5.jsのキーワードを補完候補に追加 (emmetSnippetsから重複を避ける)
                // CodeMirror.modes.p5js.overlay.p5Keywordsが存在するか確認
                if (CodeMirror.modes.p5js && CodeMirror.modes.p5js.overlay && CodeMirror.modes.p5js.overlay.p5Keywords) {
                    const p5Keywords = Object.keys(CodeMirror.modes.p5js.overlay.p5Keywords);
                    p5Keywords.forEach(keyword => {
                        if (keyword.toLowerCase().startsWith(currentWord.toLowerCase()) && !emmetSnippets[keyword] && keyword !== currentWord) {
                            hints.push(keyword);
                        }
                    });
                }

                console.log('P5 Keywords Hints after filtering:', hints);

                // CodeMirrorのデフォルトのJavaScript補完候補も取得
                const jsHints = CodeMirror.hint.javascript(cm);
                if (jsHints && jsHints.list) {
                    jsHints.list.forEach(item => {
                        const itemText = typeof item === 'string' ? item : item.text;
                        if (itemText.toLowerCase().startsWith(currentWord.toLowerCase()) && !emmetSnippets[itemText] && !(CodeMirror.modes.p5js && CodeMirror.modes.p5js.overlay && CodeMirror.modes.p5js.overlay.p5Keywords && CodeMirror.modes.p5js.overlay.p5Keywords[itemText]) && itemText !== currentWord) {
                            hints.push(item);
                        }
                    });
                }

                console.log('All Hints before sorting:', hints);

                // 補完候補を表示
                return {
                    list: hints.sort((a, b) => {
                        const aText = typeof a === 'string' ? a : a.text;
                        const bText = typeof b === 'string' ? b : b.text;
                        return aText.localeCompare(bText);
                    }), // アルファベット順にソート
                    from: CodeMirror.Pos(cursor.line, token.start),
                    to: CodeMirror.Pos(cursor.line, token.end)
                };
            });

        })
        .fail((jqxhr, textStatus, error) => console.error('Error loading emmet_snippets.json:', textStatus, error));

    // コード実行機能
    $(runButton).on('click', () => {
        const code = editor.getValue();
        // Blobのコンストラクタに空の配列を渡すとエラーになるため、空の場合は処理しない
        if (!code.trim()) {
            alert('コードが空です。何かコードを書いてください。');
            return;
        }

        // ログ出力のクリア
        $(logOutput).empty();

        const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>p5.js Output</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.dom.min.js"></script>
</head>
<body>
    <script>
        // コンソールログを親ウィンドウに転送する
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog(...args);
            window.parent.postMessage({ type: 'log', message: args.map(arg => String(arg)).join(' ') }, '*');
        };
        console.error = (...args) => {
            originalError(...args);
            window.parent.postMessage({ type: 'error', message: args.map(arg => String(arg)).join(' ') }, '*');
        };
        console.warn = (...args) => {
            originalWarn(...args);
            window.parent.postMessage({ type: 'warn', message: args.map(arg => String(arg)).join(' ') }, '*');
        };

        ${code}
    </script>
</body>
</html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        $(outputFrame).attr('src', URL.createObjectURL(blob));
    });

    // 発表モード機能
    $(presentButton).on('click', () => {
        const code = editor.getValue();
        if (!code.trim()) {
            alert('コードが空です。発表モードで表示するコードがありません。');
            return;
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>p5.js 発表モード</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.dom.min.js"></script>
</head>
<body>
    <script>
        ${code}
    </script>
</body>
</html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);

        // 新しいウィンドウで全画面表示
        const newWindow = window.open(blobUrl, '_blank');
        if (newWindow) {
            newWindow.focus();
        } else {
            alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
        }
    });

    // コード保存機能 (File System Access API)
    async function saveFile() {
        try {
            const code = editor.getValue();
            const fileHandle = await window.showSaveFilePicker({
                types: [{
                    description: 'p5.js Sketch',
                    accept: {'text/javascript': ['.js']},
                }],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(code);
            await writable.close();
            alert('ファイルを保存しました！');
        } catch (error) {
            if (error.name === 'AbortError') {
                alert('ファイルの保存がキャンセルされました。');
            } else {
                console.error('ファイル保存エラー:', error);
                alert('ファイルの保存に失敗しました: ' + error.message);
            }
        }
    }

    // コード読み込み機能 (File System Access API)
    async function loadFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'p5.js Sketch',
                    accept: {'text/javascript': ['.js']},
                }],
                multiple: false,
            });
            const file = await fileHandle.getFile();
            const code = await file.text();
            editor.setValue(code);
            alert('ファイルを読み込みました！');
        } catch (error) {
            if (error.name === 'AbortError') {
                alert('ファイルの読み込みがキャンセルされました。');
            } else {
                console.error('ファイル読み込みエラー:', error);
                alert('ファイルの読み込みに失敗しました: ' + error.message);
            }
        }
    }

    // コード保存機能 (localStorageを保持)
    $(saveButton).on('click', () => {
        // File System Access APIが利用可能ならそちらを使う
        if ('showSaveFilePicker' in window) {
            saveFile();
        } else {
            // フォールバック: localStorageに保存
            const code = editor.getValue();
            localStorage.setItem('p5js_kid_editor_code', code);
            alert('コードがブラウザに保存されました！\n(このブラウザではファイル保存機能が利用できません)');
        }
    });

    // コード読み込み機能 (localStorageを保持)
    $(loadButton).on('click', () => {
        // File System Access APIが利用可能ならそちらを使う
        if ('showOpenFilePicker' in window) {
            loadFile();
        } else {
            // フォールバック: localStorageから読み込み
            const savedCode = localStorage.getItem('p5js_kid_editor_code');
            if (savedCode) {
                editor.setValue(savedCode);
                alert('コードをブラウザから読み込みました！\n(このブラウザではファイル読み込み機能が利用できません)');
            } else {
                alert('ブラウザに保存されたコードが見つかりませんでした。');
            }
        }
    });

    // jBoxのインスタンスをトップレベルで宣言
    let presetjBox;
    // let p5InfojBox; // 新しいjBoxインスタンス (削除)
    // let referencejBox; // jBoxでのリファレンスモーダル削除のためコメントアウト

    // プリセットコード機能
    $(presetButton).on('click', () => {
        if (!presetjBox) {
            presetjBox = new jBox('Modal', {
                width: 700,
                height: 500,
                title: 'プリセットコード',
                content: $('#presetModal'),
                overlay: true,
                closeButton: 'box',
                onOpen: function() {
                    displayPresets();
                }
            });
        }
        presetjBox.open();
    });

    // リファレンス機能
    // jBoxを使用しないため、このロジックを以前の直接DOM操作に戻す
    // let referencejBox;
    $(referenceButton).on('click', () => {
        // if (!referencejBox) {
        //     referencejBox = new jBox('Modal', {
        //         width: 1000,
        //         height: 600,
        //         title: 'p5.js リファレンス',
        //         content: $('#referenceModal'),
        //         overlay: true,
        //         closeButton: 'box',
        //         onOpen: function() {
        //             // iframeの内容をリロードしたい場合はここに記述
        //             // $('#referenceFrame').attr('src', $('#referenceFrame').attr('src'));
        //         }
        //     });
        // }
        // referencejBox.open();
        $(referenceModal).removeClass('hidden').addClass('fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center');
    });

    // リファレンスデータの読み込みと表示 (再統合)
    let p5Reference = {};
    $.getJSON('data/p5_reference.json')
        .done(data => {
            p5Reference = data;
            displayReferenceSidebar();

            const firstCategoryKey = Object.keys(p5Reference)[0];
            if (firstCategoryKey && Object.keys(p5Reference[firstCategoryKey].items).length > 0) {
                const firstItemKey = Object.keys(p5Reference[firstCategoryKey].items)[0];
                displayReferenceItem(firstCategoryKey, firstItemKey);
            }
        })
        .fail((jqxhr, textStatus, error) => console.error('Error loading p5_reference.json:', textStatus, error));

    function displayReferenceSidebar() {
        const referenceSidebar = $('#referenceSidebar');
        referenceSidebar.empty();
        for (const categoryKey in p5Reference) {
            const category = p5Reference[categoryKey];
            const categoryHtml = $('<div class="mb-4"></div>');
            categoryHtml.append(`<h3 class="text-lg font-bold text-pink-600 mb-2">${category.category_name}</h3>`);
            categoryHtml.append(`<p class="text-sm text-gray-600 mb-2">${category.description}</p>`);
            categoryHtml.append('<hr class="my-2 border-gray-300">');

            const itemList = $('<ul></ul>');
            for (const itemKey in category.items) {
                const item = category.items[itemKey];
                itemList.append(`<li><button class="text-blue-500 hover:text-blue-700 text-sm py-1 px-2 text-left w-full" data-category="${categoryKey}" data-item="${itemKey}">${item.name}</button></li>`);
            }
            categoryHtml.append(itemList);
            referenceSidebar.append(categoryHtml);
        }

        // サイドバーの項目クリックイベント
        referenceSidebar.on('click', 'button', (event) => {
            const categoryKey = $(event.target).data('category');
            const itemKey = $(event.target).data('item');
            displayReferenceItem(categoryKey, itemKey);
        });
    }

    function displayReferenceItem(categoryKey, itemKey) {
        const referenceContent = $('#referenceContent');
        const category = p5Reference[categoryKey];
        if (!category) {
            referenceContent.html(`<p>${categoryKey} カテゴリが見つかりませんでした。</p>`);
            return;
        }
        const item = category.items[itemKey];
        if (item) {
            referenceContent.html(`
                <h3 class="text-2xl font-bold text-green-600 mb-4">${item.name}</h3>
                <p class="text-gray-700 mb-4">${item.description}</p>
                <h4 class="text-xl font-semibold text-gray-800 mb-2">使い方:</h4>
                <pre class="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm mb-4"><code>${item.syntax}</code></pre>
                <h4 class="text-xl font-semibold text-gray-800 mb-2">引数と説明:</h4>
                <p class="text-gray-700 whitespace-pre-wrap">${item.syntax_description}</p>
            `);
        } else {
            referenceContent.html(`<p>${itemKey} のリファレンスは見つかりませんでした。</p>`);
        }
    }

    // モーダルを閉じるためのイベントリスナー (以前のjBoxの代わりに直接DOM操作)
    // jBoxが自動で閉じるボタンを提供するため、closeButtonは不要だが、モーダル自体を閉じるロジックは必要
    $('#referenceModal').on('click', (event) => {
        if ($(event.target).hasClass('bg-opacity-60') || $(event.target).closest('.close-button').length) { // overlayクリックまたはcloseButtonクリック
            $('#referenceModal').addClass('hidden').removeClass('fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center');
        }
    });

    // プリセットデータの読み込みと表示
    let presets = [];
    $.getJSON('data/presets.json')
        .done(data => {
            console.log('Presets loaded successfully:', data);
            presets = data;
            // ここでdisplayPresets()を呼び出す
            // displayPresets(); はpresetjBoxのonOpenイベントで呼び出すため、ここでは不要
        })
        .fail((jqxhr, textStatus, error) => console.error('Error loading presets.json:', textStatus, error));

    function displayPresets() {
        console.log('displayPresets() called.');
        console.log('Current presets data:', presets);
        $(presetList).empty();
        if (presets.length === 0) {
            $(presetList).append('<p class="text-gray-600">プリセットが見つかりませんでした。</p>');
            return;
        }
        presets.forEach((preset, index) => {
            const presetItem = $('<div>').addClass('preset-item').html(`
                <h3 class="text-lg font-bold">${preset.name}</h3>
                <p class="text-gray-600 mb-2">${preset.description}</p>
                <button data-index="${index}" class="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-1 px-3 rounded-md transition duration-200 ease-in-out">使う</button>
            `);
            $(presetList).append(presetItem);
        });

        $(presetList).find('.preset-item button').on('click', (event) => {
            const index = $(event.target).data('index');
            editor.setValue(presets[index].code);
            presetjBox.close();
        });
    }

    // 作品データの読み込みと表示 (削除)
    // $.getJSON('data/showcase_works.json')
    //     .done(data => {
    //         console.log('Showcase works loaded successfully:', data);
    //         p5ShowcaseWorks = data;
    //     })
    //     .fail((jqxhr, textStatus, error) => console.error('Error loading showcase_works.json:', textStatus, error));

    // function displayShowcaseWorks() {
    //     console.log('displayShowcaseWorks() called.');
    //     console.log('Current showcase works data:', p5ShowcaseWorks);
    //     $(p5ShowcaseList).empty();
    //     if (p5ShowcaseWorks.length === 0) {
    //         $(p5ShowcaseList).append('<p class="text-gray-600">作品が見つかりませんでした。</p>');
    //         return;
    //     }
    //     p5ShowcaseWorks.forEach((work, index) => {
    //         const workItem = $('<div>').addClass('showcase-item bg-gray-100 p-4 rounded-lg shadow-inner').html(`
    //             <h4 class="text-xl font-semibold text-gray-800 mb-2">${work.name}</h4>
    //             <p class="text-sm text-gray-600 mt-2">${work.description}</p>
    //             <button data-index="${index}" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md transition duration-200 ease-in-out">エディタで開く</button>
    //         `);
    //         $(p5ShowcaseList).append(workItem);
    //     });

    //     $(p5ShowcaseList).find('.showcase-item button').on('click', (event) => {
    //         const index = $(event.target).data('index');
    //         editor.setValue(p5ShowcaseWorks[index].code);
    //         p5InfojBox.close();
    //     });
    // }

    // ログクリアボタンのイベントリスナー
    $(clearLogButton).on('click', () => {
        $(logOutput).empty();
    });

    // iframeからのメッセージ（ログ）を受信する
    window.addEventListener('message', (event) => {
        // 出元がoutputFrameからのメッセージであることを確認
        if (outputFrame.contentWindow === event.source) {
            const { type, message } = event.data;
            const logElement = $('<div>').text(message);
            if (type === 'error') {
                logElement.addClass('text-red-400');
            } else if (type === 'warn') {
                logElement.addClass('text-yellow-400');
            }
            $(logOutput).append(logElement);
            // 最新のログが表示されるようにスクロール
            logOutput.scrollTop = logOutput.scrollHeight;
        }
    });
});
