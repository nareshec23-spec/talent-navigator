 import { cva, type VariantProps } from "class-variance-authority";
 import { cn } from "@/lib/utils";
 
 const statusBadgeVariants = cva(
   "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
   {
     variants: {
       variant: {
         applied: "bg-info/10 text-info border border-info/20",
         reviewing: "bg-warning/10 text-warning border border-warning/20",
         shortlisted: "bg-accent/10 text-accent border border-accent/20",
         rejected: "bg-destructive/10 text-destructive border border-destructive/20",
         hired: "bg-success/10 text-success border border-success/20",
         active: "bg-success/10 text-success border border-success/20",
         inactive: "bg-muted text-muted-foreground border border-border",
        default: "bg-muted text-muted-foreground border border-border",
       },
     },
     defaultVariants: {
      variant: "default",
     },
   }
 );
 
type StatusVariant = 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired' | 'active' | 'inactive' | 'default';

 interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
   children: React.ReactNode;
   className?: string;
  variant?: StatusVariant;
 }
 
 export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  const safeVariant = variant && ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired', 'active', 'inactive', 'default'].includes(variant)
    ? variant as StatusVariant
    : 'default';
    
   return (
    <span className={cn(statusBadgeVariants({ variant: safeVariant }), className)}>
       {children}
     </span>
   );
 }