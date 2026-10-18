import { useId, type ReactNode, type JSX } from "react";
import type { Theme } from "@shared/settings";

type IconProps = {
  title?: string;
  size?: number;
};

type SvgIconProps = IconProps & {
  children: ReactNode;
};

function SvgIcon({ children, title, size = 16 }: SvgIconProps): JSX.Element {
  const titleId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      focusable="false"
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  );
}

export function WorkDurationIcon({ title }: IconProps): JSX.Element {
  return (
    <SvgIcon title={title}>
      <path d="M17 9h-2v13h-2v-6h-2v6H9V9H7V7h10v2Zm-6 5h2V9h-2v5Zm-6-1H3v-2h2v2Zm16 0h-2v-2h2v2ZM7 11H5V9h2v2Zm12 0h-2V9h2v2Zm-5-5h-4V2h4v4Z" />
    </SvgIcon>
  );
}

export function BreakLimitIcon({ title }: IconProps): JSX.Element {
  return (
    <SvgIcon title={title}>
      <path d="M18 22H6v-2h12v2ZM6 20H4v-2h2v2Zm14 0h-2v-2h2v2ZM4 18H2V6h2v12Zm18 0h-2V6h2v12Zm-5-1h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-2-2h-2V6h2v7ZM6 6H4V4h2v2Zm14 0h-2V4h2v2Zm-2-2H6V2h12v2Z" />
    </SvgIcon>
  );
}

/** Solo se usa vía ThemeIcon; queda fuera de la API pública del archivo. */
function SunIcon({ title }: IconProps): JSX.Element {
  return (
    <SvgIcon title={title} size={24}>
      <path d="M13 22h-2v-3h2v3Zm-6-3H5v-2h2v2Zm12 0h-2v-2h2v2ZM15 9h2v6h-2v2H9v-2H7V9h2V7h6v2ZM5 13H2v-2h3v2Zm17 0h-3v-2h3v2ZM7 7H5V5h2v2Zm12 0h-2V5h2v2Zm-6-2h-2V2h2v3Z" />
    </SvgIcon>
  );
}

/** Solo se usa vía ThemeIcon; queda fuera de la API pública del archivo. */
function MoonIcon({ title }: IconProps): JSX.Element {
  return (
    <SvgIcon title={title} size={24}>
      <path d="M18 22H8v-2h10v2ZM8 20H6v-2h2v2Zm12 0h-2v-2h2v2ZM6 18H4v-2h2v2Zm16 0h-2v-4h-2v-2h2v-2h2v8ZM4 16H2V6h2v10Zm14 0h-6v-2h6v2Zm-6-2h-2v-2h2v2Zm-2-2H8V6h2v6ZM6 6H4V4h2v2Zm8-2h-2v2h-2V4H6V2h8v2Z" />
    </SvgIcon>
  );
}

export function ThemeIcon({ theme }: { theme: Theme }): JSX.Element {
  return theme === "dark" ? <SunIcon /> : <MoonIcon />;
}
