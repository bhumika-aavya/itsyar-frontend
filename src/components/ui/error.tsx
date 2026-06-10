import React from "react";

// Helper component for error messages to keep code clean
export const ErrorMsg = ({ message }: { message?: string }) =>
    message ? <p className="mt-2 text-xs font-medium text-red-500 text-center">{message}</p> : null;
