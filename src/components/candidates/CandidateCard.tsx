 import { motion } from 'framer-motion';
 import { MapPin, Briefcase, Mail, Phone, Check, X, Star } from 'lucide-react';
 import { Card, CardContent, CardHeader } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { StatusBadge } from '@/components/ui/status-badge';
 import { Checkbox } from '@/components/ui/checkbox';
 
type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

 interface CandidateCardProps {
   candidate: {
     id: string;
     full_name: string;
     email: string;
     phone?: string | null;
     location?: string | null;
     skills: string[];
     experience_years: number;
     bio?: string | null;
   };
  applicationStatus?: ApplicationStatus | string;
   onHire?: () => void;
   onReject?: () => void;
   onShortlist?: () => void;
   onView?: () => void;
   selectable?: boolean;
   selected?: boolean;
   onSelect?: (selected: boolean) => void;
 }
 
const isValidStatus = (status: string | undefined): status is ApplicationStatus => {
  return status !== undefined && ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired'].includes(status);
};

 export function CandidateCard({ 
   candidate, 
   applicationStatus,
   onHire, 
   onReject, 
   onShortlist, 
   onView,
   selectable = false,
   selected = false,
   onSelect
 }: CandidateCardProps) {
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       whileHover={{ y: -2 }}
       transition={{ duration: 0.2 }}
     >
       <Card 
         className={`h-full shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer ${
           selected ? 'ring-2 ring-accent' : ''
         }`}
         onClick={onView}
       >
         <CardHeader className="pb-3">
           <div className="flex items-start gap-4">
             {selectable && (
               <Checkbox
                 checked={selected}
                 onCheckedChange={(checked) => {
                   onSelect?.(checked as boolean);
                 }}
                 onClick={(e) => e.stopPropagation()}
                 className="mt-1"
               />
             )}
             <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
               <span className="text-lg font-semibold text-primary-foreground">
                 {candidate.full_name.charAt(0).toUpperCase()}
               </span>
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-2">
                 <h3 className="font-semibold text-lg text-foreground truncate">{candidate.full_name}</h3>
                {applicationStatus && isValidStatus(applicationStatus) && (
                  <StatusBadge variant={applicationStatus}>
                     {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                   </StatusBadge>
                 )}
               </div>
               <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1">
                   <Briefcase className="w-4 h-4" />
                   {candidate.experience_years} yrs exp
                 </span>
                 {candidate.location && (
                   <span className="flex items-center gap-1">
                     <MapPin className="w-4 h-4" />
                     {candidate.location}
                   </span>
                 )}
               </div>
             </div>
           </div>
         </CardHeader>
         <CardContent className="pt-0">
           {candidate.bio && (
             <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
               {candidate.bio}
             </p>
           )}
 
           {candidate.skills.length > 0 && (
             <div className="flex flex-wrap gap-1.5 mb-4">
               {candidate.skills.slice(0, 5).map((skill) => (
                 <Badge key={skill} variant="secondary" className="text-xs">
                   {skill}
                 </Badge>
               ))}
               {candidate.skills.length > 5 && (
                 <Badge variant="outline" className="text-xs">
                   +{candidate.skills.length - 5}
                 </Badge>
               )}
             </div>
           )}
 
           <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
             <span className="flex items-center gap-1 truncate">
               <Mail className="w-4 h-4 shrink-0" />
               {candidate.email}
             </span>
             {candidate.phone && (
               <span className="flex items-center gap-1">
                 <Phone className="w-4 h-4" />
                 {candidate.phone}
               </span>
             )}
           </div>
 
           {(onHire || onReject || onShortlist) && (
             <div className="flex items-center gap-2 pt-4 border-t border-border">
               {onShortlist && applicationStatus !== 'shortlisted' && applicationStatus !== 'hired' && (
                 <Button 
                   size="sm" 
                   variant="outline"
                   className="flex-1"
                   onClick={(e) => {
                     e.stopPropagation();
                     onShortlist();
                   }}
                 >
                   <Star className="w-4 h-4 mr-1" />
                   Shortlist
                 </Button>
               )}
               {onReject && applicationStatus !== 'rejected' && applicationStatus !== 'hired' && (
                 <Button 
                   size="sm" 
                   variant="outline"
                   className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                   onClick={(e) => {
                     e.stopPropagation();
                     onReject();
                   }}
                 >
                   <X className="w-4 h-4" />
                 </Button>
               )}
               {onHire && applicationStatus !== 'hired' && applicationStatus !== 'rejected' && (
                 <Button 
                   size="sm" 
                   className="flex-1 gradient-accent text-accent-foreground"
                   onClick={(e) => {
                     e.stopPropagation();
                     onHire();
                   }}
                 >
                   <Check className="w-4 h-4 mr-1" />
                   Hire
                 </Button>
               )}
             </div>
           )}
         </CardContent>
       </Card>
     </motion.div>
   );
 }