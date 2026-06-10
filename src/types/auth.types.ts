export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: "student" | "professional" | "other";
}

export interface LoginPayload {
  email: string;
  password: string;
}