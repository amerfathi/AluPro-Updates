"use client";

export function FormFeedback({
  state,
  successMessage,
  errorMessage,
}: {
  state: "idle" | "success" | "error";
  successMessage: string;
  errorMessage: string;
}) {
  if (state === "idle") {
    return null;
  }

  return (
    <div
      className={
        state === "success"
          ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          : "rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
      }
    >
      {state === "success" ? successMessage : errorMessage}
    </div>
  );
}


