export interface AuthResponse {
  user: {
    accountId: string;
    displayName: string;
    banned: boolean;
    email: string;
    profilePicture: string;
    discordId: string;
    roles: string[];
  };
  athena: {
    favorite_character: string;
    xp: number;
    level: number;
    book_level: number;
  };
  hype: string;
  common_core: {
    vBucks: number;
  };
}
