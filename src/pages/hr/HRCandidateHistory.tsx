import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, History, CheckCircle2, XCircle, Clock, ExternalLink, Linkedin, Github, Code2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResumeDownloadButton } from '@/components/candidates/CandidateCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CandidateWithHistory {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  skills: string[];
  experience_years: number;
  bio: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  leetcode_url: string | null;
  applications: {
    id: string;
    status: string;
    created_at: string;
    job: { id: string; title: string };
  }[];
}

export default function HRCandidateHistory() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<CandidateWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithHistory | null>(null);

  useEffect(() => {
    if (profile?.id) fetchCandidates();
  }, [profile?.id]);

  const fetchCandidates = async () => {
    try {
      // Get HR's jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('hr_id', profile!.id);

      if (!jobs || jobs.length === 0) {
        setLoading(false);
        return;
      }

      const jobIds = jobs.map(j => j.id);

      // Get all applications for these jobs with candidate + job info
      const { data: apps, error } = await supabase
        .from('applications')
        .select(`
          id, status, created_at,
          candidate:profiles!applications_candidate_id_fkey (
            id, full_name, email, phone, location, skills, experience_years, bio, resume_url, linkedin_url, github_url, leetcode_url
          ),
          job:jobs!applications_job_id_fkey ( id, title )
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by candidate
      const candidateMap = new Map<string, CandidateWithHistory>();
      for (const app of (apps as any[]) || []) {
        const c = app.candidate;
        if (!candidateMap.has(c.id)) {
          candidateMap.set(c.id, { ...c, applications: [] });
        }
        candidateMap.get(c.id)!.applications.push({
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          job: app.job,
        });
      }

      setCandidates(Array.from(candidateMap.values()));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = candidates.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStats = (c: CandidateWithHistory) => ({
    total: c.applications.length,
    hired: c.applications.filter(a => a.status === 'hired').length,
    rejected: c.applications.filter(a => a.status === 'rejected').length,
    shortlisted: c.applications.filter(a => a.status === 'shortlisted').length,
    pending: c.applications.filter(a => ['applied', 'reviewing'].includes(a.status)).length,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidate History</h1>
          <p className="text-muted-foreground mt-1">Search candidates and view their complete application history</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Candidate List */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-sm text-muted-foreground">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</p>
            {loading ? (
              [1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-muted" />)
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2" />No candidates found</CardContent></Card>
            ) : (
              filtered.map(c => {
                const stats = getStats(c);
                return (
                  <motion.div key={c.id} whileHover={{ scale: 1.01 }}>
                    <Card
                      className={`cursor-pointer transition-all ${selectedCandidate?.id === c.id ? 'ring-2 ring-accent shadow-lg' : 'hover:shadow-md'}`}
                      onClick={() => setSelectedCandidate(c)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-primary-foreground">{c.full_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{stats.total} applied</Badge>
                          {stats.hired > 0 && <Badge className="text-xs bg-success/10 text-success border-success/20">{stats.hired} hired</Badge>}
                          {stats.rejected > 0 && <Badge variant="destructive" className="text-xs">{stats.rejected} rejected</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Candidate Detail */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedCandidate.full_name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{selectedCandidate.email} {selectedCandidate.phone && `· ${selectedCandidate.phone}`}</p>
                        {selectedCandidate.location && <p className="text-xs text-muted-foreground">{selectedCandidate.location}</p>}
                      </div>
                      <Badge variant="secondary">{selectedCandidate.experience_years} yrs exp</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedCandidate.bio && <p className="text-sm text-muted-foreground">{selectedCandidate.bio}</p>}
                    
                    {selectedCandidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    )}

                    {/* Profile Links */}
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.linkedin_url && (
                        <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                          <Linkedin className="w-3 h-3" /> LinkedIn <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedCandidate.github_url && (
                        <a href={selectedCandidate.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                          <Github className="w-3 h-3" /> GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedCandidate.leetcode_url && (
                        <a href={selectedCandidate.leetcode_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                          <Code2 className="w-3 h-3" /> LeetCode <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {selectedCandidate.resume_url && (
                      <ResumeDownloadButton resumeUrl={selectedCandidate.resume_url} />
                    )}

                    {/* Stats */}
                    {(() => {
                      const stats = getStats(selectedCandidate);
                      return (
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center p-3 rounded-lg bg-muted">
                            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Applied</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-success/10">
                            <p className="text-2xl font-bold text-success">{stats.hired}</p>
                            <p className="text-xs text-muted-foreground">Hired</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-accent/10">
                            <p className="text-2xl font-bold text-accent">{stats.shortlisted}</p>
                            <p className="text-xs text-muted-foreground">Shortlisted</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-destructive/10">
                            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
                            <p className="text-xs text-muted-foreground">Rejected</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Application Timeline */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5" /> Application Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCandidate.applications.map((app, idx) => (
                        <div key={app.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              app.status === 'hired' ? 'bg-success' :
                              app.status === 'rejected' ? 'bg-destructive' :
                              app.status === 'shortlisted' ? 'bg-accent' : 'bg-muted-foreground'
                            }`} />
                            {idx < selectedCandidate.applications.length - 1 && <div className="w-px h-8 bg-border" />}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-sm font-medium text-foreground">{app.job.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge variant={app.status as any}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</StatusBadge>
                              <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="shadow-card h-full min-h-[300px] flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a candidate to view their history</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
