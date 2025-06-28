import axios from "axios";
import { ReadStream } from "node:fs";

export const streamBlogger = (url: string) => {
  const controller = new AbortController();
  let stream: ReadStream | undefined = undefined;

  const abort = () => {
    controller.abort();
    if (stream) {
      (stream as ReadStream).destroy();
    }
  };

  return axios.get(url).then(({ data }) => {
    const json = (data as string).match(/var VIDEO_CONFIG = (.*)\n/m);

    if (!json?.length) throw new Error("Video invalid");

    const parsed = JSON.parse(json[1]!);
    const playURL = parsed.streams[0].play_url;

    return axios
      .get(playURL, {
        responseType: "stream",
        signal: controller.signal,
      })
      .then(({ data }) => {
        stream = data;

        return {
          abort,
          stream: stream!,
        };
      });
  });
};

export const streamPremium = (url: string) => {
  const controller = new AbortController();
  let stream: ReadStream | undefined = undefined;

  const abort = () => {
    controller.abort();
    if (stream) {
      (stream as ReadStream).destroy();
    }
  };

  return axios
    .get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT)" },
      responseType: "stream",
      signal: controller.signal,
    })
    .then(({ data }) => {
      stream = data;

      return {
        abort,
        stream: stream!,
      };
    });
};

export const streamPixeldrain = (url: string) => {
  const id = new URL(url).pathname.split("/").pop();

  const controller = new AbortController();
  let stream: ReadStream | undefined = undefined;

  const abort = () => {
    controller.abort();
    if (stream) {
      (stream as ReadStream).destroy();
    }
  };

  return axios
    .get(`https://pixeldrain.com/api/file/${id}`, {
      responseType: "stream",
      signal: controller.signal,
    })
    .then(({ data }) => {
      stream = data;

      return {
        abort,
        stream: stream!,
      };
    });
};

export const streamFiledon = (url: string) => {
  const slug = new URL(url).pathname.split("/").pop();

  const controller = new AbortController();
  let stream: ReadStream | undefined = undefined;

  const abort = () => {
    controller.abort();
    if (stream) {
      (stream as ReadStream).destroy();
    }
  };

  return axios
    .post(
      "https://filedon.co/get-url",
      {
        slug,
      },
      {
        signal: controller.signal,
      }
    )
    .then(({ data }) =>
      axios
        .get(data.data.url, {
          responseType: "stream",
        })
        .then(({ data }) => {
          stream = data;

          return {
            abort,
            stream: stream!,
          };
        })
    );
};
