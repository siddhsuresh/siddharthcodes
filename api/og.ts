import { ImageResponse } from "@vercel/og";
import type * as React from "react";

export const config = { runtime: "edge" };

const width = 1200;
const height = 630;

export default async function og(req: Request) {
  try {
    const url = new URL(req.url);
    const { post, stringifiedPost, token } = parseSearchParams(
      url.searchParams,
    );

    await assertTokenIsValid(stringifiedPost, token);

    console.log("returning ImageResponse for", stringifiedPost);

    return new ImageResponse(
      h(OgContainer, {
        children: [
          h(LeftSide, {
            children: [
              h(Title, { title: "siddharth.codes" }),
              h(Footer, { post }),
            ],
          }),
          h(RightSide, {
            children: [h(Illustration, { imageHref: post.img })],
          }),
        ],
      }),
      {
        width,
        height,
      },
    );
  } catch (err: unknown) {
    console.error(err);

    if (err instanceof HttpError) {
      return new Response(JSON.stringify({ message: err.message }), {
        status: err.status,
      });
    }

    const error = err instanceof Error ? err : new Error(String(err));

    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

function Illustration({
  imageHref,
}: {
  imageHref: string;
}) {
  imageHref = `https://${process.env.VERCEL_URL}${imageHref}`;

  return h("img", {
    tw: `w-full h-full`,
    src: imageHref,
    width: width / 2,
    height,
  });
}

function Title({ title }: { title: string }) {
  return h(
    "p",
    {
      tw: `
      text-2xl font-bold mb-0
      `,
    },
    title,
  );
}

function Footer({ post }: {post: Post }) {
  return h(
    "div",
    {
      tw: `
      flex flex-col
    `,
    },
    h(
      "h1",
      {
        tw: `
        text-4xl font-black text-left
        `,
      },
      post.title
    ),
    h(
      "p",
      {
        tw: `
        text-2xl font-bold text-left
        `,
      },
      `${post.readingTimeMinutes} min`,
    ),
    h("p", {}, `Published on ${post.date.toLocaleDateString("sv-SE")}`),
  );
}

function h<T extends React.ElementType<any>>(
  type: T,
  props: React.ComponentPropsWithRef<T>,
  ...children: React.ReactNode[]
) {
  return {
    type,
    key: "key" in props ? props.key : null,
    props: {
      ...props,
      children: children && children.length ? children : props.children,
    },
  };
}

type Post = {
  date: Date;
  title: string;
  readingTimeMinutes: number;
  img: string;
};

const SEPARATOR = "\t";
type SEPARATOR = typeof SEPARATOR;

// prettier-ignore
export type StringifiedPost = `${
  number /* timestamp */
}${SEPARATOR}${
  number /* reading time */
}${SEPARATOR}${
  string /* title */
}${SEPARATOR}${
  string /* picture */
}`;

export type OgFunctionSearchParams = {
  post: StringifiedPost;
  token?: string;
};

function parseSearchParams(searchParams: URLSearchParams) {
  const stringifiedPost = decodeURIComponent(
    searchParams.get("post") || "",
  ) as StringifiedPost;

  const postArray = stringifiedPost.split(SEPARATOR);

  if (postArray.length !== 4) {
    throw new HttpError("Missing required search params.", 400);
  }

  const post: Post = {
    date: new Date(Number(postArray[0])),
    readingTimeMinutes: Math.round(Number(postArray[1])),
    title: postArray[2]!,
    img: postArray[3]!,
  };

  return {
    post,
    stringifiedPost,
    token: searchParams.get("token") || "",
  };
}

class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/**
 * @see https://vercel.com/docs/concepts/functions/edge-functions/og-image-examples#encrypting-parameters
 */
async function assertTokenIsValid(
  post: StringifiedPost,
  receivedToken: string,
): Promise<void> {
  const secret = process.env.OG_IMAGE_SECRET;

  if (!secret) {
    throw new Error("process.env.OG_IMAGE_SECRET is missing");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );

  const arrayBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(post),
  );

  const token = Array.prototype.map
    .call(new Uint8Array(arrayBuffer), (n: number) =>
      n.toString(16).padStart(2, "0"),
    )
    .join("");

  if (receivedToken !== token) {
    throw new HttpError("Invalid token.", 401);
  }
}

function OgContainer({ children }: { children: React.ReactNode[] }) {
  return h(
    "div",
    {
      tw: `
        h-full w-full flex items-start justify-start
      `,
    },
    h(
      "div",
      {
        tw: `
          flex items-start justify-start h-full
        `,
      },
      children,
    ),
  );
}

function LeftSide({ children }: { children: React.ReactNode[] }) {
  return h(
    "div",
    {
      tw: `
        flex w-2/5 flex-col justify-between h-full pl-12 py-12 bg-gray-50
      `,
    },
    h(
      "div",
      {
        tw: `
          flex flex-col justify-between h-full
        `,
      },
      children,
    ),
  );
}

function RightSide({ children }: { children: React.ReactNode[] }) {
  return h(
    "div",
    {
      tw: `
        flex w-3/5 h-full
      `,
    },
    children,
  );
}
