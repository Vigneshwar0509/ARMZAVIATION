import { useLeadStore, LeadSource } from '@/src/store/leadStore';

export const useLeadCapture = () => {
  const { openLeadModal } = useLeadStore();

  const captureLead = (
    source: LeadSource,
    interest: string,
    title?: string,
    subtitle?: string,
    onSuccess?: () => void
  ) => {
    openLeadModal({
      source,
      interest,
      title: title || 'Tell Us More',
      subtitle: subtitle || 'Fill in your details and we will contact you shortly.',
      onSuccess,
    });
  };

  const captureJobApplyLead = (jobTitle: string, company: string) => {
    captureLead(
      'job_apply',
      `Applied for ${jobTitle} at ${company}`,
      `Interested in ${jobTitle}?`,
      `Let us help you prepare for this opportunity at ${company}.`
    );
  };

  const captureContactLead = () => {
    captureLead(
      'contact_form',
      'General contact inquiry',
      'Get in Touch',
      'We would love to hear from you!'
    );
  };

  const captureEnquiryLead = (subject: string) => {
    captureLead(
      'enquiry',
      subject,
      'Send us a Message',
      'Tell us more about your inquiry'
    );
  };

  const captureProgramInterest = (programName: string) => {
    captureLead(
      'program_interest',
      `Interested in ${programName}`,
      `Learn More About ${programName}`,
      `Get more details about our ${programName} program`
    );
  };

  const captureCourseEnroll = (courseName: string) => {
    captureLead(
      'course_enroll',
      `Enrolling in ${courseName}`,
      `Join ${courseName}`,
      `Secure your spot in this exclusive course`
    );
  };

  const captureConclaveRegistration = (conclaveName: string) => {
    captureLead(
      'conclave_register',
      `Registering for ${conclaveName}`,
      `Register for ${conclaveName}`,
      `Be part of this amazing networking event`
    );
  };

  const captureWebinarRegistration = (webinarName: string) => {
    captureLead(
      'webinar_register',
      `Registering for ${webinarName}`,
      `Register for ${webinarName}`,
      `Don't miss out on this insightful session`
    );
  };

  return {
    captureLead,
    captureJobApplyLead,
    captureContactLead,
    captureEnquiryLead,
    captureProgramInterest,
    captureCourseEnroll,
    captureConclaveRegistration,
    captureWebinarRegistration,
  };
};
