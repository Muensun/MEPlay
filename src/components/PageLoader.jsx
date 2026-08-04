export default function PageLoader() {
  return (
    <div className="page-loader">
      <video
        className="page-loader-icon"
        src="/loading.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}
