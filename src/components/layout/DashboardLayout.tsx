 import { ReactNode } from 'react';
 import { Link, useLocation, useNavigate } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { 
   LayoutDashboard, 
   Briefcase, 
   Users, 
   FileText, 
   Settings, 
   LogOut,
   Search,
   BarChart3,
   Menu,
   X
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { useAuth } from '@/hooks/useAuth';
 import { useState } from 'react';
 import { cn } from '@/lib/utils';
 
 interface DashboardLayoutProps {
   children: ReactNode;
 }
 
 const hrNavItems = [
   { icon: LayoutDashboard, label: 'Dashboard', href: '/hr' },
   { icon: Briefcase, label: 'Jobs', href: '/hr/jobs' },
   { icon: Users, label: 'Candidates', href: '/hr/candidates' },
   { icon: BarChart3, label: 'Compare', href: '/hr/compare' },
   { icon: Settings, label: 'Settings', href: '/hr/settings' },
 ];
 
 const candidateNavItems = [
   { icon: LayoutDashboard, label: 'Dashboard', href: '/candidate' },
   { icon: Search, label: 'Find Jobs', href: '/candidate/jobs' },
   { icon: FileText, label: 'Applications', href: '/candidate/applications' },
   { icon: Settings, label: 'Profile', href: '/candidate/profile' },
 ];
 
 export function DashboardLayout({ children }: DashboardLayoutProps) {
   const { profile, signOut } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [sidebarOpen, setSidebarOpen] = useState(false);
 
   const isHR = profile?.role === 'hr';
   const navItems = isHR ? hrNavItems : candidateNavItems;
 
   const handleSignOut = async () => {
     await signOut();
     navigate('/');
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       {/* Mobile overlay */}
       {sidebarOpen && (
         <div 
           className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
           onClick={() => setSidebarOpen(false)}
         />
       )}
 
       {/* Sidebar */}
       <aside className={cn(
         "fixed lg:static inset-y-0 left-0 z-50 w-64 gradient-hero text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:transform-none",
         sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
       )}>
         <div className="flex flex-col h-full">
           {/* Logo */}
           <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
             <Link to="/" className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                 <Briefcase className="w-4 h-4 text-accent-foreground" />
               </div>
               <span className="font-semibold text-lg">TalentFlow</span>
             </Link>
             <button 
               onClick={() => setSidebarOpen(false)}
               className="lg:hidden p-1 hover:bg-sidebar-accent rounded"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
 
           {/* Navigation */}
           <nav className="flex-1 px-4 py-6 space-y-1">
             {navItems.map((item) => {
               const isActive = location.pathname === item.href;
               return (
                 <Link
                   key={item.href}
                   to={item.href}
                   onClick={() => setSidebarOpen(false)}
                   className={cn(
                     "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                     isActive 
                       ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" 
                       : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                   )}
                 >
                   <item.icon className="w-5 h-5" />
                   {item.label}
                 </Link>
               );
             })}
           </nav>
 
           {/* User section */}
           <div className="p-4 border-t border-sidebar-border">
             <div className="flex items-center gap-3 px-3 py-2">
               <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                 <span className="text-sm font-medium">
                   {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                 </span>
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                 <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{profile?.role}</p>
               </div>
             </div>
             <Button
               variant="ghost"
               onClick={handleSignOut}
               className="w-full mt-2 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
             >
               <LogOut className="w-4 h-4 mr-2" />
               Sign Out
             </Button>
           </div>
         </div>
       </aside>
 
       {/* Main content */}
       <main className="flex-1 flex flex-col min-h-screen">
         {/* Top bar */}
         <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-sm border-b border-border px-4 lg:px-6 flex items-center gap-4">
           <button
             onClick={() => setSidebarOpen(true)}
             className="lg:hidden p-2 hover:bg-muted rounded-lg"
           >
             <Menu className="w-5 h-5" />
           </button>
           <div className="flex-1" />
         </header>
 
         {/* Page content */}
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="flex-1 p-4 lg:p-6"
         >
           {children}
         </motion.div>
       </main>
     </div>
   );
 }