// Generic loading placeholder for bidder pages, rendered as `children` inside
// BidderLayout so the shell (sidebar/topbar/bottom-nav) stays visible and
// stable across a page load instead of the whole screen flashing to a bare
// spinner.
export default function PageSkeleton() {
  return (
    <div>
      <div className="image-shimmer h-4 w-48 rounded-lg mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="image-shimmer h-24 rounded-2xl" />
        <div className="image-shimmer h-24 rounded-2xl" />
        <div className="image-shimmer h-24 rounded-2xl hidden lg:block" />
      </div>
      <div className="image-shimmer h-40 rounded-2xl mb-4" />
      <div className="image-shimmer h-40 rounded-2xl" />
    </div>
  );
}
