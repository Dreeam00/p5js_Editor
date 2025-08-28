CodeMirror.defineMode("p5js", function(config, parserConfig) {
    const jsMode = CodeMirror.getMode(config, "javascript");

    const p5SystemVariables = {
        "width": true, "height": true, "displayWidth": true, "displayHeight": true,
        "windowWidth": true, "windowHeight": true, "mouseX": true, "mouseY": true,
        "pmouseX": true, "pmouseY": true, "key": true, "keyCode": true, "frameRate": true,
        "frameCount": true, "deltaTime": true, "focused": true, "isKeyPressed": true, "mouseIsPressed": true
    };

    const p5Functions = {
        // ライフサイクル関数
        "setup": true, "draw": true, "preload": true, "mouseClicked": true, "mousePressed": true, "mouseReleased": true,
        "mouseMoved": true, "mouseDragged": true, "keyPressed": true, "keyReleased": true, "keyTyped": true,
        "windowResized": true, "touchStarted": true, "touchMoved": true, "touchEnded": true,

        // 環境
        "createCanvas": true, "resizeCanvas": true, "noCanvas": true, "fullscreen": true, "pixelDensity": true,
        "displayDensity": true, "getURL": true, "getURLPath": true, "getURLParams": true,

        // 描画設定
        "background": true, "clear": true, "noFill": true, "fill": true, "noStroke": true, "stroke": true,
        "strokeWeight": true, "strokeCap": true, "strokeJoin": true, "erase": true, "noErase": true,
        "blendMode": true,

        // 色
        "colorMode": true, "alpha": true, "red": true, "green": true, "blue": true, "hue": true, "saturation": true,
        "brightness": true, "lerpColor": true,

        // シェイプ（2Dプリミティブ）
        "point": true, "line": true, "circle": true, "ellipse": true, "square": true, "rect": true, "triangle": true,
        "quad": true, "arc": true,

        // シェイプ（カスタム）
        "beginShape": true, "endShape": true, "vertex": true, "curveVertex": true, "bezierVertex": true,
        "quadraticVertex": true, "curve": true, "bezier": true,

        // 変換
        "translate": true, "rotate": true, "scale": true, "shearX": true, "shearY": true, "push": true, "pop": true,
        "applyMatrix": true, "resetMatrix": true,

        // 画像
        "loadImage": true, "image": true, "imageMode": true, "tint": true, "noTint": true, "createImage": true,
        "get": true, "set": true, "copy": true, "updatePixels": true, "loadPixels": true,

        // テキスト
        "loadFont": true, "textFont": true, "textSize": true, "textLeading": true, "textStyle": true,
        "textAlign": true, "textWidth": true, "textAscent": true, "textDescent": true, "text": true,

        // データ
        "loadJSON": true, "loadStrings": true, "loadTable": true, "loadXML": true, "httpGet": true, "httpPost": true,
        "httpDo": true, "createStringDict": true, "createNumberDict": true,

        // 数学
        "abs": true, "ceil": true, "constrain": true, "dist": true, "exp": true, "floor": true, "lerp": true,
        "log": true, "mag": true, "map": true, "max": true, "min": true, "norm": true, "pow": true,
        "round": true, "sq": true, "sqrt": true, "fract": true, "degrees": true, "radians": true,
        "sin": true, "cos": true, "tan": true, "asin": true, "acos": true, "atan": true, "atan2": true,
        "noise": true, "random": true, "randomGaussian": true, "noiseDetail": true, "noiseSeed": true,

        // 3D (p5.js WebGLモード用 - 一部のみ)
        "WEBGL": true, "normalMaterial": true, "specularMaterial": true, "shininess": true,
        "lights": true, "ambientLight": true, "directionalLight": true, "pointLight": true, "spotLight": true,
        "noLights": true, "camera": true, "perspective": true, "ortho": true, "frustum": true, "orbitControl": true,
        "box": true, "sphere": true, "cylinder": true, "cone": true, "ellipsoid": true, "torus": true,

        // その他のユーティリティ
        "print": true, "debugMode": true, "noLoop": true, "loop": true
    };

    const allP5Keywords = { ...p5SystemVariables, ...p5Functions };

    return CodeMirror.overlayMode(jsMode, {
        token: function(stream, state) {
            // p5.js システム変数の正規表現
            const p5SystemVariableRegex = new RegExp('\\b(?:' + Object.keys(p5SystemVariables).join('|') + ')\\b');
            if (stream.match(p5SystemVariableRegex)) {
                return "p5-system-variable";
            }

            // p5.js 関数の正規表現
            const p5FunctionRegex = new RegExp('\\b(?:' + Object.keys(p5Functions).join('|') + ')\\b');
            if (stream.match(p5FunctionRegex)) {
                return "p5-function";
            }

            stream.next();
            return null;
        },
        // js/script.jsから参照されるために、キーワードオブジェクトを返す
        p5Keywords: allP5Keywords // すべてのp5.jsキーワードをまとめて提供
    });
});
