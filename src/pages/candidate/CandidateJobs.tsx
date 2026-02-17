import { useEffect, useState } from 'react';
import { Search, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobCard } from '@/components/jobs/JobCard';
import { ApplyDialog } from '@/components/jobs/ApplyDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
}

export default function CandidateJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [applyDialog, setApplyDialog] = useState<{ open: boolean; job: Job | null }>({ open: false, job: null });

  useEffect(() => {
    fetchJobs();
    if (profile?.id) {
      fetchAppliedJobs();
    }
  }, [profile?.id]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data as Job[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('job_id')
        .eq('candidate_id', profile!.id);

      if (error) throw error;
      setAppliedJobIds(data.map(app => app.job_id));
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesEmployment = employmentFilter === 'all' || job.employment_type === employmentFilter;
    const matchesLocation = locationFilter === 'all' || job.location_type === locationFilter;
    return matchesSearch && matchesEmployment && matchesLocation;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Find Jobs</h1>
          <p className="text-muted-foreground mt-1">Discover your next career opportunity</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="abroad">Abroad</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {jobs.length === 0
                  ? 'No jobs available at the moment. Check back later!'
                  : 'No jobs match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showApply={!appliedJobIds.includes(job.id)}
                onApply={() => setApplyDialog({ open: true, job })}
              />
            ))}
          </div>
        )}

        <ApplyDialog
          open={applyDialog.open}
          onOpenChange={(open) => setApplyDialog({ open, job: open ? applyDialog.job : null })}
          job={applyDialog.job}
          onSuccess={(jobId) => setAppliedJobIds(prev => [...prev, jobId])}
        />
      </div>
    </DashboardLayout>
  );
}
