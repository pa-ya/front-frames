/* ============================================================
   highlight.js — tiny dependency-free syntax highlighter
   Supports: js, ts, py, go, rust, php, bash, json, sql, env, http
   ============================================================ */
(function () {
  "use strict";

  const KEYWORDS = {
    common: ["if","else","for","while","return","break","continue","in","of","new","try","catch","finally","throw","switch","case","default","do","class","extends","import","export","from","as","async","await","yield","this","super","null","true","false","void","typeof","instanceof"],
    ts: ["const","let","var","function","interface","type","enum","implements","public","private","protected","readonly","static","abstract","declare","namespace","keyof","infer","satisfies","get","set","constructor"],
    js: ["const","let","var","function","get","set","constructor"],
    py: ["def","lambda","pass","None","True","False","and","or","not","is","elif","with","global","nonlocal","assert","del","raise","except","finally","import","from","as","class","async","await","return","yield","match"],
    go: ["func","package","var","const","type","struct","interface","map","chan","go","defer","select","range","fallthrough","goto","nil","make","append","len","cap","string","int","int64","bool","byte","rune","error","float64","uint"],
    rust: ["fn","let","mut","const","struct","enum","impl","trait","pub","use","mod","match","move","ref","dyn","where","unsafe","async","await","self","Self","crate","super","loop","Some","None","Ok","Err","Option","Result","Box","Vec","String","str","usize","i32","u32","i64","u64","bool"],
    php: ["function","public","private","protected","static","const","namespace","use","class","interface","trait","extends","implements","abstract","final","new","echo","print","fn","match","readonly","enum","array","null","true","false","self","parent","require","include"],
    bash: ["echo","cd","export","source","sudo","then","fi","do","done","in","function","local","if","else","elif","for","while","case","esac"],
    sql: ["SELECT","FROM","WHERE","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","ALTER","DROP","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP","BY","ORDER","LIMIT","OFFSET","AND","OR","NOT","NULL","PRIMARY","KEY","FOREIGN","REFERENCES","INDEX","DEFAULT","RETURNING","AS","DISTINCT","COUNT"],
    dart: ["abstract","as","async","await","class","const","covariant","default","deferred","dynamic","enum","export","extends","extension","external","factory","final","finally","for","get","if","else","implements","import","in","is","late","library","mixin","new","null","on","operator","part","required","rethrow","return","sealed","set","show","static","super","switch","case","sync","this","throw","try","typedef","var","void","while","with","yield","true","false","Future","Stream","Widget","build","override"],
    solidity: ["pragma","solidity","contract","interface","library","function","modifier","event","struct","enum","mapping","address","uint","uint256","uint8","int","int256","bool","string","bytes","bytes32","public","private","internal","external","pure","view","payable","virtual","override","returns","return","memory","storage","calldata","constant","immutable","constructor","emit","require","revert","assert","if","else","for","while","new","import","using","is","this","msg","block","tx","indexed","receive","fallback","unchecked","try","catch","abstract","type"],
    cpp: ["auto","bool","char","class","const","constexpr","delete","do","double","else","enum","explicit","extern","false","float","for","friend","if","inline","int","long","mutable","namespace","new","noexcept","nullptr","operator","private","protected","public","register","return","short","signed","sizeof","static","static_cast","reinterpret_cast","dynamic_cast","const_cast","struct","switch","template","this","throw","true","try","typedef","typename","union","unsigned","using","virtual","void","volatile","while","case","break","continue","default","catch","override","final","decltype","uint8_t","uint16_t","uint32_t","uint64_t","int8_t","int16_t","int32_t","int64_t","size_t","std","string","vector","include","define","emscripten","val","EMSCRIPTEN_KEEPALIVE","EMSCRIPTEN_BINDINGS"],
  };

  const LANG_SET = {
    js:  new Set([...KEYWORDS.common, ...KEYWORDS.js]),
    jsx: new Set([...KEYWORDS.common, ...KEYWORDS.js]),
    ts:  new Set([...KEYWORDS.common, ...KEYWORDS.ts]),
    tsx: new Set([...KEYWORDS.common, ...KEYWORDS.ts]),
    dart: new Set([...KEYWORDS.common, ...KEYWORDS.dart]),
    solidity: new Set([...KEYWORDS.common, ...KEYWORDS.solidity]),
    sol: new Set([...KEYWORDS.common, ...KEYWORDS.solidity]),
    cpp: new Set([...KEYWORDS.common, ...KEYWORDS.cpp]),
    "c++": new Set([...KEYWORDS.common, ...KEYWORDS.cpp]),
    c:   new Set([...KEYWORDS.common, ...KEYWORDS.cpp]),
    py:  new Set([...KEYWORDS.py, "self","cls","print","str","int","float","dict","list","bool","tuple","set","range"]),
    python: new Set([...KEYWORDS.py, "self","cls"]),
    go:  new Set(KEYWORDS.go),
    rust: new Set(KEYWORDS.rust),
    rs:  new Set(KEYWORDS.rust),
    php: new Set([...KEYWORDS.php, ...KEYWORDS.common.filter(k=>!["this","super"].includes(k))]),
    bash: new Set(KEYWORDS.bash),
    sh:  new Set(KEYWORDS.bash),
    sql: new Set(KEYWORDS.sql.map(k=>k.toLowerCase()).concat(KEYWORDS.sql)),
  };

  const HASH_COMMENT = new Set(["py","python","bash","sh","env","yaml","toml","ruby","elixir","dockerfile","http","properties","cmake","perl","r","makefile","gitignore"]);
  const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  function highlight(code, lang) {
    lang = (lang || "").toLowerCase();
    if (lang === "text" || lang === "plain" || lang === "") return esc(code);
    const kw = LANG_SET[lang] || new Set([...KEYWORDS.common]);
    const hashComment = HASH_COMMENT.has(lang);

    // token master regex — order = priority
    const parts = [
      "(?<block>/\\*[\\s\\S]*?\\*/)",                          // block comment
      hashComment ? "(?<hash>#.*)" : null,                     // # comment
      "(?<line>//.*)",                                         // // comment
      "(?<tstr>\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?''')",      // triple string (py)
      "(?<str>\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|`(?:\\\\.|[^`\\\\])*`)", // string
      "(?<attr>#\\[[^\\]]*\\]|@[A-Za-z_][\\w.]*)",            // rust attr / decorator
      "(?<num>\\b\\d[\\d_]*\\.?\\d*(?:[eE][+-]?\\d+)?\\b)",   // number
      "(?<var>\\$[A-Za-z_]\\w*)",                              // php/bash var
      "(?<fn>[A-Za-z_]\\w*(?=\\s*\\())",                      // function call
      "(?<id>[A-Za-z_]\\w*)",                                  // identifier
      "(?<ws>\\s+)",
      "(?<other>[^\\s\\w])",
    ].filter(Boolean);

    const re = new RegExp(parts.join("|"), "g");
    let out = "", m;
    while ((m = re.exec(code)) !== null) {
      const g = m.groups;
      if (g.block || g.line || g.hash) { out += `<span class="tok-com">${esc(m[0])}</span>`; }
      else if (g.tstr) { out += `<span class="tok-str">${esc(m[0])}</span>`; }
      else if (g.str) { out += `<span class="tok-str">${esc(m[0])}</span>`; }
      else if (g.attr) { out += `<span class="tok-fn">${esc(m[0])}</span>`; }
      else if (g.num) { out += `<span class="tok-num">${esc(m[0])}</span>`; }
      else if (g.var) { out += `<span class="tok-var">${esc(m[0])}</span>`; }
      else if (g.fn) {
        const w = m[0];
        if (kw.has(w)) out += `<span class="tok-kw">${esc(w)}</span>`;
        else out += `<span class="tok-fn">${esc(w)}</span>`;
      }
      else if (g.id) {
        const w = m[0];
        if (kw.has(w)) out += `<span class="tok-kw">${esc(w)}</span>`;
        else if (/^[A-Z]/.test(w)) out += `<span class="tok-type">${esc(w)}</span>`;
        else out += esc(w);
      }
      else { out += esc(m[0]); }
    }
    return out;
  }

  window.Highlight = highlight;
})();
