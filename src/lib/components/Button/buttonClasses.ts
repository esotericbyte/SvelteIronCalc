// Upstream's Button variants and sizes (Button/button.css) as Skeleton
// classes: the look comes from the Skeleton theme rather than a port of
// upstream's stylesheet.

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
export type ButtonSize = "xs" | "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "preset-filled-primary-500",
  secondary: "preset-tonal",
  outline: "preset-outlined-surface-300-700 hover:preset-tonal aria-pressed:preset-tonal",
  ghost: "hover:preset-tonal aria-pressed:preset-tonal aria-expanded:preset-tonal",
  destructive: "preset-filled-error-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-base",
};

const iconSizeClasses: Record<ButtonSize, string> = {
  xs: "btn-icon-xs",
  sm: "btn-icon-sm",
  md: "btn-icon-base",
};

/** The classes of a text button. */
export function buttonClasses(variant: ButtonVariant, size: ButtonSize): string {
  return `ic-button btn ${sizeClasses[size]} ${variantClasses[variant]}`;
}

/** The classes of an icon-only button. */
export function iconButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
): string {
  return `ic-button ic-button--icon-only btn-icon ${iconSizeClasses[size]} ${variantClasses[variant]}`;
}
