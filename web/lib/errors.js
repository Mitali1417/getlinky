import { toast } from "sonner";

const API_DOWN =
  "Cannot reach the API. Restart with npm run dev and wait for port 5005.";

export function getErrorMessage(error, fallback = "Something went wrong") {
  const status = error?.status;
  const message = error?.message;

  if (status === 0 || status === 502 || status === 503 || status === 504) {
    return API_DOWN;
  }

  if (status === 500 && (!message || message === "Request failed")) {
    return API_DOWN;
  }

  if (status === 401) {
    return message || "Invalid email or password";
  }
  if (status === 409) {
    return message || "Email already in use";
  }
  if (status === 400) {
    return message || "Please check the form and try again";
  }
  if (status === 404) {
    return message || "Not found";
  }

  return message || fallback;
}

export function toastError(error, fallback) {
  toast.error(getErrorMessage(error, fallback));
}
