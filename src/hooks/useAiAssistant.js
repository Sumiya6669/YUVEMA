import { useMutation } from "@tanstack/react-query";
import { requestAiAdvisor } from "@/services/ai/client";

export function useAiAssistant() {
  return useMutation({
    mutationFn: requestAiAdvisor,
  });
}
