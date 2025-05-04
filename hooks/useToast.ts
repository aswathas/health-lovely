import { toast as toastNotification } from "react-hot-toast";

export function useToast() {
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    switch (type) {
      case "error":
        toastNotification.error(message);
        break;
      case "success":
        toastNotification.success(message);
        break;
      default:
        toastNotification(message);
    }
  };

  return { showToast };
}
