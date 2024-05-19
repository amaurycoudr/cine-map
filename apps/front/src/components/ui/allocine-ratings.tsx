import { StarFilledIcon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';
import envConfig from '@/utils/config';
import { Separator } from './separator';

type Props = {
  link: string | null;
  critic: number | null;
  spectator: number | null;
  className?: string;
};

const AllocineRatings = ({ critic, link, spectator, className }: Props) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={link ?? undefined}
    className={cn(
      ' bg-background relative flex h-[90px] flex-row items-center justify-around gap-2 rounded-lg border p-3 transition-transform duration-200 hover:scale-105',
      className,
    )}
  >
    <img src={`${envConfig.cloudflareUrl}/allocine.png`} className="hidden h-7 sm:block" />
    <Separator orientation="vertical" className="hidden sm:block" />
    <StarRate rate={critic} label="Presse" />
    <StarRate rate={spectator} label="Spectateurs" />
  </a>
);

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
          {Array(5)
            .fill(undefined)
            .map((_, index) => (
              <StarFilledIcon key={index} className="h-4 w-4 flex-shrink-0 text-[#fdcd00]" />
            ))}
        </div>
        {Array(5)
          .fill(undefined)
          .map((_, index) => (
            <StarFilledIcon key={index} className="h-4 w-4 flex-shrink-0 text-zinc-200" />
          ))}
      </div>
    </div>
  );
};

export default AllocineRatings;
