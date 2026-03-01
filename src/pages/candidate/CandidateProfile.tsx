import { useState, useRef } from 'react';
import { User, Mail, Phone, MapPin, Save, Briefcase, FileText, Linkedin, Github, Code2, Camera, Loader2, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function CandidateProfile() {
  const { profile, user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    experience_years: profile?.experience_years?.toString() || '0',
    skills: profile?.skills?.join(', ') || '',
    bio: profile?.bio || '',
    linkedin_url: (profile as any)?.linkedin_url || '',
    github_url: (profile as any)?.github_url || '',
    leetcode_url: (profile as any)?.leetcode_url || '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: urlData.publicUrl } as any);
      toast({ title: 'Success', description: 'Profile image updated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const { error } = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone || null,
        location: formData.location || null,
        experience_years: parseInt(formData.experience_years) || 0,
        skills: skillsArray,
        bio: formData.bio || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        leetcode_url: formData.leetcode_url || null,
      } as any);
      if (error) throw error;
      toast({ title: 'Success', description: 'Profile updated successfully!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch joining date from applications
  const [joiningDate, setJoiningDate] = useState<string | null>(null);
  useState(() => {
    if (profile?.id) {
      supabase.from('applications').select('joining_date').eq('candidate_id', profile.id).eq('status', 'hired').not('joining_date', 'is', null).limit(1).single()
        .then(({ data }) => { if (data?.joining_date) setJoiningDate(data.joining_date); });
    }
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Keep your profile updated to improve your chances</p>
        </div>

        {/* Avatar Section */}
        <Card className="shadow-card">
          <CardContent className="py-6 flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={avatarUploading}
              >
                {avatarUploading ? <Loader2 className="w-5 h-5 animate-spin text-foreground" /> : <Camera className="w-5 h-5 text-foreground" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-foreground">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {joiningDate && (
                <p className="text-xs text-accent mt-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Joining: {new Date(joiningDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>This information will be shared with employers when you apply</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" value={profile?.email || ''} disabled className="pl-10 bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="pl-10" required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="pl-10" placeholder="+91 9876543210" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="pl-10" placeholder="City, Country" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Years of Experience</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="experience_years" type="number" min="0" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="skills" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="pl-10" placeholder="React, TypeScript, Node.js..." />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Summary</Label>
                <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell employers about yourself..." rows={4} />
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground">Profile Links</h3>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="linkedin_url" value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} className="pl-10" placeholder="https://linkedin.com/in/yourprofile" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="github_url" value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} className="pl-10" placeholder="https://github.com/yourusername" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leetcode_url">LeetCode</Label>
                  <div className="relative">
                    <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="leetcode_url" value={formData.leetcode_url} onChange={(e) => setFormData({ ...formData, leetcode_url: e.target.value })} className="pl-10" placeholder="https://leetcode.com/yourusername" />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-accent text-accent-foreground" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
