import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="h-24 border-t border-white/10 mt-auto flex items-center justify-between w-full relative z-40 px-margin-desktop bg-background text-on-surface">
      <div className="max-w-container-max mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Live Interface Alpha</span>
        </div>
        
        <div className="md:flex gap-16 hidden">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest opacity-40 mb-1 text-on-surface">Explore</span>
            <Link href="/about" className="text-[11px] font-medium tracking-wider hover:text-primary transition-colors">About FundScope</Link>
            <Link href="/risk-profile" className="text-[11px] font-medium tracking-wider hover:text-primary transition-colors">Risk Assessment</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest opacity-40 mb-1 text-on-surface">Project Location</span>
            <span className="text-[11px] font-medium tracking-wider">40.7128° N, 74.0060° W</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest opacity-40 mb-1 text-on-surface">Designer ID</span>
            <span className="text-[11px] font-medium tracking-wider text-primary">@STUDIO_NEXUS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
