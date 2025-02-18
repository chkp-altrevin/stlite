import { StliteKernelOptions } from "@stlite/kernel";
import { toast, Slide, Id as ToastId } from "react-toastify";
import ErrorToastContent from "./ErrorToastContent";

export interface MakeToastKernelCallbacksOptions {
  disableProgressToasts?: boolean;
  disableErrorToasts?: boolean;
}
export interface ToastKernelCallbacks {
  onProgress: NonNullable<StliteKernelOptions["onProgress"]>;
  onLoad: NonNullable<StliteKernelOptions["onLoad"]>;
  onError: NonNullable<StliteKernelOptions["onError"]>;
}
export function makeToastKernelCallbacks(
  options?: MakeToastKernelCallbacksOptions,
): ToastKernelCallbacks {
  const { disableProgressToasts = false, disableErrorToasts = false } =
    options ?? {};

  let prevToastId: ToastId | null = null;
  const toastIds: ToastId[] = [];
  const onProgress: StliteKernelOptions["onProgress"] = (message) => {
    if (disableProgressToasts) {
      return;
    }

    const id = toast(message, {
      position: "bottom-right",
      transition: Slide,
      isLoading: true,
      hideProgressBar: true,
      closeButton: false,
    });
    toastIds.push(id);

    if (prevToastId) {
      toast.update(prevToastId, {
        isLoading: false,
        autoClose: 3000,
      });
    }
    prevToastId = id;
  };
  const onLoad: StliteKernelOptions["onLoad"] = () => {
    toastIds.forEach((id) => toast.dismiss(id));
  };
  const onError: StliteKernelOptions["onError"] = (error) => {
    if (disableErrorToasts) {
      return;
    }

    toast(
      <ErrorToastContent message="Error during booting up" error={error} />,
      {
        position: "bottom-right",
        type: "error",
        autoClose: false,
        closeOnClick: false,
      },
    );
  };

  return {
    onProgress,
    onLoad,
    onError,
  };
}
