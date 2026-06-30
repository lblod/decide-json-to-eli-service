export type LanguageString = {
  string: string;
  language?: string;
};

export function toLanguageString(string: string, language = "de") {
  return { string: string, language: language } as LanguageString;
}

export type Expression = {
  title?: LanguageString;
  content: LanguageString;
};
