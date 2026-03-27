import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Maximize, 
  Minimize, 
  MessageSquare,
  Sparkles,
  Brain,
  Users,
  TrendingUp,
  Calculator,
  Shield,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  Key,
  Save,
  AlertCircle
} from 'lucide-react';
import { Role } from '../types';

interface AIChatbotProps {
  role: Role;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with greeting message when component mounts or role changes
    if (messages.length === 0) {
      const greetingMessage: Message = {
        id: '1',
        text: `Hello! I'm Robort, your AI assistant. I can help you with ${getRoleSpecificGreeting(role)}. How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
    }
  }, [role]);

  const getRoleSpecificGreeting = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'managing the entire insurance system, policy oversight, and business analytics';
      case 'MARKETER':
        return 'marketing campaigns, lead generation, and client acquisition strategies';
      case 'SALES_AGENT':
        return 'sales targets, client management, and policy sales';
      case 'ACCOUNTANT':
        return 'financial management, billing, and accounting operations';
      default:
        return 'your insurance management tasks';
    }
  };

  const getRoleSpecificResponses = (role: Role, query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Common responses for all roles
    if (lowerQuery.includes('help') || lowerQuery.includes('support')) {
      return getHelpResponse(role);
    }
    
    if (lowerQuery.includes('policy') || lowerQuery.includes('policies')) {
      return getPolicyResponse(role);
    }
    
    if (lowerQuery.includes('client') || lowerQuery.includes('customer')) {
      return getClientResponse(role);
    }
    
    if (lowerQuery.includes('report') || lowerQuery.includes('analytics')) {
      return getReportResponse(role);
    }

    // Role-specific responses
    switch (role) {
      case 'SUPER_ADMIN':
        return getSuperAdminResponse(lowerQuery);
      case 'MARKETER':
        return getMarketerResponse(lowerQuery);
      case 'SALES_AGENT':
        return getSalesAgentResponse(lowerQuery);
      case 'ACCOUNTANT':
        return getAccountantResponse(lowerQuery);
      default:
        return getDefaultResponse();
    }
  };

  const getHelpResponse = (role: Role) => {
    const baseHelp = "Here are some things I can help you with:\n\n";
    
    switch (role) {
      case 'SUPER_ADMIN':
        return baseHelp + "• View system analytics and reports\n• Manage user roles and permissions\n• Configure system settings\n• Monitor policy performance\n• Generate business insights";
      case 'MARKETER':
        return baseHelp + "• Create and manage marketing campaigns\n• Analyze lead generation metrics\n• Track campaign performance\n• Generate marketing reports\n• Optimize marketing strategies";
      case 'SALES_AGENT':
        return baseHelp + "• View client information and history\n• Track sales performance\n• Manage policy renewals\n• Generate sales reports\n• Client follow-up reminders";
      case 'ACCOUNTANT':
        return baseHelp + "• Manage billing and payments\n• Generate financial reports\n• Track commissions and payouts\n• Monitor account receivables\n• Financial analytics and insights";
      default:
        return baseHelp + "• View dashboard and analytics\n• Access reports and insights\n• Get system information\n• Find help and support";
    }
  };

  const getPolicyResponse = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return "As Super Admin, you can:\n• View all policies across the system\n• Monitor policy performance and renewals\n• Generate policy analytics reports\n• Set policy pricing and terms\n• Approve policy changes";
      case 'MARKETER':
        return "For marketing purposes:\n• View policy types for campaign targeting\n• Analyze which policies are most popular\n• Create marketing materials for different policy types\n• Track policy interest from leads";
      case 'SALES_AGENT':
        return "For sales management:\n• View client policy details and history\n• Track policy renewals and expirations\n• Generate policy quotes and proposals\n• Manage policy modifications and endorsements";
      case 'ACCOUNTANT':
        return "For financial management:\n• View policy billing and payment status\n• Track policy commissions and payouts\n• Monitor policy revenue and receivables\n• Generate policy financial reports";
      default:
        return "Policy management features are available based on your role permissions.";
    }
  };

  const getClientResponse = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return "Client management for Super Admin:\n• View all clients across the system\n• Monitor client satisfaction and retention\n• Analyze client demographics and trends\n• Manage client service issues\n• Generate client relationship reports";
      case 'MARKETER':
        return "Client acquisition and engagement:\n• View lead conversion rates\n• Track client acquisition costs\n• Analyze client demographics for targeting\n• Monitor campaign effectiveness\n• Generate lead generation reports";
      case 'SALES_AGENT':
        return "Client relationship management:\n• View your assigned clients\n• Track client interactions and history\n• Manage client communications\n• Monitor client satisfaction and renewals\n• Generate client service reports";
      case 'ACCOUNTANT':
        return "Client financial management:\n• View client billing and payment history\n• Track client account status\n• Manage client invoices and statements\n• Monitor client payment patterns\n• Generate client financial reports";
      default:
        return "Client management features are available based on your role permissions.";
    }
  };

  const getReportResponse = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return "Available reports for Super Admin:\n• System performance analytics\n• Financial overview and trends\n• Policy performance and renewals\n• User activity and productivity\n• Business intelligence dashboards";
      case 'MARKETER':
        return "Marketing reports available:\n• Campaign performance analytics\n• Lead generation metrics\n• Conversion rate analysis\n• Marketing ROI reports\n• Customer acquisition cost analysis";
      case 'SALES_AGENT':
        return "Sales performance reports:\n• Personal sales metrics and targets\n• Client portfolio analysis\n• Policy renewal tracking\n• Sales pipeline reports\n• Commission and earnings reports";
      case 'ACCOUNTANT':
        return "Financial and accounting reports:\n• Revenue and expense analysis\n• Accounts receivable aging\n• Commission payout reports\n• Financial statements and summaries\n• Tax and compliance reports";
      default:
        return "Report access is based on your role permissions.";
    }
  };

  const getSuperAdminResponse = (query: string) => {
    if (query.includes('analytics') || query.includes('performance')) {
      return "I can help you access system analytics. Navigate to the Dashboard to view:\n• Revenue trends and financial performance\n• Policy distribution and performance metrics\n• User activity and productivity reports\n• System health and operational metrics";
    }
    if (query.includes('user') || query.includes('role')) {
      return "User and role management:\n• Add new users through Settings > User Management\n• Assign roles and permissions\n• Monitor user activity and access\n• Configure role-based access controls";
    }
    if (query.includes('settings') || query.includes('configuration')) {
      return "System configuration options:\n• SMS API settings (Super Admin only)\n• User role management\n• System preferences and defaults\n• Integration settings for external services";
    }
    return "As Super Admin, you have access to all system features. Use the sidebar navigation to access:\n• Dashboard for system overview\n• Settings for system configuration\n• Reports for analytics and insights";
  };

  const getMarketerResponse = (query: string) => {
    if (query.includes('campaign') || query.includes('marketing')) {
      return "Marketing campaign management:\n• Create new campaigns in the Marketing section\n• Track campaign performance metrics\n• Analyze lead generation effectiveness\n• View campaign ROI and conversion rates";
    }
    if (query.includes('lead') || query.includes('prospect')) {
      return "Lead management features:\n• View all leads in the Leads section\n• Track lead conversion rates\n• Monitor lead source effectiveness\n• Generate lead quality reports";
    }
    if (query.includes('target') || query.includes('audience')) {
      return "Target audience analysis:\n• View client demographics in Reports\n• Analyze policy preferences by region\n• Identify high-value customer segments\n• Create targeted marketing strategies";
    }
    return "As a Marketer, focus on:\n• Leads section for prospect management\n• Performance section for campaign analytics\n• Dashboard for marketing insights\n• Reports for strategic planning";
  };

  const getSalesAgentResponse = (query: string) => {
    if (query.includes('sale') || query.includes('target')) {
      return "Sales performance tracking:\n• View your sales metrics in the Dashboard\n• Track progress toward sales targets\n• Monitor client conversion rates\n• Analyze sales pipeline and opportunities";
    }
    if (query.includes('commission') || query.includes('earnings')) {
      return "Commission and earnings:\n• View commission details in Accounts section\n• Track sales performance and payouts\n• Monitor pending and completed commissions\n• Generate earnings reports";
    }
    if (query.includes('renewal') || query.includes('expire')) {
      return "Policy renewals and expirations:\n• View expiring policies in Dashboard\n• Set up renewal reminders\n• Track renewal conversion rates\n• Manage policy extensions and updates";
    }
    return "As a Sales Agent, use:\n• Dashboard for sales performance overview\n• Clients section for client management\n• Policies section for policy details\n• Accounts for commission tracking";
  };

  const getAccountantResponse = (query: string) => {
    if (query.includes('payment') || query.includes('billing')) {
      return "Payment and billing management:\n• View all payments in Accounts section\n• Track billing status and due dates\n• Monitor payment processing\n• Generate billing reports and statements";
    }
    if (query.includes('commission') || query.includes('payout')) {
      return "Commission processing:\n• View agent commission calculations\n• Track commission payment status\n• Generate commission reports\n• Monitor pending payouts and distributions";
    }
    if (query.includes('financial') || query.includes('revenue')) {
      return "Financial management features:\n• View revenue and expense reports\n• Track financial performance metrics\n• Monitor accounts receivable and payable\n• Generate financial statements and summaries";
    }
    return "As an Accountant, access:\n• Accounts section for financial management\n• Dashboard for financial overview\n• Reports for detailed analytics\n• Settings for financial configurations";
  };

  const getDefaultResponse = () => {
    return "I can help you navigate the insurance management system. Please let me know what specific information or task you need assistance with.";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getRoleSpecificResponses(role, inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getBotIcon = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Settings size={20} />;
      case 'MARKETER':
        return <TrendingUp size={20} />;
      case 'SALES_AGENT':
        return <Users size={20} />;
      case 'ACCOUNTANT':
        return <Calculator size={20} />;
      default:
        return <Brain size={20} />;
    }
  };

  const getBotColor = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'text-purple-600 bg-purple-500';
      case 'MARKETER':
        return 'text-blue-600 bg-blue-500';
      case 'SALES_AGENT':
        return 'text-green-600 bg-green-500';
      case 'ACCOUNTANT':
        return 'text-orange-600 bg-orange-500';
      default:
        return 'text-gray-600 bg-gray-500';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
          getBotColor()
        } hover:scale-110 hover:shadow-xl`}
        title="Open AI Assistant"
      >
        <Bot size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getBotColor()}`}>
              {getBotIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Robort AI Assistant</h3>
              <p className="text-xs text-slate-500 capitalize">{role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize size={18} /> : <Minimize size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-brand-200' : 'text-slate-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-800 shadow-sm border border-slate-200 px-4 py-2 rounded-2xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatbot;