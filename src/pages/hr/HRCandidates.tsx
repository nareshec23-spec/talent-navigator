import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Users, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateCard } from '@/components/candidates/CandidateCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
 
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
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [hireTarget, setHireTarget] = useState<{ appId: string; email: string; name: string; jobTitle: string } | null>(null);
  const [joiningDate, setJoiningDate] = useState<Date | undefined>();
 
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
    candidateInfo?: { email: string; name: string; jobTitle: string },
    extraUpdate?: Record<string, any>
  ) => {
    try {
      const updatePayload: any = { status: newStatus, ...extraUpdate };
      const { error } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', applicationId);

      if (error) throw error;

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
          app.id === applicationId ? { ...app, status: newStatus, ...extraUpdate } : app
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

  const openHireDialog = (appId: string, email: string, name: string, jobTitle: string) => {
    setHireTarget({ appId, email, name, jobTitle });
    setJoiningDate(undefined);
    setHireDialogOpen(true);
  };

  const confirmHire = async () => {
    if (!hireTarget) return;
    await updateApplicationStatus(
      hireTarget.appId,
      'hired',
      { email: hireTarget.email, name: hireTarget.name, jobTitle: hireTarget.jobTitle },
      joiningDate ? { joining_date: format(joiningDate, 'yyyy-MM-dd') } : {}
    );
    setHireDialogOpen(false);
    setHireTarget(null);
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
                  onHire={() => openHireDialog(
                    app.id,
                    app.candidate.email,
                    app.candidate.full_name,
                    app.job.title
                  )}
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

        {/* Hire with Joining Date Dialog */}
        <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Hire — {hireTarget?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Set a joining date for <span className="font-medium text-foreground">{hireTarget?.name}</span> for the role of <span className="font-medium text-foreground">{hireTarget?.jobTitle}</span>.
              </p>
              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !joiningDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {joiningDate ? format(joiningDate, "PPP") : "Select joining date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={joiningDate} onSelect={setJoiningDate} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHireDialogOpen(false)}>Cancel</Button>
              <Button className="gradient-accent text-accent-foreground" onClick={confirmHire}>
                Confirm Hire
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }