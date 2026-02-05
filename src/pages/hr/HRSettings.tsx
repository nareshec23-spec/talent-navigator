 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { User, Mail, Phone, Building2, MapPin, Save } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { useAuth } from '@/hooks/useAuth';
 import { useToast } from '@/hooks/use-toast';
 
 export default function HRSettings() {
   const { profile, updateProfile } = useAuth();
   const { toast } = useToast();
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
     full_name: profile?.full_name || '',
     phone: profile?.phone || '',
     location: profile?.location || '',
     company_name: profile?.company_name || '',
     company_position: profile?.company_position || '',
     bio: profile?.bio || '',
   });
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
       const { error } = await updateProfile(formData);
       if (error) throw error;
 
       toast({ title: 'Success', description: 'Profile updated successfully!' });
     } catch (error: any) {
       toast({
         title: 'Error',
         description: error.message || 'Failed to update profile',
         variant: 'destructive',
       });
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <DashboardLayout>
       <div className="max-w-2xl mx-auto space-y-6">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Settings</h1>
           <p className="text-muted-foreground mt-1">Manage your profile information</p>
         </div>
 
         <Card className="shadow-card">
           <CardHeader>
             <CardTitle>Profile Information</CardTitle>
             <CardDescription>Update your personal and company details</CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     id="email"
                     value={profile?.email || ''}
                     disabled
                     className="pl-10 bg-muted"
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="full_name">Full Name</Label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     id="full_name"
                     value={formData.full_name}
                     onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                     className="pl-10"
                     required
                   />
                 </div>
               </div>
 
               <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="company_name">Company Name</Label>
                   <div className="relative">
                     <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="company_name"
                       value={formData.company_name}
                       onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                       className="pl-10"
                       placeholder="Your company"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="company_position">Your Position</Label>
                   <Input
                     id="company_position"
                     value={formData.company_position}
                     onChange={(e) => setFormData({ ...formData, company_position: e.target.value })}
                     placeholder="e.g. HR Manager"
                   />
                 </div>
               </div>
 
               <div className="grid sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="phone">Phone</Label>
                   <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="phone"
                       value={formData.phone}
                       onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                       className="pl-10"
                       placeholder="+91 9876543210"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="location">Location</Label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="location"
                       value={formData.location}
                       onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                       className="pl-10"
                       placeholder="City, Country"
                     />
                   </div>
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="bio">Bio</Label>
                 <Textarea
                   id="bio"
                   value={formData.bio}
                   onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                   placeholder="Tell us about yourself..."
                   rows={4}
                 />
               </div>
 
               <Button 
                 type="submit" 
                 className="w-full gradient-accent text-accent-foreground"
                 disabled={loading}
               >
                 <Save className="w-4 h-4 mr-2" />
                 {loading ? 'Saving...' : 'Save Changes'}
               </Button>
             </form>
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 }