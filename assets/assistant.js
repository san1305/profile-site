/* Sanu Dutta — AI assistant widget.
   Floating chat that answers recruiter questions and points to the Calendly booking.
   Talks to the /api/chat serverless function (which holds the API key server-side).
   Set window.SANU_CONFIG in assets/config.js (endpoint + calendly URL). */
(function () {
  "use strict";

  var CFG = window.SANU_CONFIG || {};
  var ENDPOINT = CFG.chatEndpoint || "/api/chat";
  var CALENDLY = CFG.calendlyUrl || "";

  // ---- styles ----
  var css = `
  .sd-fab{position:fixed;right:22px;bottom:22px;z-index:9999;display:flex;align-items:center;gap:10px;
    background:linear-gradient(135deg,#c8a04e,#a5813a);color:#0a1526;border:none;cursor:pointer;
    padding:13px 18px;border-radius:40px;font-weight:700;font-size:14.5px;font-family:inherit;
    box-shadow:0 10px 30px rgba(200,160,78,.45);transition:transform .2s ease;}
  .sd-fab:hover{transform:translateY(-3px);}
  .sd-fab svg{width:20px;height:20px;}
  .sd-panel{position:fixed;right:22px;bottom:22px;z-index:10000;width:380px;max-width:calc(100vw - 32px);
    height:560px;max-height:calc(100vh - 40px);background:#0f1f38;border:1px solid rgba(200,160,78,.3);
    border-radius:18px;box-shadow:0 30px 70px rgba(10,21,38,.55);display:none;flex-direction:column;overflow:hidden;
    font-family:inherit;}
  .sd-panel.open{display:flex;animation:sdpop .25s ease;}
  @keyframes sdpop{from{opacity:0;transform:translateY(18px) scale(.98);}to{opacity:1;transform:none;}}
  .sd-head{background:linear-gradient(135deg,#16294a,#0a1526);padding:16px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(200,160,78,.2);}
  .sd-head .sd-av{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#c8a04e,#a5813a);display:grid;place-items:center;color:#0a1526;font-weight:700;font-family:Georgia,serif;}
  .sd-head b{color:#fff;font-size:15px;display:block;}
  .sd-head span{color:#94a3b8;font-size:12px;}
  .sd-x{margin-left:auto;background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1;}
  .sd-x:hover{color:#fff;}
  .sd-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px;}
  .sd-msg{max-width:85%;padding:11px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;}
  .sd-bot{background:rgba(255,255,255,.06);color:#e2e8f0;border:1px solid rgba(255,255,255,.08);align-self:flex-start;border-bottom-left-radius:4px;}
  .sd-user{background:linear-gradient(135deg,#c8a04e,#a5813a);color:#0a1526;align-self:flex-end;border-bottom-right-radius:4px;font-weight:500;}
  .sd-typing{align-self:flex-start;color:#94a3b8;font-size:13px;padding:4px 6px;}
  .sd-quick{display:flex;flex-wrap:wrap;gap:7px;padding:0 18px 10px;}
  .sd-chip{background:rgba(200,160,78,.12);border:1px solid rgba(200,160,78,.3);color:#e0c078;font-size:12px;
    padding:6px 11px;border-radius:40px;cursor:pointer;}
  .sd-chip:hover{background:rgba(200,160,78,.22);}
  .sd-foot{border-top:1px solid rgba(255,255,255,.08);padding:12px;display:flex;gap:8px;}
  .sd-foot input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:10px;
    padding:11px 13px;color:#fff;font-size:14px;font-family:inherit;}
  .sd-foot input:focus{outline:none;border-color:#c8a04e;}
  .sd-send{background:#c8a04e;border:none;border-radius:10px;width:44px;cursor:pointer;color:#0a1526;font-size:18px;}
  .sd-send:hover{background:#e0c078;}
  .sd-book{display:block;margin:2px 18px 12px;text-align:center;background:#c8a04e;color:#0a1526;font-weight:700;
    padding:11px;border-radius:10px;text-decoration:none;font-size:14px;}
  .sd-book:hover{background:#e0c078;}
  @media(max-width:480px){.sd-panel{right:8px;bottom:8px;}}
  `;
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- markup ----
  var fab = document.createElement("button");
  fab.className = "sd-fab";
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Ask my AI assistant';
  document.body.appendChild(fab);

  var panel = document.createElement("div");
  panel.className = "sd-panel";
  panel.innerHTML =
    '<div class="sd-head"><div class="sd-av">SD</div><div><b>Sanu\'s Assistant</b><span>Ask about experience or book a meeting</span></div><button class="sd-x" aria-label="Close">&times;</button></div>' +
    '<div class="sd-body" id="sdBody"></div>' +
    '<div class="sd-quick" id="sdQuick"></div>' +
    (CALENDLY ? '<a class="sd-book" href="' + CALENDLY + '" target="_blank" rel="noopener">📅 Book a meeting with Sanu</a>' : "") +
    '<div class="sd-foot"><input id="sdInput" type="text" placeholder="Type your message…" autocomplete="off"/><button class="sd-send" id="sdSend" aria-label="Send">➤</button></div>';
  document.body.appendChild(panel);

  var body = panel.querySelector("#sdBody");
  var input = panel.querySelector("#sdInput");
  var quick = panel.querySelector("#sdQuick");
  var history = [];
  var greeted = false;

  var QUICK = [
    "What are Sanu's key deals?",
    "Is he open to remote roles?",
    "Tell me about his automation work",
    "I'd like to schedule a call",
  ];

  function addMsg(role, text) {
    var d = document.createElement("div");
    d.className = "sd-msg " + (role === "user" ? "sd-user" : "sd-bot");
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  function renderQuick() {
    quick.innerHTML = "";
    QUICK.forEach(function (q) {
      var c = document.createElement("button");
      c.className = "sd-chip";
      c.textContent = q;
      c.onclick = function () { send(q); };
      quick.appendChild(c);
    });
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    addMsg("bot", "Hi! I'm Sanu's assistant. I can tell you about his 13 years in infrastructure & project finance modelling, walk you through his key deals, or help you book a meeting. What brings you here?");
    renderQuick();
  }

  function toggle(open) {
    panel.classList.toggle("open", open);
    fab.style.display = open ? "none" : "flex";
    if (open) { greet(); input.focus(); }
  }

  fab.onclick = function () { toggle(true); };
  panel.querySelector(".sd-x").onclick = function () { toggle(false); };

  async function send(text) {
    text = (text || input.value).trim();
    if (!text) return;
    input.value = "";
    quick.innerHTML = "";
    addMsg("user", text);
    history.push({ role: "user", content: text });

    var typing = document.createElement("div");
    typing.className = "sd-typing";
    typing.textContent = "Sanu's assistant is typing…";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    try {
      var r = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      typing.remove();
      var data = await r.json();
      if (!r.ok || data.error) {
        addMsg("bot", "Sorry, the assistant isn't available right now. Please email sanu.dutta1305@gmail.com" + (CALENDLY ? " or use the Book a meeting button above." : "."));
        return;
      }
      addMsg("bot", data.reply);
      history.push({ role: "assistant", content: data.reply });
    } catch (e) {
      typing.remove();
      addMsg("bot", "Connection issue — please email sanu.dutta1305@gmail.com directly.");
    }
  }

  panel.querySelector("#sdSend").onclick = function () { send(); };
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
})();
