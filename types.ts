import { LANGUAGES } from "./constants";

export type LanguageString = {
  string: string;
  language?: string;
};

export function toLanguageString(string: string, language = "de") {
  return { string: string, language: language } as LanguageString;
}

export type Expression = {
  uri: string;
  uuid: string;
  title?: LanguageString;
  content: LanguageString;
  language: LANGUAGES;
};

export type TaskData = {
  uri: string;
  sourceUrl: string;
  parent: string;
};
