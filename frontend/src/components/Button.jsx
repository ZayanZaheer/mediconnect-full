export default function Button({
  as: As = "button",
  className = "",
  children,
  type,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";
  const mergedClassName = `${base} ${className}`.trim();
  const typeProps =
    As === "button"
      ? { type: type ?? "button" }
      : type !== undefined
      ? { type }
      : {};

  return (
    <As className={mergedClassName} {...typeProps} {...props}>
      {children}
    </As>
  );
}
