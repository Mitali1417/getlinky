export function logError(context, error) {
  const details = {
    context,
    message: error?.message,
    status: error?.status,
    stack: error?.stack,
  };
  console.error(`[${context}]`, details, error);
}
