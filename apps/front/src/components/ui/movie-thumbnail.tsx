import { client } from '@/client';
import { Dialog, DialogContent } from './dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Separator } from './separator';
import { InfoIcon, TvIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { JOBS_TRANSCO } from '@cine-map/contract';
import dayjs from 'dayjs';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';

type MovieThumbnailProps = Extract<Awaited<ReturnType<typeof client.getMovies>>, { status: 200 }>['body'][number];

function MovieThumbnail({ id, title, poster, releaseDate, overview, crew, cast, allocineRatings: { critic, spectator, link } }: MovieThumbnailProps) {
  //@ts-expect-error env exist in reality
  const cloudflareUrl = import.meta.env.VITE_CLOUDFLARE_URL;
  const director = crew
    .filter(({ job }) => job === JOBS_TRANSCO.director)
    .map(({ person }) => person.name)
    .join(',  ');
  const castFirsts = cast
    .slice(0, 3)
    .map(({ person }) => person.name)
    .join(',  ');
  return (
    <Dialog key={id}>
      <DialogTrigger className="flex w-48 flex-col items-center gap-2   rounded-lg ring-zinc-500 focus:outline-none focus:ring-2" key={id}>
        <img src={poster} className="h-72 w-48 rounded-lg object-cover shadow-lg dark:border-2" alt={title} />
        <div className="flex h-[60px] flex-col items-center">
          <h3 className="line-clamp-2 text-pretty text-center text-sm font-bold">{title}</h3>
          <span className="text-muted-foreground text-sm">({dayjs(releaseDate).year()})</span>
        </div>
      </DialogTrigger>
      <DialogContent className="animate-fade-in flex h-full max-h-96 max-w-3xl flex-row overflow-hidden border-2 p-0 pr-8">
        <img src={poster} className="h-[380px] w-64 rounded-l-lg border-r-2 object-cover" alt={title} />
        <div className="ml-2 flex flex-1 flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <h3 className=" line-clamp-2 text-pretty text-xl font-bold">
              {title} <span className="text-muted-foreground text-sm">({dayjs(releaseDate).year()})</span>
            </h3>
            <p className=" text-sm font-black">
              <span className="text-xs font-normal">De :</span> {director}
            </p>
            <p className="whitespace-pre text-sm font-black">
              <span className="text-xs font-normal">Avec :</span> {castFirsts}
            </p>
          </div>
          <Separator />
          <div className="flex-1">
            <p className="text-muted-foreground line-clamp-6 text-justify  text-xs">{overview}</p>
          </div>

          <div className="flex gap-3">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={link ?? undefined}
              className="ring-primary relative  flex flex-row items-center gap-2 rounded-lg border p-3 outline-none transition-transform duration-200 hover:scale-105 focus:ring-2"
            >
              <img src={`${cloudflareUrl}/allocine.png`} className="h-7" />
              <Separator orientation="vertical" />
              <StarRate rate={critic} label="Presse" />
              <StarRate rate={spectator} label="Spectateurs" />
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.google.com/search?q=${encodeURI(`Ou regarder : ${title} de ${director}`)}`}
              className="ring-primary flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border p-3 outline-none transition-transform duration-200 hover:scale-105 focus:ring-2"
            >
              <TvIcon />
              <span className="text-sm font-black">Regarder</span>
            </a>
            <Link
              to="/movies/$movieId"
              params={{ movieId: `${id}` }}
              className="bg-primary text-primary-foreground  ring-primary flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border p-3 outline-none transition-transform duration-200 hover:scale-105 focus:ring-2"
            >
              <InfoIcon />
              <p className="text-sm font-bold">Détails</p>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const StarRate = ({ rate, label }: { rate: number | null; label: string }) => {
  return (
    <div className="flex flex-col items-center gap-1 self-start">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-black">{rate ? rate / 10 : '--'}</p>
      <div className={cn('relative flex flex-shrink-0 flex-row', { 'opacity-50': rate === null })}>
        <div
          className={cn('absolute flex flex-row overflow-hidden', { 'opacity-0': rate === null })}
          style={{ width: `${((rate || 0) / 10) * 4 * 4}px` }}
        >
          <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-[#fdcd00]" />
          <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-[#fdcd00]" />
          <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-[#fdcd00]" />
          <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-[#fdcd00]" />
          <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-[#fdcd00]" />
        </div>
        <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-zinc-200" />
        <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-zinc-200" />
        <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-zinc-200" />
        <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-zinc-200" />
        <StarFilledIcon className="h-4 w-4 flex-shrink-0 text-zinc-200" />
      </div>
    </div>
  );
};

export default MovieThumbnail;
