import { cn } from "@/lib/utils";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean; // New prop to control padding
}

export function PremiumCard({ children, className, title, subtitle, action, noPadding = false, ...props }: PremiumCardProps) {
  return (
    <div 
      className={cn(
        "premium-card flex flex-col", // Removed 'overflow-hidden' from here to allow shadows/popovers
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100/50 flex items-center justify-between bg-white/40 backdrop-blur-md rounded-t-xl">
          <div className="min-w-0 flex-1 mr-4"> {/* min-w-0 prevents text overflow */}
            {title && <h3 className="font-semibold text-slate-800 text-lg truncate">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("w-full", !noPadding && "p-6")}>
        {children}
      </div>
    </div>
  );
}