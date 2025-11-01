import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Silva</h1>
          <p className="text-muted-foreground mt-2">Ultrathinking CRM</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
