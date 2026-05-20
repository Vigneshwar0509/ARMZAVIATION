import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Trophy,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import apiService from "@/src/services/api";
import { useAuthStore } from "@/src/store/authStore";

type AssessmentRecord = {
  id: number | string;
  title: string;
  description?: string;
  questions?: any[];
  created_at?: string;
};

type QuestionRecord = {
  id: string;
  prompt: string;
  options: string[];
};

type AssessmentCard = {
  id: number | string;
  title: string;
  description: string;
  category: string;
  duration: number;
  passingScore: number;
  questions: QuestionRecord[];
  status: "available" | "in-progress" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  savedProgress: number;
  score: number | null;
  completedAt: string | null;
};

const normalizeQuestion = (question: any, index: number): QuestionRecord => {
  const optionValues = Array.isArray(question?.options)
    ? question.options
    : Array.isArray(question?.choices)
    ? question.choices
    : [];

  const options = optionValues
    .map((value: any) => (typeof value === "string" ? value : value?.label ?? value?.text ?? ""))
    .filter(Boolean);

  return {
    id: String(question?.id ?? index),
    prompt:
      question?.question ??
      question?.prompt ??
      question?.text ??
      `Question ${index + 1}`,
    options: options.length > 0 ? options : ["Mark as reviewed"],
  };
};

const buildAssessmentCard = (assessment: AssessmentRecord, result: any): AssessmentCard => {
  const questions = Array.isArray(assessment.questions)
    ? assessment.questions.map(normalizeQuestion)
    : [];
  const answerCount = Object.keys(result?.answers ?? {}).length;
  const passingScore = 70;
  const submittedAt = result?.submittedAt ?? null;
  const startedAt = result?.startedAt ?? null;

  let status: AssessmentCard["status"] = "available";
  if (submittedAt) {
    status = (result?.score ?? 0) >= passingScore ? "completed" : "failed";
  } else if (startedAt) {
    status = "in-progress";
  }

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description ?? "",
    category: questions[0]?.prompt?.includes("safety") ? "Safety" : "Assessment",
    duration: Math.max(10, questions.length * 2),
    passingScore,
    questions,
    status,
    attempts: submittedAt || startedAt ? 1 : 0,
    maxAttempts: 3,
    savedProgress:
      status === "in-progress" && questions.length > 0
        ? Math.round((answerCount / questions.length) * 100)
        : 0,
    score: submittedAt ? result?.score ?? 0 : null,
    completedAt: submittedAt,
  };
};

export default function Assessments() {
  const { logout } = useAuthStore();
  const [assessments, setAssessments] = useState<AssessmentCard[]>([]);
  const [filter, setFilter] = useState<"all" | "available" | "completed">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentCard | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAssessments();
      const rawAssessments: AssessmentRecord[] = Array.isArray(response.data) ? response.data : [];
      const results = await Promise.all(
        rawAssessments.map(async (assessment) => {
          const resultResponse = await apiService.getAssessmentResult(String(assessment.id));
          return resultResponse.data;
        })
      );

      setAssessments(rawAssessments.map((assessment, index) => buildAssessmentCard(assessment, results[index])));
    } catch (error: any) {
      toast.error("Unable to load assessments");
      if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
        sessionStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssessments();
  }, []);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      if (filter === "all") {
        return true;
      }
      if (filter === "available") {
        return assessment.status === "available" || assessment.status === "in-progress";
      }
      return assessment.status === "completed" || assessment.status === "failed";
    });
  }, [assessments, filter]);

  const completedCount = assessments.filter((assessment) => assessment.status === "completed").length;
  const scoredAssessments = assessments.filter((assessment) => assessment.score !== null);
  const averageScore =
    scoredAssessments.length > 0
      ? Math.round(
          scoredAssessments.reduce((sum, assessment) => sum + (assessment.score ?? 0), 0) /
            scoredAssessments.length
        )
      : 0;

  const closeQuiz = () => {
    setShowQuiz(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setActiveAssessment(null);
    setLatestScore(null);
  };

  const openResults = (assessment: AssessmentCard) => {
    setActiveAssessment(assessment);
    setLatestScore(assessment.score);
    setShowQuiz(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
  };

  const handleStartQuiz = async (assessment: AssessmentCard) => {
    try {
      const response = await apiService.startAssessment(String(assessment.id));
      const persistedAnswers = response.data?.answers ?? {};
      const firstUnansweredIndex = assessment.questions.findIndex(
        (question) => persistedAnswers[question.id] === undefined
      );

      setActiveAssessment(assessment);
      setSelectedAnswers(persistedAnswers);
      setCurrentQuestion(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0);
      setLatestScore(null);
      setShowQuiz(true);
    } catch (error) {
      toast.error("Assessment could not be started");
    }
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: String(answerIndex) }));
  };

  const handleNext = async () => {
    if (!activeAssessment) {
      return;
    }

    if (currentQuestion < activeAssessment.questions.length - 1) {
      setCurrentQuestion((current) => current + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.submitAssessment(String(activeAssessment.id), selectedAnswers);
      const score = response.data?.score ?? 0;
      setLatestScore(score);
      await loadAssessments();
      toast.success("Assessment submitted");
    } catch (error) {
      toast.error("Assessment submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AssessmentCard["status"], score?: number | null) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Passed ({score}%)
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <XCircle className="h-3.5 w-3.5" />
            Failed ({score}%)
          </span>
        );
      case "in-progress":
        return (
          <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <Clock className="h-3.5 w-3.5" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <Play className="h-3.5 w-3.5" />
            Ready
          </span>
        );
    }
  };

  const activeQuestions = activeAssessment?.questions ?? [];
  const activeQuestion = activeQuestions[currentQuestion];
  const showResults = latestScore !== null && activeAssessment !== null;

  return (
    <div className="p-8 space-y-8">
      <AnimatePresence>
        {showQuiz && activeAssessment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeQuiz}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="glass-card w-full max-w-2xl p-8 rounded-4xl"
            >
              {showResults ? (
                <div className="text-center py-8">
                  <div
                    className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                      (latestScore ?? 0) >= activeAssessment.passingScore ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {(latestScore ?? 0) >= activeAssessment.passingScore ? (
                      <Trophy className="h-12 w-12 text-green-600" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-600" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {(latestScore ?? 0) >= activeAssessment.passingScore ? "Assessment Passed" : "Assessment Needs Retry"}
                  </h2>
                  <p className="text-slate-500 mb-2">{activeAssessment.title}</p>
                  <p className="text-slate-500 mb-6">Your latest live score is {latestScore}%.</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={closeQuiz}
                      className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => void handleStartQuiz(activeAssessment)}
                      className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </div>
              ) : activeQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">No questions available</h2>
                  <p className="text-slate-500 mb-6">This assessment exists in the backend, but no questions have been added yet.</p>
                  <button
                    onClick={closeQuiz}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-sm text-slate-500">
                      Question {currentQuestion + 1} of {activeQuestions.length}
                    </span>
                    <div className="flex gap-1.5">
                      {activeQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className={`h-2 w-8 rounded-full transition-colors ${
                            index === currentQuestion
                              ? "bg-purple-600"
                              : index < currentQuestion
                              ? "bg-green-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-6">{activeQuestion?.prompt}</h3>

                  <div className="space-y-3 mb-8">
                    {activeQuestion?.options.map((option, index) => (
                      <button
                        key={`${activeQuestion.id}-${index}`}
                        onClick={() => handleAnswer(activeQuestion.id, index)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedAnswers[activeQuestion.id] === String(index)
                            ? "border-purple-500 bg-purple-50"
                            : "border-slate-200 hover:border-purple-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedAnswers[activeQuestion.id] === String(index)
                                ? "border-purple-500 bg-purple-500"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedAnswers[activeQuestion.id] === String(index) && (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="text-slate-700 font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={closeQuiz}
                      className="px-6 py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                    >
                      Exit Assessment
                    </button>
                    <button
                      onClick={() => void handleNext()}
                      disabled={selectedAnswers[activeQuestion?.id ?? ""] === undefined || isSubmitting}
                      className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {currentQuestion === activeQuestions.length - 1 ? "Submit" : "Next"}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Assessments</h1>
        <p className="text-slate-500 mt-1">Take live assessments and track your real attempt history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Assessments", value: assessments.length, icon: FileText, color: "from-blue-500 to-cyan-500" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
          { label: "Average Score", value: `${averageScore}%`, icon: BarChart3, color: "from-purple-500 to-pink-500" },
          { label: "Certificates", value: completedCount, icon: Award, color: "from-amber-500 to-orange-500" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${stat.color} text-white mb-4`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["all", "available", "completed"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              filter === value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {value === "all" ? "All" : value === "available" ? "Available" : "Completed"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading live assessments...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No assessments found</h3>
          <p className="text-slate-500">Add assessments in the backend to make this section live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssessments.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <span className="text-xs font-medium text-slate-500">{assessment.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{assessment.title}</h3>
                  {assessment.description ? (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-3">{assessment.description}</p>
                  ) : null}
                </div>
                {getStatusBadge(assessment.status, assessment.score)}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {assessment.questions.length} questions
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {assessment.duration} mins
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  Pass: {assessment.passingScore}%
                </span>
              </div>

              {assessment.status === "in-progress" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-500">Saved progress</span>
                    <span className="font-semibold text-slate-900">{assessment.savedProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${assessment.savedProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Attempts: {assessment.attempts}/{assessment.maxAttempts}
                </span>
                <button
                  onClick={() =>
                    assessment.status === "completed" ? openResults(assessment) : void handleStartQuiz(assessment)
                  }
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                    assessment.status === "completed"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : assessment.status === "failed"
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {assessment.status === "completed" ? (
                    <>
                      Review <ArrowRight className="h-4 w-4" />
                    </>
                  ) : assessment.status === "in-progress" ? (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  ) : assessment.status === "failed" ? (
                    <>
                      Retry <RefreshCw className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Start <Play className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
