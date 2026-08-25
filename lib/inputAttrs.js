export const NO_AUTOFILL = {
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
};

export const TEXT_FIELD = {
  ...NO_AUTOFILL,
  autoCapitalize: "sentences",
  autoComplete: "off",
};

export const SEARCH_FIELD = {
  ...NO_AUTOFILL,
  type: "search",
  inputMode: "search",
  enterKeyHint: "search",
  autoCapitalize: "none",
  autoComplete: "off",
};

export const NUMBER_FIELD = {
  ...NO_AUTOFILL,
  autoComplete: "off",
};
