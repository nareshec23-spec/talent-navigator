import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Globe, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobCard } from '@/components/jobs/JobCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
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
  company_website_url: string | null;
  registration_deadline: string | null;
  require_linkedin: boolean;
  require_leetcode: boolean;
  require_github: boolean;
}

const defaultForm = {
  title: '',
  description: '',
  employment_type: 'full_time',
  location_type: 'remote',
  location_details: '',
  salary_min: '',
  salary_max: '',
  required_skills: '',
  experience_min: '0',
  experience_max: '',
  company_website_url: '',
  require_linkedin: false,
  require_leetcode: false,
  require_github: false,
};

export default function HRJobs() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>();
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (profile?.id) fetchJobs();
  }, [profile?.id]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('hr_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs((data || []) as Job[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (job: Job) => {
    setEditJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      employment_type: job.employment_type,
      location_type: job.location_type,
      location_details: job.location_details || '',
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      required_skills: job.required_skills?.join(', ') || '',
      experience_min: job.experience_min?.toString() || '0',
      experience_max: job.experience_max?.toString() || '',
      company_website_url: job.company_website_url || '',
      require_linkedin: job.require_linkedin || false,
      require_leetcode: job.require_leetcode || false,
      require_github: job.require_github || false,
    });
    setRegistrationDeadline(job.registration_deadline ? new Date(job.registration_deadline) : undefined);
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setRegistrationDeadline(undefined);
    setEditJob(null);
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = formData.required_skills.split(',').map(s => s.trim()).filter(Boolean);
    const payload: any = {
      title: formData.title,
      description: formData.description,
      employment_type: formData.employment_type,
      location_type: formData.location_type,
      location_details: formData.location_details || null,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
      required_skills: skillsArray,
      experience_min: parseInt(formData.experience_min) || 0,
      experience_max: formData.experience_max ? parseInt(formData.experience_max) : null,
      company_website_url: formData.company_website_url || null,
      registration_deadline: registrationDeadline ? registrationDeadline.toISOString() : null,
      require_linkedin: formData.require_linkedin,
      require_leetcode: formData.require_leetcode,
      require_github: formData.require_github,
    };

    try {
      if (editJob) {
        const { error } = await supabase.from('jobs').update(payload).eq('id', editJob.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Job updated successfully!' });
        setEditJob(null);
      } else {
        payload.hr_id = profile!.id;
        const { error } = await supabase.from('jobs').insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Job posted successfully!' });
        setIsCreateOpen(false);
      }
      resetForm();
      fetchJobs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save job', variant: 'destructive' });
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', deleteJobId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Job deleted successfully!' });
      setJobs(jobs.filter(job => job.id !== deleteJobId));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete job', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteJobId(null);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDialogOpen = isCreateOpen || !!editJob;
  const closeDialog = () => { setIsCreateOpen(false); setEditJob(null); resetForm(); };

  const jobForm = (
    <form onSubmit={handleSubmitJob} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title</Label>
        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Software Engineer" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_website_url">Company Website URL</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="company_website_url" value={formData.company_website_url} onChange={(e) => setFormData({ ...formData, company_website_url: e.target.value })} className="pl-10" placeholder="https://yourcompany.com" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Registration Deadline</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !registrationDeadline && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {registrationDeadline ? format(registrationDeadline, "PPP") : "Pick a deadline"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={registrationDeadline} onSelect={setRegistrationDeadline} disabled={(date) => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the role..." rows={4} required />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select value={formData.employment_type} onValueChange={(v) => setFormData({ ...formData, employment_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Location Type</Label>
          <Select value={formData.location_type} onValueChange={(v) => setFormData({ ...formData, location_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="abroad">Abroad</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_details">Location Details (Optional)</Label>
        <Input id="location_details" value={formData.location_details} onChange={(e) => setFormData({ ...formData, location_details: e.target.value })} placeholder="e.g. Bangalore, Mumbai" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary_min">Min Salary (₹/year)</Label>
          <Input id="salary_min" type="number" value={formData.salary_min} onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })} placeholder="e.g. 500000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary_max">Max Salary (₹/year)</Label>
          <Input id="salary_max" type="number" value={formData.salary_max} onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })} placeholder="e.g. 1200000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
        <Input id="required_skills" value={formData.required_skills} onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })} placeholder="e.g. React, TypeScript, Node.js" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experience_min">Min Experience (years)</Label>
          <Input id="experience_min" type="number" value={formData.experience_min} onChange={(e) => setFormData({ ...formData, experience_min: e.target.value })} min="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience_max">Max Experience (years)</Label>
          <Input id="experience_max" type="number" value={formData.experience_max} onChange={(e) => setFormData({ ...formData, experience_max: e.target.value })} placeholder="Optional" />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-sm font-semibold">Required Candidate Profile Links</Label>
        <p className="text-xs text-muted-foreground">Candidates must provide these when applying</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={formData.require_linkedin} onCheckedChange={(c) => setFormData({ ...formData, require_linkedin: !!c })} />
            <span className="text-sm">LinkedIn Profile</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={formData.require_github} onCheckedChange={(c) => setFormData({ ...formData, require_github: !!c })} />
            <span className="text-sm">GitHub Profile</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={formData.require_leetcode} onCheckedChange={(c) => setFormData({ ...formData, require_leetcode: !!c })} />
            <span className="text-sm">LeetCode Profile</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
        <Button type="submit" className="gradient-accent text-accent-foreground">
          {editJob ? 'Update Job' : 'Post Job'}
        </Button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Listings</h1>
            <p className="text-muted-foreground mt-1">Manage your job postings</p>
          </div>
          <Button className="gradient-accent text-accent-foreground" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{searchQuery ? 'No jobs match your search' : 'No jobs posted yet. Create your first job!'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showApply={false}
                showDelete={true}
                showEdit={true}
                onDelete={() => setDeleteJobId(job.id)}
                onEdit={() => openEditDialog(job)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editJob ? 'Edit Job Posting' : 'Create New Job Posting'}</DialogTitle>
            </DialogHeader>
            {jobForm}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. This will permanently delete the job posting and all associated applications.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteJob} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
