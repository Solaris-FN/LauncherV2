import WebSocket from "@tauri-apps/plugin-websocket";
import { endpoints } from "../config/endpoints";
import { Message } from "@tauri-apps/plugin-websocket";

export const createXMPP = async (token: string, accountId: string, displayName: string) => {
  let jid = "";
  let loggedIn = false;
  let isInitialized = false;
  let isBound = false;
  let isPresenceSent = false;

  const hex = (digits: number): string => {
    const buffer = new Uint8Array(digits / 2);
    window.crypto.getRandomValues(buffer);
    let result = Array.from(buffer)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    if (digits % 2 === 0) return result;
    return result + Math.floor(Math.random() * 16).toString(16);
  };

  const wsUrl =
    endpoints.CONNECT_XMPP_URL.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://") +
    "/ws";

  const domain = (): string => {
    try {
      const urlObj = new URL(endpoints.CONNECT_XMPP_URL);
      return urlObj.hostname;
    } catch (e) {
      let hostname = endpoints.CONNECT_XMPP_URL.replace(/^https?:\/\//, "")
        .replace(/^wss?:\/\//, "")
        .split("/")[0];

      hostname = hostname.split(":")[0];

      return hostname;
    }
  };

  let ws = await WebSocket.connect(wsUrl);

  await ws.send(
    `<open xmlns='urn:ietf:params:xml:ns:xmpp-framing' to='${domain()}' version='1.0'/>`
  );

  ws.addListener(async (msg: Message) => {
    await onMessage(msg, ws);
  });

  const onMessage = async (msg: Message, ws: WebSocket) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(msg.data as any, "text/xml");
    const name = doc.documentElement.nodeName;

    switch (name) {
      case "open":
        isInitialized = true;
        break;

      case "stream:features":
        if (!isInitialized) return;

        try {
          const mechanisms = Array.from(doc.getElementsByTagName("mechanism")).map(
            (m) => m.textContent
          );

          if (mechanisms.includes("PLAIN")) {
            const authString = btoa(`\0${accountId}\0${token}`);

            await ws.send(
              `<auth mechanism="PLAIN" xmlns="urn:ietf:params:xml:ns:xmpp-sasl">${authString}</auth>`
            );
          }
        } catch (e) {
          console.error("Error during XMPP auth:", e);
        }
        break;

      case "success":
        await ws.send(
          `<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="${domain()}" version="1.0"/>`
        );

        if (!isBound) {
          const resourceId = `V2:c:WIN::${hex(32)}`;

          await ws.send(
            `<iq id="_xmpp_bind1" type="set"><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"><resource>${resourceId}</resource></bind></iq>`
          );
          isBound = true;
        }
        break;

      case "stream:error":
        if (doc.documentElement.innerHTML.includes("Bad value of attribute 'to'")) {
          await ws.send(`<close xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>`);
          setTimeout(async () => {
            ws = await WebSocket.connect(wsUrl);
            await ws.send(
              `<stream:stream to='${domain()}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>`
            );
          }, 1000);
        }
        break;

      case "failure":
        const text = doc.documentElement.getElementsByTagName("text")[0]?.textContent;

        if (text?.includes("not-authorized") || text?.includes("credentials")) {
          console.error("Auth failed - invalid tokenstr");
        }
        break;

      case "iq":
        const type = doc.documentElement.getAttribute("type");
        const id = doc.documentElement.getAttribute("id");

        if (type === "result" && id === "_xmpp_bind1") {
          const bindElement = doc.getElementsByTagName("bind")[0];
          if (bindElement) {
            const jidElement = bindElement.getElementsByTagName("jid")[0];
            if (jidElement) {
              jid = jidElement.textContent || "";
            }
          }

          await ws.send(
            '<iq id="_xmpp_session1" type="set"><session xmlns="urn:ietf:params:xml:ns:xmpp-session"/></iq>'
          );
          loggedIn = true;

          await ws.send(
            `<presence><status>{"Status":"In the Solaris launcher","Properties":{"party.joininfodata.286331153_j":{"bIsPrivate":true, "sourceDisplayName": "${displayName}"}}, "bIsPlaying":false,"bIsJoinable":false,"bHasVoiceSupport":false}</status><delay stamp="${new Date().toISOString()}" xmlns="urn:xmpp:delay"/></presence>`
          );
          isPresenceSent = true;
        }
        break;

      case "presence":
        break;

      case "message":
        const from = doc.documentElement.getAttribute("from");
        const body = doc.getElementsByTagName("body")[0]?.textContent;
        if (body) {
          console.log(`Message from ${from}: ${body}`);
        }
        break;

      case "close":
        console.log("XMPP conn closed:", msg.data);
        loggedIn = false;
        isInitialized = false;
        isBound = false;
        isPresenceSent = false;
        break;

      default:
        console.warn("Unhandled XMPP stanza:", name);
    }
  };

  const ping = async () => {
    if (loggedIn && jid) {
      const server = jid.split("@")[1].split("/")[0];
      await ws.send(
        `<iq from="${jid}" to="${server}" id="ping_${Date.now()}" type="get"><ping xmlns="urn:xmpp:ping"/></iq>`
      );
    }
  };

  const interval = setInterval(ping, 30000);

  return {
    ws,
    jid: () => jid,
    isConnected: () => loggedIn && isPresenceSent,
    disconnect: () => {
      clearInterval(interval);
      try {
        ws.send(`<close xmlns='urn:ietf:params:xml:ns:xmpp-framing'/>`);
        setTimeout(() => ws.disconnect(), 500);
      } catch (e) {
        ws.disconnect();
      }
    },
  };
};
