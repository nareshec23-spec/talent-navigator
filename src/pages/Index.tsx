import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === 'hr' ? '/hr' : '/candidate');
    }
  }, [user, profile, loading, navigate]);

  const features = [
    { icon: Briefcase, title: 'Post Jobs Easily', description: 'Create job listings with filters for employment type, location, and more' },
    { icon: Users, title: 'Manage Candidates', description: 'Review applications, shortlist, and hire the best talent' },
    { icon: BarChart3, title: 'Compare Side-by-Side', description: 'Analyze multiple candidates with our comparison tool' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
              <Briefcase className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl">TalentFlow</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Sign In
            </Button>
          </Link>
        </nav>

        <div className="container mx-auto px-4 py-20 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Hire Smarter.
            <span className="text-gradient"> Grow Faster.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8"
          >
            The complete talent analytics platform for modern HR teams and job seekers
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth">
              <Button size="lg" className="gradient-accent text-accent-foreground shadow-glow">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border border-border bg-card shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground">
        <p>&copy; 2025 TalentFlow. Built with Lovable.</p>
      </footer>
    </div>
  );
};

export default Index;
