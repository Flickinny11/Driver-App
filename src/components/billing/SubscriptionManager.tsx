import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  Shield, 
  CheckCircle, 
  ArrowUpCircle,
  Clock
} from 'lucide-react';
import { StripeManager } from '@/payment/StripeManager';
import type { PricingPlan, UsageStats, Subscription } from '@/types';

interface SubscriptionManagerProps {
  user?: any;
  subscription?: Subscription;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  user, 
  subscription 
}) => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [stripeManager] = useState(() => new StripeManager());

  const plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      operations: 1000,
      features: [
        '1,000 AI operations/month',
        '10 active projects',
        'Symphony mode',
        'GitHub integration',
        'Community support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      operations: 5000,
      features: [
        '5,000 AI operations/month',
        'Unlimited projects',
        'Orchestra mode (2x faster)',
        'All AI models',
        'Priority support',
        'Team collaboration (3 users)'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      operations: Infinity,
      features: [
        'Unlimited AI operations',
        'Custom agent training',
        'Dedicated support',
        'SLA guarantee',
        'Unlimited team members',
        'On-premise option'
      ]
    }
  ];

  useEffect(() => {
    const loadUsageStats = async () => {
      if (user) {
        const stats = await stripeManager.getUsageStats(user.id);
        setUsage(stats);
      }
    };

    loadUsageStats();
  }, [user, stripeManager]);

  const handlePlanSelect = async (plan: PricingPlan) => {
    if (!user) return;

    try {
      // Create customer if needed
      const customerId = await stripeManager.createCustomer(user);
      
      // Create subscription
      const newSubscription = await stripeManager.createSubscription(customerId, plan);
      
      console.log('Subscription created:', newSubscription);
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const getDaysUntilRenewal = (subscription?: Subscription): number => {
    if (!subscription) return 0;
    const now = new Date();
    const renewalDate = subscription.currentPeriodEnd;
    const diffTime = renewalDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Current Plan */}
      <motion.div 
        className="bg-gray-800 rounded-xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Your Plan</h2>
          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            {subscription?.plan || 'Free Trial'}
          </span>
        </div>
        
        {/* Usage Chart */}
        <UsageChart usage={usage} limit={subscription?.operations} />
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard 
            label="Operations Used" 
            value={usage?.operationsUsed || 0} 
            total={subscription?.operations || 100}
            icon={<Zap className="h-5 w-5" />}
          />
          <StatCard 
            label="Projects" 
            value={usage?.projectCount || 0}
            icon={<Shield className="h-5 w-5" />}
          />
          <StatCard 
            label="Team Members" 
            value={usage?.teamMembers || 1}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard 
            label="Days Left" 
            value={getDaysUntilRenewal(subscription)}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>
      </motion.div>
      
      {/* Pricing Plans */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          Upgrade Your Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              current={subscription?.plan === plan.id}
              onSelect={() => handlePlanSelect(plan)}
              delay={index * 0.1}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Usage Top-ups */}
      <motion.div 
        className="bg-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Need More Operations?
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <TopUpOption amount={10} operations={500} />
          <TopUpOption amount={25} operations={1500} />
          <TopUpOption amount={50} operations={3500} />
          <TopUpOption amount={100} operations={8000} />
        </div>
      </motion.div>
    </div>
  );
};

interface UsageChartProps {
  usage?: UsageStats | null;
  limit?: number;
}

const UsageChart: React.FC<UsageChartProps> = ({ usage, limit }) => {
  const percentage = limit && usage ? (usage.operationsUsed / limit) * 100 : 0;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>AI Operations This Month</span>
        <span>{usage?.operationsUsed || 0} / {limit || '∞'}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <motion.div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0</span>
        <span>{limit || 'Unlimited'}</span>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  total?: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, total, icon }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className="text-blue-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">
        {value.toLocaleString()}
        {total && (
          <span className="text-sm text-gray-400 ml-1">
            / {total.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

interface PricingCardProps {
  plan: PricingPlan;
  current: boolean;
  onSelect: () => void;
  delay?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  plan, 
  current, 
  onSelect, 
  delay = 0 
}) => {
  const isPopular = plan.id === 'professional';
  
  return (
    <motion.div 
      className={`relative bg-gray-800 rounded-xl p-6 border ${
        isPopular 
          ? 'border-blue-500 ring-2 ring-blue-500/20' 
          : 'border-gray-700'
      } ${current ? 'opacity-50' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
        <div className="text-3xl font-bold text-white">
          ${plan.price}
          <span className="text-sm text-gray-400">/month</span>
        </div>
      </div>
      
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-300">
            <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      
      <button
        onClick={onSelect}
        disabled={current}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          current
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        {current ? 'Current Plan' : 'Upgrade Now'}
      </button>
    </motion.div>
  );
};

interface TopUpOptionProps {
  amount: number;
  operations: number;
}

const TopUpOption: React.FC<TopUpOptionProps> = ({ amount, operations }) => {
  return (
    <motion.div 
      className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-white mb-1">
          ${amount}
        </div>
        <div className="text-sm text-gray-400 mb-3">
          {operations.toLocaleString()} operations
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <ArrowUpCircle className="h-4 w-4 inline mr-1" />
          Add
        </button>
      </div>
    </motion.div>
  );
};

export default SubscriptionManager;