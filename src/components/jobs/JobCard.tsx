 import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Briefcase, Trash2 } from 'lucide-react';
 import { Card, CardContent, CardHeader } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { StatusBadge } from '@/components/ui/status-badge';
 
 interface JobCardProps {
   job: {
     id: string;
     title: string;
     description: string;
     employment_type: string;
     location_type: string;
     location_details?: string | null;
     salary_min?: number | null;
     salary_max?: number | null;
     required_skills: string[];
     experience_min: number;
     experience_max?: number | null;
     is_active: boolean;
     created_at: string;
   };
   onApply?: () => void;
   onView?: () => void;
  onDelete?: () => void;
   showApply?: boolean;
   showStatus?: boolean;
  showDelete?: boolean;
   applicationStatus?: string;
 }
 
 const formatEmploymentType = (type: string) => {
   return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
 };
 
 const formatLocationtype = (type: string) => {
   return type.replace(/\b\w/g, l => l.toUpperCase());
 };
 
 const formatSalary = (min?: number | null, max?: number | null) => {
   if (!min && !max) return null;
   if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
   if (min) return `₹${(min / 100000).toFixed(1)}L+`;
   return `Up to ₹${(max! / 100000).toFixed(1)}L`;
 };
 
export function JobCard({ job, onApply, onView, onDelete, showApply = true, showStatus = false, showDelete = false, applicationStatus }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max);
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       whileHover={{ y: -4 }}
       transition={{ duration: 0.2 }}
     >
       <Card className="h-full shadow-card hover:shadow-card-hover transition-shadow duration-300 cursor-pointer" onClick={onView}>
         <CardHeader className="pb-3">
           <div className="flex items-start justify-between gap-4">
             <div className="flex-1 min-w-0">
               <h3 className="font-semibold text-lg text-foreground truncate">{job.title}</h3>
               <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1">
                   <Briefcase className="w-4 h-4" />
                   {formatEmploymentType(job.employment_type)}
                 </span>
                 <span className="flex items-center gap-1">
                   <MapPin className="w-4 h-4" />
                   {formatLocationtype(job.location_type)}
                 </span>
               </div>
             </div>
            <div className="flex items-center gap-2">
              {showDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {showStatus && applicationStatus && (
                <StatusBadge variant={applicationStatus as any}>
                  {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                </StatusBadge>
              )}
            </div>
           </div>
         </CardHeader>
         <CardContent className="pt-0">
           <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
             {job.description}
           </p>
 
           {job.required_skills.length > 0 && (
             <div className="flex flex-wrap gap-1.5 mb-4">
               {job.required_skills.slice(0, 4).map((skill) => (
                 <Badge key={skill} variant="secondary" className="text-xs">
                   {skill}
                 </Badge>
               ))}
               {job.required_skills.length > 4 && (
                 <Badge variant="outline" className="text-xs">
                   +{job.required_skills.length - 4}
                 </Badge>
               )}
             </div>
           )}
 
           <div className="flex items-center justify-between pt-4 border-t border-border">
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
               {salary && (
                 <span className="flex items-center gap-1">
                   <DollarSign className="w-4 h-4" />
                   {salary}
                 </span>
               )}
               <span className="flex items-center gap-1">
                 <Clock className="w-4 h-4" />
                 {job.experience_min}+ yrs
               </span>
             </div>
             {showApply && (
               <Button 
                 size="sm" 
                 className="gradient-accent text-accent-foreground"
                 onClick={(e) => {
                   e.stopPropagation();
                   onApply?.();
                 }}
               >
                 Apply Now
               </Button>
             )}
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }