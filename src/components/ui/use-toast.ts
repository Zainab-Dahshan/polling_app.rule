import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function toast(props: ToastProps) {
  // For now, we'll just console.log the toast message
  // In a real application, you'd want to use a proper toast library
  console.log(`Toast: ${props.title} - ${props.description}`);
}