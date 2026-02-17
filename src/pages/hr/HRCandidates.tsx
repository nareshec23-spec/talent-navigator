 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { Search, Filter, Users } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent } from '@/components/ui/card';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { CandidateCard } from '@/components/candidates/CandidateCard';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { useToast } from '@/hooks/use-toast';
 
 const sendCandidateEmail = async (
   candidateEmail: string,
   candidateName: string,
   jobTitle: string,
   status: 'shortlisted' | 'hired' | 'rejected',
   companyName?: string
 ) => {
   try {
     const { data, error } = await supabase.functions.invoke('send-candidate-email', {
       body: {
         candidateEmail,
         candidateName,
         jobTitle,
         status,
         companyName: companyName || 'Our Company',
       },
     });
 
     if (error) {
       console.error('Error sending email:', error);
       return { error: error.message };
     }
 
     console.log('Email sent successfully:', data);
     return { data };
   } catch (error: any) {
     console.error('Error invoking email function:', error);
     return { error: error.message };
   }
 };
 
 interface Application {
   id: string;
   job_id: string;
   candidate_id: string;
   status: string;
   cover_letter: string | null;
   created_at: string;
   candidate: {
     id: string;
     full_name: string;
     email: string;
     phone: string | null;
     location: string | null;
     skills: string[];
     experience_years: number;
      bio: string | null;
      resume_url: string | null;
    };
    job: {
     id: string;
     title: string;
   };
 }
 
 export default function HRCandidates() {
   const { profile } = useAuth();
   const { toast } = useToast();
   const [applications, setApplications] = useState<Application[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [jobFilter, setJobFilter] = useState<string>('all');
   const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
 
   useEffect(() => {
     if (profile?.id) {
       fetchJobsAndApplications();
     }
   }, [profile?.id]);
 
   const fetchJobsAndApplications = async () => {
     try {
       // First fetch HR's jobs
       const { data: jobsData, error: jobsError } = await supabase
         .from('jobs')
         .select('id, title')
         .eq('hr_id', profile!.id);
 
       if (jobsError) throw jobsError;
       setJobs(jobsData || []);
 
       if (jobsData && jobsData.length > 0) {
         const jobIds = jobsData.map(j => j.id);
         
         // Then fetch applications for those jobs
         const { data: appsData, error: appsError } = await supabase
           .from('applications')
           .select(`
             id,
             job_id,
             candidate_id,
             status,
             cover_letter,
             created_at,
      candidate:profiles!applications_candidate_id_fkey (
                id,
                full_name,
                email,
                phone,
                location,
                skills,
                experience_years,
                bio,
                resume_url
              ),
             job:jobs!applications_job_id_fkey (
               id,
               title
             )
           `)
           .in('job_id', jobIds)
           .order('created_at', { ascending: false });
 
         if (appsError) throw appsError;
         setApplications(appsData as any[]);
       }
     } catch (error) {
       console.error('Error fetching data:', error);
     } finally {
       setLoading(false);
     }
   };
 
  type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  
 const updateApplicationStatus = async (
   applicationId: string, 
   newStatus: ApplicationStatus,
   candidateInfo?: { email: string; name: string; jobTitle: string }
 ) => {
     try {
       const { error } = await supabase
         .from('applications')
         .update({ status: newStatus })
         .eq('id', applicationId);
 
       if (error) throw error;
 
       // Send email notification for status changes
       if (['shortlisted', 'hired', 'rejected'].includes(newStatus) && candidateInfo) {
         const emailResult = await sendCandidateEmail(
           candidateInfo.email,
           candidateInfo.name,
           candidateInfo.jobTitle,
           newStatus as 'shortlisted' | 'hired' | 'rejected',
           profile?.company_name || undefined
         );
         
         if (emailResult.error) {
           console.error('Failed to send email notification:', emailResult.error);
         }
       }
 
       setApplications(prev =>
         prev.map(app =>
           app.id === applicationId ? { ...app, status: newStatus } : app
         )
       );
 
       toast({
         title: 'Status Updated',
         description: `Candidate has been ${newStatus}${['shortlisted', 'hired', 'rejected'].includes(newStatus) ? '. Email notification sent.' : ''}`,
       });
     } catch (error: any) {
       toast({
         title: 'Error',
         description: error.message || 'Failed to update status',
         variant: 'destructive',
       });
     }
   };
 
   const filteredApplications = applications.filter(app => {
     const matchesSearch = 
       app.candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       app.candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       app.candidate.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
     
     const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
     const matchesJob = jobFilter === 'all' || app.job_id === jobFilter;
 
     return matchesSearch && matchesStatus && matchesJob;
   });
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
           <p className="text-muted-foreground mt-1">Review and manage applications</p>
         </div>
 
         {/* Filters */}
         <div className="flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="Search by name, email, or skills..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
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
           <Select value={jobFilter} onValueChange={setJobFilter}>
             <SelectTrigger className="w-[200px]">
               <SelectValue placeholder="Filter by job" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Jobs</SelectItem>
               {jobs.map(job => (
                 <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {/* Results count */}
         <p className="text-sm text-muted-foreground">
           Showing {filteredApplications.length} candidate{filteredApplications.length !== 1 ? 's' : ''}
         </p>
 
         {/* Candidates Grid */}
         {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3].map((i) => (
               <Card key={i} className="h-64 animate-pulse bg-muted" />
             ))}
           </div>
         ) : filteredApplications.length === 0 ? (
           <Card className="shadow-card">
             <CardContent className="py-12 text-center">
               <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">
                 {applications.length === 0 
                   ? 'No applications yet. Wait for candidates to apply!' 
                   : 'No candidates match your filters'}
               </p>
             </CardContent>
           </Card>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredApplications.map((app) => (
               <CandidateCard
                 key={app.id}
                 candidate={app.candidate}
                applicationStatus={app.status as 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'}
                 onShortlist={() => updateApplicationStatus(app.id, 'shortlisted', {
                   email: app.candidate.email,
                   name: app.candidate.full_name,
                   jobTitle: app.job.title,
                 })}
                 onHire={() => updateApplicationStatus(app.id, 'hired', {
                   email: app.candidate.email,
                   name: app.candidate.full_name,
                   jobTitle: app.job.title,
                 })}
                 onReject={() => updateApplicationStatus(app.id, 'rejected', {
                   email: app.candidate.email,
                   name: app.candidate.full_name,
                   jobTitle: app.job.title,
                 })}
               />
             ))}
           </div>
         )}
       </div>
     </DashboardLayout>
   );
 }