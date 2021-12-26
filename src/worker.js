/**
 * @typedef {import("@cloudflare/workers-types")}
 */

/**
 *
 * @param {string} jsonString
 */

// /**
//  *
//  * @param {ReadableStream} stream
//  * @returns
//  */
// function streamToString(stream) {
//   const chunks = [];
//   return new Promise((resolve, reject) => {
//     stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
//     stream.on("error", (err) => reject(err));
//     stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
//   });
// }

/**
 *
 * @param {URL} url
 * @returns {Promise<Response>}
 */
async function getRequest(url) {
  const requestedJSON = url.pathname.replace("/", "");
  if (requestedJSON === "") {
    return new Response(
      {
        error: {
          message: "you need to provide a path to request a json",
        },
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const jsonString = await KVStore.get("zaData");
  if (!jsonString) {
    return new Response(
      JSON.stringify({
        error: { message: `no json found with name ${requestedJSON}` },
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response(jsonString, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 *
 * @param {URL} url
 * @param {any} body
 * @returns {Promise<Response>}
 */
async function postRequest(url, body) {
  const { searchParams } = url;
  const jsonKey = searchParams.get("key");
  console.log(jsonKey);
  const jsonString = JSON.stringify(body);
  await KVStore.put(jsonKey, jsonString);

  return new Response(JSON.stringify({ success: true, data: body }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const { headers } = request;
  const contentType = headers.get("content-type") || "";

  if (contentType !== "application/json") {
    return new Response(
      JSON.stringify({
        error: {
          message:
            "Body must be of content-type application/json. Check data or headers",
        },
      })
    );
  }

  const body = await request.json();
  if (request.method === "POST") {
    const postResponse = postRequest(url, body);
    return postResponse;
  }
  const getResponse = getRequest(url);
  return getResponse;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
