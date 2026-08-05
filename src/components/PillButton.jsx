// Rebuilds the signin.png / login.png / logout.png button mockups as a
// real component (gold pill, bold ink text) instead of embedding the
// raster images — see meplay-prompt.md section 1.
export default function PillButton({
  variant = 'signin',
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
}) {
  return (
    <button
      type={type}
      className={`pill-btn pill-btn-${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {children}
    </button>
  );
}
