import { Movie } from '@/utils/apiTypes';

import { pipe } from '@/utils/pipe';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { TvIcon } from 'lucide-react';
import AllocineRatings from './allocine-ratings';
import { Dialog, DialogContent } from './dialog';
import { Separator } from './separator';
import SquareLink from './square-link';
import { getDirectors, getPersonsName } from '@/utils/person';
import { getWhereToWatchGoogleLink } from '@/utils/google';

function MovieThumbnail({ id, title, poster, releaseDate, overview, crew, cast, allocineRatings }: Movie) {
  const directors = pipe(crew, getDirectors, getPersonsName);
  const castFirsts = pipe(cast.slice(0, 3), getPersonsName);

  return (
    <Dialog key={id}>
      <DialogTrigger className=" flex w-48 flex-col items-center gap-2 rounded-lg" key={id}>
        <img src={poster} className="pointer-events-none h-72 w-48 rounded-lg object-cover shadow-lg dark:border-2" alt={title} />
        <div className="flex h-[60px] flex-col items-center">
          <h3 className="line-clamp-2 text-pretty text-center text-sm font-bold">{title}</h3>
          <span className="text-muted-foreground text-sm">({dayjs(releaseDate).year()})</span>
        </div>
      </DialogTrigger>
      <DialogContent className="animate-fade-in flex w-[calc(100%-32px)] flex-row overflow-hidden border-2 p-0 pl-8 pr-8 sm:h-full sm:max-h-96 sm:max-w-xl sm:pl-0 md:w-full md:max-w-3xl">
        <img src={poster} className="hidden rounded-l-lg border-r-2 object-cover sm:block sm:h-[380px] sm:w-64" alt={title} />
        <div className="ml-2 flex flex-1 flex-col gap-4 py-8 sm:py-4">
          <div className="flex flex-col gap-2">
            <h3 className="line-clamp-2 text-pretty text-lg font-bold md:text-xl">
              {title} <span className="text-muted-foreground text-sm">({dayjs(releaseDate).year()})</span>
            </h3>
            <p className=" text-sm font-black">
              <span className="text-xs font-normal">De :</span> {directors}
            </p>
            <p className="whitespace-pre text-wrap text-sm font-black">
              <span className="text-xs font-normal">Avec :</span> {castFirsts}
            </p>
          </div>
          <Separator />
          <div className=" hidden flex-1 md:block">
            <p className="text-muted-foreground line-clamp-6 text-justify text-xs">{overview}</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <AllocineRatings {...allocineRatings} />
            <div className="flex flex-1 gap-3">
              <SquareLink icon={<TvIcon />} text="Regarder" variant="secondary" href={getWhereToWatchGoogleLink(title, directors)} />
              <SquareLink
                renderContainer={(props) => <Link {...props} to="/movies/$movieId" params={{ movieId: `${id}` }} />}
                icon={<TvIcon />}
                text="Détails"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MovieThumbnail;
