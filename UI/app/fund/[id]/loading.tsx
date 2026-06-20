export default function FundLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-4 w-24 bg-surface-container-high rounded mb-4" />
      <div className="h-10 w-64 bg-surface-container-high rounded mb-2" />
      <div className="h-5 w-40 bg-surface-container-high rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-surface-container-high rounded-xl" />
        ))}
      </div>
      <div className="h-56 bg-surface-container-high rounded-xl" />
    </div>
  );
}
