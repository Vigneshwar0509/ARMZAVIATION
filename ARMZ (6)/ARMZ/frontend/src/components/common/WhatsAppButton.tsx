import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, Send, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/src/store/authStore';
import { useApplications, useDashboardStats, useJobs, useSavedJobs } from '@/src/hooks/useQueries';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/src/services/api';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface UserChatContext {
  userName: string;
  role: string;
  totalJobs: number;
  internshipCount: number;
  totalApplications: number;
  interviewScheduledCount: number;
  inReviewCount: number;
  savedJobsCount: number;
  upcomingEventsCount: number;
  nextEvent?: string;
  unreadNotifications: number;
  enrolledCoursesCount: number;
  profileStrength: number;
  totalHires?: number;
  activeUsers?: number;
  newLeads?: number;
  platformScore?: number;
}

interface QuickQuestion {
  id: string;
  label: string;
  answer: string;
}

const formatDateShort = (value?: string) => {
  if (!value) return 'TBD';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getStatusCount = (applications: any[], matcher: (status: string) => boolean) =>
  applications.filter((app: any) => matcher(String(app?.status || '').toLowerCase())).length;

const buildStudentQuestions = (ctx: UserChatContext): QuickQuestion[] => [
  {
    id: 'weekly-focus',
    label: 'What should I focus on this week?',
    answer:
      `This week focus plan for ${ctx.userName}:\n` +
      `1) Follow up on ${ctx.inReviewCount} in-review applications.\n` +
      `2) Prepare for ${ctx.interviewScheduledCount} upcoming interview(s).\n` +
      `3) Apply to at least 2 of ${ctx.totalJobs} open roles to keep your pipeline active.\n` +
      `4) Improve profile strength from ${ctx.profileStrength}% to boost recruiter visibility.`
  },
  {
    id: 'application-updates',
    label: 'Show my application updates',
    answer:
      `Your latest application snapshot:\n` +
      `- Total applications: ${ctx.totalApplications}\n` +
      `- In review: ${ctx.inReviewCount}\n` +
      `- Interview scheduled: ${ctx.interviewScheduledCount}\n` +
      `Recommended next step: tailor resume bullets for roles still in review and prepare interview stories for scheduled rounds.`
  },
  {
    id: 'job-opportunities',
    label: 'Any new job opportunities for me?',
    answer:
      `You currently have ${ctx.totalJobs} open opportunities, including ${ctx.internshipCount} internships and ${ctx.savedJobsCount} saved role(s).\n` +
      `Best move: prioritize quick applications to your saved roles first, then target high-match internship/full-time listings.`
  },
  {
    id: 'events-webinars',
    label: 'Tell me my upcoming events and webinars',
    answer:
      ctx.upcomingEventsCount > 0
        ? `You have ${ctx.upcomingEventsCount} upcoming event/webinar update(s). Next highlight: ${ctx.nextEvent || 'Upcoming session soon'}.\nSet reminders and prepare 2 networking questions before joining.`
        : 'No upcoming events found right now. Keep notifications enabled so you can join the next live masterclass quickly.'
  },
  {
    id: 'study-progress',
    label: 'How is my study and career progress?',
    answer:
      `Progress summary:\n` +
      `- Profile strength: ${ctx.profileStrength}%\n` +
      `- Enrolled courses: ${ctx.enrolledCoursesCount}\n` +
      `- Active applications: ${ctx.totalApplications}\n` +
      `- Unread alerts: ${ctx.unreadNotifications}\n` +
      `You are building momentum. Next milestone: complete one learning module and submit one new targeted application.`
  },
];

const buildEmployerQuestions = (ctx: UserChatContext): QuickQuestion[] => [
  {
    id: 'hiring-priority',
    label: 'What should be my hiring priority this week?',
    answer:
      `Hiring priority plan for ${ctx.userName}:\n` +
      `1) Review ${ctx.inReviewCount} in-review applicants first.\n` +
      `2) Move ${ctx.interviewScheduledCount} interview-stage candidates to final decisions faster.\n` +
      `3) Re-promote high-demand openings from your ${ctx.totalJobs} active listings to increase top-of-funnel quality.`
  },
  {
    id: 'pipeline-health',
    label: 'Show my recruitment pipeline health',
    answer:
      `Recruitment pipeline snapshot:\n` +
      `- Active jobs: ${ctx.totalJobs}\n` +
      `- Total applicants: ${ctx.totalApplications}\n` +
      `- In review: ${ctx.inReviewCount}\n` +
      `- Interview stage: ${ctx.interviewScheduledCount}\n` +
      `- Hires closed: ${ctx.totalHires ?? 0}\n` +
      `Recommendation: keep interviews-to-offer turnaround under 72 hours for better candidate conversion.`
  },
  {
    id: 'top-opportunity',
    label: 'Where can I improve hiring conversion?',
    answer:
      `Best conversion lever right now:\n` +
      `- You have ${ctx.inReviewCount} candidates waiting in review.\n` +
      `- Scheduling quality interviews for top profiles can increase close rate quickly.\n` +
      `- Add skill-based screening to new applicants from your ${ctx.totalJobs} open roles to improve shortlist quality.`
  },
  {
    id: 'events-partnerships',
    label: 'Any upcoming events for employer branding?',
    answer:
      ctx.upcomingEventsCount > 0
        ? `You have ${ctx.upcomingEventsCount} upcoming event/webinar opportunity(ies). Next highlight: ${ctx.nextEvent || 'Upcoming networking session soon'}.\nUse it for talent branding and faster high-intent applicant capture.`
        : 'No upcoming events found right now. Consider launching a hiring webinar to improve top-funnel employer visibility.'
  },
  {
    id: 'alerts-summary',
    label: 'Summarize my urgent updates',
    answer:
      `Urgent update summary:\n` +
      `- Unread alerts: ${ctx.unreadNotifications}\n` +
      `- In-review candidates: ${ctx.inReviewCount}\n` +
      `- Interview-ready candidates: ${ctx.interviewScheduledCount}\n` +
      `Next move: clear review queue, then finalize top interview outcomes to keep hiring velocity high.`
  },
];

const buildAdminQuestions = (ctx: UserChatContext): QuickQuestion[] => [
  {
    id: 'platform-priority',
    label: 'What should be the admin focus this week?',
    answer:
      `Admin focus plan for ${ctx.userName}:\n` +
      `1) Monitor platform health score (${ctx.platformScore ?? 0}/100).\n` +
      `2) Track growth funnel: ${ctx.totalApplications} applications and ${ctx.newLeads ?? 0} new leads.\n` +
      `3) Support hiring ecosystem across ${ctx.totalJobs} active jobs and ${ctx.activeUsers ?? 0} active users.`
  },
  {
    id: 'platform-kpis',
    label: 'Show today’s platform KPI summary',
    answer:
      `Platform KPI snapshot:\n` +
      `- Active users: ${ctx.activeUsers ?? 0}\n` +
      `- Active jobs: ${ctx.totalJobs}\n` +
      `- Applications: ${ctx.totalApplications}\n` +
      `- Hires: ${ctx.totalHires ?? 0}\n` +
      `- New leads: ${ctx.newLeads ?? 0}\n` +
      `- Platform score: ${ctx.platformScore ?? 0}/100`
  },
  {
    id: 'growth-health',
    label: 'How is growth and conversion performing?',
    answer:
      `Growth health update:\n` +
      `- Candidate demand remains active with ${ctx.totalApplications} applications.\n` +
      `- Lead intake currently at ${ctx.newLeads ?? 0}.\n` +
      `- Focus on faster lead-to-application conversion and role-level funnel optimization.`
  },
  {
    id: 'operations-risk',
    label: 'Any operational risks I should watch?',
    answer:
      `Operational watchlist:\n` +
      `- Unread alerts: ${ctx.unreadNotifications}\n` +
      `- Platform score: ${ctx.platformScore ?? 0}/100\n` +
      `- Upcoming events: ${ctx.upcomingEventsCount}\n` +
      `Risk control: keep response SLAs tight and resolve high-priority notifications first.`
  },
  {
    id: 'executive-brief',
    label: 'Give me an executive brief in 30 seconds',
    answer:
      `Executive brief:\n` +
      `ARMZ currently has ${ctx.totalJobs} active jobs, ${ctx.totalApplications} applications, ${ctx.totalHires ?? 0} hires, and ${ctx.activeUsers ?? 0} active users.\n` +
      `Lead flow is ${ctx.newLeads ?? 0}, platform health is ${ctx.platformScore ?? 0}/100, and there are ${ctx.upcomingEventsCount} upcoming engagement opportunities.`
  },
];

const buildQuickQuestions = (ctx: UserChatContext): QuickQuestion[] => {
  const role = String(ctx.role || '').toLowerCase();
  if (role === 'employer') return buildEmployerQuestions(ctx);
  if (role === 'admin') return buildAdminQuestions(ctx);
  return buildStudentQuestions(ctx);
};

const getContextAnswer = (input: string, ctx: UserChatContext): string | null => {
  const text = input.toLowerCase();

  if (/(focus|plan|week|next step|priority)/.test(text)) {
    return buildQuickQuestions(ctx)[0].answer;
  }
  if (/(application|applied|interview|review|status|pipeline|kpi)/.test(text)) {
    return buildQuickQuestions(ctx)[1].answer;
  }
  if (/(job|opportunit|opening|role|internship|conversion|growth)/.test(text)) {
    return buildQuickQuestions(ctx)[2].answer;
  }
  if (/(event|webinar|session|masterclass)/.test(text)) {
    return buildQuickQuestions(ctx)[3].answer;
  }
  if (/(study|course|progress|profile|career|risk|brief|update|urgent)/.test(text)) {
    return buildQuickQuestions(ctx)[4].answer;
  }

  return null;
};

export default memo(function WhatsAppButton() {
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const shouldLoadContext = isAuthenticated && isOpen;

  const { data: stats } = useDashboardStats({ enabled: shouldLoadContext });
  const { data: applications = [] } = useApplications(user?.id, { enabled: shouldLoadContext });
  const { data: jobs = [] } = useJobs({ enabled: shouldLoadContext });
  const { data: savedJobs = [] } = useSavedJobs(user?.id, { enabled: shouldLoadContext });

  const { data: events = [] } = useQuery({
    queryKey: ['chatbot-events'],
    queryFn: async () => {
      const res = await apiService.getEvents();
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: shouldLoadContext,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.isBackendUnavailable || error?.isNetworkError || error?.isMixedContent || error?.isFrontendOnly) {
        return false;
      }

      return failureCount < 1;
    },
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['chatbot-notifications', user?.id],
    queryFn: async () => {
      const res = await apiService.getNotifications(user?.id || '');
      return res.data;
    },
    enabled: shouldLoadContext && Boolean(user?.id),
    staleTime: 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.isBackendUnavailable || error?.isNetworkError || error?.isMixedContent || error?.isFrontendOnly) {
        return false;
      }

      return failureCount < 1;
    },
  });

  const { data: enrolledCoursesData } = useQuery({
    queryKey: ['chatbot-enrolled-courses', user?.id],
    queryFn: async () => {
      const res = await apiService.getEnrolledCourses(user?.id);
      return res.data;
    },
    enabled: shouldLoadContext && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.isBackendUnavailable || error?.isNetworkError || error?.isMixedContent || error?.isFrontendOnly) {
        return false;
      }

      return failureCount < 1;
    },
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '👋 Hi! I\'m ARMZ Support. How can I help you with aviation careers, jobs, or our services today?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const whatsappNumber = '+919876543210'; // ARMZ Aviation WhatsApp
  const supportEmail = 'support@armzaviation.com';

  const internshipCount = useMemo(() => 
    jobs.filter((job: any) => String(job?.type || '').toLowerCase() === 'internship').length,
    [jobs]
  );
  
  const interviewScheduledCount = useMemo(() => 
    getStatusCount(applications, (status) => status.includes('interview')),
    [applications]
  );
  
  const inReviewCount = useMemo(() => 
    getStatusCount(applications, (status) => status.includes('review')),
    [applications]
  );
  
  const upcomingEvents = useMemo(() => 
    events.filter((event: any) => {
      const status = String(event?.status || '').toLowerCase();
      if (status.includes('upcoming') || status.includes('live')) return true;
      const date = event?.date ? new Date(event.date) : null;
      return Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() >= Date.now());
    }),
    [events]
  );
  
  const unreadNotifications = Number(notificationsData?.unreadCount || 0);
  const enrolledCoursesCount = Array.isArray(enrolledCoursesData?.courses)
    ? enrolledCoursesData.courses.length
    : 0;

  const userContext = useMemo((): UserChatContext => ({
    userName: user?.name || 'Aviation Professional',
    role: user?.role || 'guest',
    totalJobs: jobs.length,
    internshipCount,
    totalApplications: applications.length,
    interviewScheduledCount,
    inReviewCount,
    savedJobsCount: savedJobs.length,
    upcomingEventsCount: upcomingEvents.length,
    nextEvent: upcomingEvents[0]
      ? `${upcomingEvents[0]?.title || 'Upcoming event'} (${formatDateShort(upcomingEvents[0]?.date)})`
      : undefined,
    unreadNotifications,
    enrolledCoursesCount,
    profileStrength: user ? Math.max(45, Number((stats as any)?.profileStrength || 85)) : 0,
    totalHires: Number((stats as any)?.totalHires || 0),
    activeUsers: Number((stats as any)?.activeUsers || 0),
    newLeads: Number((stats as any)?.newLeads || 0),
    platformScore: Number((stats as any)?.platformScore || 0),
  }), [user, jobs.length, internshipCount, applications.length, interviewScheduledCount, inReviewCount, savedJobs.length, upcomingEvents, unreadNotifications, enrolledCoursesCount, stats]);

  const quickQuestions = useMemo(() => buildQuickQuestions(userContext), [userContext]);

  const personalizedWelcome = useMemo(() => 
    isAuthenticated
      ? `👋 Welcome back ${userContext.userName}! I can answer your live ${String(userContext.role || 'career')} updates.\n\nRight now: ${userContext.totalApplications} applications, ${userContext.totalJobs} open jobs, ${userContext.upcomingEventsCount} upcoming events, and ${userContext.unreadNotifications} unread alerts.\n\nTap any suggested question below for instant personalized guidance.`
      : '👋 Hi! I\'m ARMZ Support. Login to unlock personalized career updates, application insights, and study guidance.',
    [isAuthenticated, userContext]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const addBotMessage = useCallback((text: string) => {
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text,
      isBot: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
  }, []);

  const handleQuickQuestionClick = useCallback((question: QuickQuestion) => {
    if (!isAuthenticated) {
      toast.error('Please login to access personalized updates');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: question.label,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    addBotMessage(question.answer);
  }, [isAuthenticated, addBotMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        const localAnswer = getContextAnswer(userMessage.text, userContext);
        if (localAnswer) {
          addBotMessage(localAnswer);
          return;
        }
      }

      addBotMessage('Sorry, I am currently unavailable for live responses. Please try a quick question or contact support directly.');
    } catch (error) {
      addBotMessage('Sorry, I\'m having trouble connecting. Please try again or contact support directly.');
    } finally {
      setIsLoading(false);
    }
  }, [message, isAuthenticated, userContext, addBotMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleDirectContact = useCallback(() => {
    window.open(`tel:${whatsappNumber}`, '_blank');
    toast.success('Opening phone dialer...');
  }, []);

  const handleEmailContact = useCallback(() => {
    window.open(`mailto:${supportEmail}`, '_blank');
    toast.success('Opening email client...');
  }, []);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 sm:right-8 z-40 p-4 bg-linear-to-r from-green-400 to-green-600 text-white rounded-full shadow-2xl hover:shadow-green-600/50 transition-all duration-200"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        title="Chat with us on WhatsApp"
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </motion.div>

        {/* Notification Badge */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"
          />
        )}
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-8 z-40 w-auto sm:w-80 h-[70vh] sm:h-96 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            style={{ bottom: "max(5rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }}
          >
            {/* Header */}
            <div className="bg-linear-to-r from-green-400 to-green-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">ARMZ Support</h3>
                  <p className="text-xs text-green-100">Support Assistant</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDirectContact}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  title="Call us"
                >
                  <Phone className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isAuthenticated && (
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-green-700">Career Updates</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-white px-2.5 py-2 border border-green-100 text-slate-700">Applications: <span className="font-bold">{userContext.totalApplications}</span></div>
                    <div className="rounded-xl bg-white px-2.5 py-2 border border-green-100 text-slate-700">Open Jobs: <span className="font-bold">{userContext.totalJobs}</span></div>
                    <div className="rounded-xl bg-white px-2.5 py-2 border border-green-100 text-slate-700">Events: <span className="font-bold">{userContext.upcomingEventsCount}</span></div>
                    <div className="rounded-xl bg-white px-2.5 py-2 border border-green-100 text-slate-700">Alerts: <span className="font-bold">{userContext.unreadNotifications}</span></div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {quickQuestions.map((question) => (
                      <button
                        key={question.id}
                        onClick={() => handleQuickQuestionClick(question)}
                        className="shrink-0 rounded-full border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        {question.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex space-x-2 max-w-[80%] ${msg.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.isBot ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {msg.isBot ? (
                        <Bot className="h-4 w-4 text-green-600" />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className={`p-3 rounded-2xl ${
                      msg.isBot 
                        ? 'bg-slate-100 text-slate-800' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isBot ? 'text-slate-500' : 'text-blue-100'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-2 max-w-[80%]">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="bg-slate-100 p-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex space-x-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none resize-none"
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                  className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
              
              {/* Contact Options */}
              <div className="flex justify-center space-x-4 mt-3">
                <button
                  onClick={handleDirectContact}
                  className="text-xs text-slate-500 hover:text-green-600 transition-colors flex items-center space-x-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </button>
                <button
                  onClick={handleEmailContact}
                  className="text-xs text-slate-500 hover:text-green-600 transition-colors flex items-center space-x-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

