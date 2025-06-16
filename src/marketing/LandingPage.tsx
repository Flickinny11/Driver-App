import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  Smartphone, 
  ArrowRight, 
  Check,
  Code,
  Cpu,
  Shield,
  Rocket,
  Star
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <ParticleBackground />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              Build Apps at the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                {' '}Speed of Thought
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-8">
              AI agents build production-ready apps while you watch.
              No placeholders. No TODOs. Just real, working code.
            </p>
            
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-blue-600 rounded-full text-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                Start Building Free
                <ArrowRight className="h-5 w-5" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border border-gray-700 rounded-full text-lg font-semibold hover:border-gray-600"
              >
                Watch Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
        
        {/* Floating UI Preview */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 hidden lg:block">
          <FloatingUIPreview />
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-5xl font-bold text-center mb-20"
          >
            Beyond BlackBoxAI
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="h-8 w-8" />}
              title="30 AI Agents"
              description="Orchestra mode with 30 specialized agents working in parallel"
              delay={0}
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8" />}
              title="150% Faster"
              description="Build complete apps in minutes, not hours"
              delay={0.1}
            />
            <FeatureCard 
              icon={<Smartphone className="h-8 w-8" />}
              title="iOS Deployment"
              description="Sign and install iOS apps directly on your device"
              delay={0.2}
            />
            <FeatureCard 
              icon={<Code className="h-8 w-8" />}
              title="Real Code"
              description="No placeholders or templates - genuine production code"
              delay={0.3}
            />
            <FeatureCard 
              icon={<Cpu className="h-8 w-8" />}
              title="Vision AI"
              description="Generate apps from screenshots and designs"
              delay={0.4}
            />
            <FeatureCard 
              icon={<Shield className="h-8 w-8" />}
              title="Enterprise Ready"
              description="SOC2 compliant with enterprise security standards"
              delay={0.5}
            />
          </div>
        </div>
      </section>
      
      {/* Comparison Table */}
      <section className="py-32 bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-20">
            Driver vs BlackBoxAI
          </h2>
          <ComparisonTable />
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-20">
            Simple, Transparent Pricing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard 
              name="Starter"
              price={19}
              description="Perfect for individuals and small projects"
              features={[
                "1,000 AI operations/month",
                "10 active projects",
                "Symphony mode",
                "GitHub integration",
                "Community support"
              ]}
              buttonText="Start Free Trial"
              popular={false}
            />
            
            <PricingCard 
              name="Professional"
              price={49}
              description="Ideal for teams and serious developers"
              features={[
                "5,000 AI operations/month",
                "Unlimited projects",
                "Orchestra mode (2x faster)",
                "All AI models",
                "Priority support",
                "Team collaboration (3 users)"
              ]}
              buttonText="Upgrade Now"
              popular={true}
            />
            
            <PricingCard 
              name="Enterprise"
              price={199}
              description="For organizations requiring scale"
              features={[
                "Unlimited AI operations",
                "Custom agent training",
                "Dedicated support",
                "SLA guarantee",
                "Unlimited team members",
                "On-premise option"
              ]}
              buttonText="Contact Sales"
              popular={false}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8">
            Ready to Build Faster?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of developers building production-ready apps
            with AI. No credit card required.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xl font-semibold flex items-center gap-2 mx-auto"
          >
            <Rocket className="h-6 w-6" />
            Start Building Now
          </motion.button>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors"
    >
      <div className="text-blue-500 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

const ComparisonTable: React.FC = () => {
  const features = [
    { feature: "Build Speed", driver: "2-5 minutes", blackbox: "10-30 minutes" },
    { feature: "Agent Count", driver: "30 specialized", blackbox: "Single agent" },
    { feature: "iOS Deployment", driver: "✓ Built-in", blackbox: "✗ Manual setup" },
    { feature: "Real Code Output", driver: "✓ Production ready", blackbox: "✗ Placeholders" },
    { feature: "Vision AI", driver: "✓ Advanced", blackbox: "✗ Limited" },
    { feature: "Live Preview", driver: "✓ 6 windows", blackbox: "✗ Basic preview" },
    { feature: "Profit Margin", driver: "600%", blackbox: "Unknown" }
  ];

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-700">
            <th className="text-left p-4">Feature</th>
            <th className="text-center p-4">Driver</th>
            <th className="text-center p-4">BlackBoxAI</th>
          </tr>
        </thead>
        <tbody>
          {features.map((row, index) => (
            <motion.tr
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-t border-gray-700 hover:bg-gray-750"
            >
              <td className="p-4 font-medium">{row.feature}</td>
              <td className="p-4 text-center text-green-400">{row.driver}</td>
              <td className="p-4 text-center text-gray-400">{row.blackbox}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface PricingCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  buttonText: string;
  popular: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  name, 
  price, 
  description, 
  features, 
  buttonText, 
  popular 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className={`relative bg-gray-800 rounded-xl p-8 ${
        popular ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Star className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        <div className="text-4xl font-bold">
          ${price}
          <span className="text-lg text-gray-400">/month</span>
        </div>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-300">
            <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          popular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
};

const ParticleBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated background particles would go here */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
    </div>
  );
};

const FloatingUIPreview: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="relative"
    >
      {/* Mock floating UI elements */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
        <div className="h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
          <Code className="h-16 w-16 text-blue-500" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 bg-gray-700 rounded w-3/4" />
          <div className="h-2 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;