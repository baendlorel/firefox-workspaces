import { RandomNameLang, Theme } from './consts.js';

export const isValidSettings = (settings: Settings): settings is Settings => {
  if (typeof settings !== 'object' || settings === null) {
    return false;
  }

  switch (settings.theme) {
    case Theme.Auto:
    case Theme.Light:
    case Theme.Dark:
      break;
    default:
      settings.theme satisfies never;
      return false;
  }

  switch (settings.randomNameLang) {
    case RandomNameLang.Auto:
    case RandomNameLang.En:
    case RandomNameLang.Zh:
      break;
    default:
      settings.randomNameLang satisfies never;
      return false;
  }

  return true;
};
