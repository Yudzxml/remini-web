const Rainway = require('rainway');

const peer = new Rainway.Peer();

peer.addEventListener("stream-announcement", async (ev) => {
    const stream = await ev.join();
    document.body.appendChild(stream.container);
});

async function startStream() {
    const stream = await peer.createStream({ permissions: Rainway.InputLevel.All });
    document.body.appendChild(stream.container);
}

startStream();