import { atom } from "recoil";
import { Theme, isTheme } from "../types/theme";

interface UserState {
  theme: Theme;
  loggedIn: boolean;
}

const getThemeFromLocalStorage = (): Theme => {
  const theme = localStorage.getItem('theme');
  if (theme === null) return 'default';
  if (isTheme(theme)) return theme;
  return 'default';
}

const initialState: UserState = {
  theme: getThemeFromLocalStorage(),
  loggedIn: false,
}

export const userState = atom<UserState>({
  key: 'userState',
  default: initialState,
})