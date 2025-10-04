import { Theme } from './consts.js';

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

  return true;
};
