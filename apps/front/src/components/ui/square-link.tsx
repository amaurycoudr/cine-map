import { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

interface InjectedProps {
  className: string;
  children: JSX.Element;
}

type DefaultAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  renderContainer?: undefined;
};
type CustomAnchorProps = {
  renderContainer: (props: InjectedProps) => JSX.Element;
};

const renderA = (buttonProps: AnchorHTMLAttributes<HTMLAnchorElement>) =>
  function (props: InjectedProps) {
    return <a {...props} {...buttonProps} />;
  };

type Props = { icon: ReactNode; text: string; variant?: 'primary' | 'secondary'; className?: string } & (DefaultAnchorProps | CustomAnchorProps);

function SquareLink({ icon, text, renderContainer, variant = 'primary', className: customClassName, ...props }: Props) {
  const className = cn(
    'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border p-3 transition-transform duration-200 hover:scale-105',
    { 'bg-primary text-primary-foreground': variant === 'primary' },
    { 'bg-background': variant === 'secondary' },
    customClassName,
  );

  const children = (
    <>
      {icon}
      <span className="text-sm font-black">{text}</span>
    </>
  );

  const render = renderContainer ? renderContainer : renderA(props);

  return render({ className, children });
}

export default SquareLink;
