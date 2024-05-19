export const getWhereToWatchGoogleLink = (movieTitle: string, movieDirectors: string) =>
  `https://www.google.com/search?q=${encodeURI(`Ou regarder : ${movieTitle} de ${movieDirectors}`)}`;
