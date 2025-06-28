import axios from "axios";
import Fuse from "fuse.js";

export type Anime = {
  id: number;
  title: string;
  status:
    | "FINISHED"
    | "RELEASING"
    | "NOT_YET_RELEASED"
    | "CANCELLED"
    | "HIATUS";
  description: string;
  startDate: Date;
  endDate: Date;
  year: number;
  episodes: number;
  duration: number;
  trailer: {
    thumbnail: string;
    id: string;
    site: string;
  };
  coverImage: string;
  bannerImage: string;
  genres: string[];
  averageScore: number;
  studios: string[];
  streamingEpisodes: {
    title: string;
    thumbnail: string;
  }[];
};

const client = axios.create({
  baseURL: "https://graphql.anilist.co",
});

export const getAnimeSummary = (search: string) => {
  return client
    .post("/", {
      query: `
        query ($search: String!) {
          Page {
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              synonyms
              averageScore
              coverImage {
                large
              }
              seasonYear
            }
          }
        }
    `,
      variables: {
        search,
      },
    })
    .then(({ data }) => {
      const options = data.data.Page.media.map((item: any) => {
        const keywords: string[] = [
          item.title.romaji,
          item.title.english,
          item.title.native,
        ];

        return {
          id: item.id,
          keywords: keywords.concat(item.synonyms),
          title: item.title.english || item.title.romaji,
          coverImage: item.coverImage.large,
          year: item.seasonYear,
          averageScore: item.averageScore,
        };
      });

      const fuse = new Fuse<any>(options, {
        keys: ["keywords"],
        threshold: 0.4,
      }).search(search);

      if (!fuse.length) throw new Error("Not found");

      const { keywords: _, ...result } = fuse[0]!.item;

      return result as Pick<
        Anime,
        "id" | "averageScore" | "coverImage" | "title" | "year"
      >;
    });
};

export const getAnimeID = (search: string) => {
  return client
    .post("/", {
      query: `
        query ($search: String!) {
          Page {
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              synonyms
            }
          }
        }
    `,
      variables: {
        search,
      },
    })
    .then(({ data }) => {
      const options = data.data.Page.media.map((item: any) => {
        const keywords: string[] = [
          item.title.romaji,
          item.title.english,
          item.title.native,
        ];

        return {
          id: item.id,
          keywords: keywords.concat(item.synonyms),
        };
      });

      const fuse = new Fuse<{ id: number }>(options, {
        keys: ["keywords"],
        threshold: 0.4,
      }).search(search);

      if (!fuse.length) throw new Error("Not found");

      const { id } = fuse[0]!.item;

      return id;
    });
};

export const getAnimeDetail = (id: number) => {
  return client
    .post("/", {
      query: `
      query ($id: Int!) {
        Media (id: $id) {
          id
          title {
            romaji
            english
            native
          }
          status
          description(asHtml: false)
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          seasonYear
          episodes
          duration
          trailer {
            id
            site
            thumbnail
          }
          coverImage {
            large
          }
          bannerImage
          genres
          averageScore
          studios {
            nodes {
              name
            }
          }
          streamingEpisodes {
            title
            thumbnail
          }
        }
      }
    `,
      variables: {
        id,
      },
    })
    .then(({ data }) => {
      const media = data.data.Media;

      return {
        averageScore: media.averageScore,
        bannerImage: media.bannerImage,
        coverImage: media.coverImage.large,
        description: media.description.replace(/<[^>]*>/g, ""),
        duration: media.duration,
        endDate: new Date(
          media.endDate.year,
          media.endDate.month - 1,
          media.endDate.day
        ),
        episodes: media.episodes,
        genres: media.genres,
        id: media.id,
        startDate: new Date(
          media.startDate.year,
          media.startDate.month - 1,
          media.startDate.day
        ),
        status: media.status,
        streamingEpisodes: media.streamingEpisodes,
        studios: media.studios.nodes.map((item: { name: string }) => item.name),
        title: media.title.english || media.title.romaji,
        trailer: media.trailer,
        year: media.seasonYear,
      } as Anime;
    });
};
