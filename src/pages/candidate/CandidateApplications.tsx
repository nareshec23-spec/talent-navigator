 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { FileText, Filter } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { JobCard } from '@/components/jobs/JobCard';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 
 interface Application {
   id: string;
   status: string;
   created_at: string;
   job: {
     id: string;
     title: string;
     description: string;
     employment_type: string;
     location_type: string;
     location_details: string | null;
     salary_min: number | null;
     salary_max: number | null;
     required_skills: string[];
     experience_min: number;
     experience_max: number | null;
     is_active: boolean;
     created_at: string;
   };
 }
 
 export default function CandidateApplications() {
   const { profile } = useAuth();
   const [applications, setApplications] = useState<Application[]>([]);
   const [loading, setLoading] = useState(true);
   const [statusFilter, setStatusFilter] = useState<string>('all');
 
   useEffect(() => {
     if (profile?.id) {
       fetchApplications();
     }
   }, [profile?.id]);
 
   const fetchApplications = async () => {
     try {
       const { data, error } = await supabase
         .from('applications')
         .select(`
           id,
           status,
           created_at,
           job:jobs!applications_job_id_fkey (
             id,
             title,
             description,
             employment_type,
             location_type,
             location_details,
             salary_min,
             salary_max,
             required_skills,
             experience_min,
             experience_max,
             is_active,
             created_at
           )
         `)
         .eq('candidate_id', profile!.id)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       setApplications(data as any[]);
     } catch (error) {
       console.error('Error fetching applications:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const filteredApplications = applications.filter(app => 
     statusFilter === 'all' || app.status === statusFilter
   );
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
             <p className="text-muted-foreground mt-1">Track all your job applications</p>
           </div>
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="Filter by status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Status</SelectItem>
               <SelectItem value="applied">Applied</SelectItem>
               <SelectItem value="reviewing">Reviewing</SelectItem>
               <SelectItem value="shortlisted">Shortlisted</SelectItem>
               <SelectItem value="hired">Hired</SelectItem>
               <SelectItem value="rejected">Rejected</SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         {/* Results count */}
         <p className="text-sm text-muted-foreground">
           Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
         </p>
 
         {/* Applications Grid */}
         {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3].map((i) => (
               <Card key={i} className="h-64 animate-pulse bg-muted" />
             ))}
           </div>
         ) : filteredApplications.length === 0 ? (
           <Card className="shadow-card">
             <CardContent className="py-12 text-center">
               <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">
                 {applications.length === 0 
                   ? "You haven't applied to any jobs yet. Start exploring!" 
                   : 'No applications match this filter'}
               </p>
             </CardContent>
           </Card>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredApplications.map((app) => (
               <JobCard
                 key={app.id}
                 job={app.job}
                 showApply={false}
                 showStatus={true}
                 applicationStatus={app.status}
               />
             ))}
           </div>
         )}
       </div>
     </DashboardLayout>
   );
 }