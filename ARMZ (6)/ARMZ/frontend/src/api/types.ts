export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}
