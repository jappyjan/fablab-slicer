// Syntax taken from
// https://github.com/MattMorgis/async-stream-generator
// itself taken from
// https://nextjs.org/docs/app/building-your-application/routing/router-handlers#streaming
// probably itself taken from

import { createReadStream, ReadStream } from "fs";
import { stat } from "fs/promises";
import { basename } from "path";

// https://nodejs.org/api/stream.html
async function* nodeStreamToIterator(stream: ReadStream) {
  for await (const chunk of stream) {
    yield new Uint8Array(chunk);
  }
}

function iteratorToStream(iterator: AsyncIterator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

function streamFile(path: string): ReadableStream {
  const nodeStream = createReadStream(path);
  const data: ReadableStream = iteratorToStream(
    nodeStreamToIterator(nodeStream)
  );
  return data;
}

export async function nextStreamFile(filePath: string): Promise<Response> {
  const stats = await stat(filePath);
  const stream: ReadableStream = streamFile(filePath);
  return new Response(stream, {
    status: 200,
    headers: new Headers({
      "content-disposition": `attachment; filename=${basename(filePath)}`,
      "content-type": "application/zip",
      "content-length": stats.size + "",
    }),
  });
}
