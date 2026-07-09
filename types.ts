import config from "./config/config";

export type LanguageString = {
  string: string;
  language?: string;
};

export function toLanguageString(string: string, language?: string) {
  return {
    string: string,
    language: language || config.defaultLanguage,
  } as LanguageString;
}

export type Expression = {
  uri: string;
  uuid: string;
  title?: LanguageString;
  content: LanguageString;
  language: string;
};

export type TaskData = {
  uri: string;
  sourceUrl: string;
  parent: string;
};
