'use client';

export default function ConfirmEmail() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Check your email</h1>
          <p className="text-muted-foreground mb-4">
            We've sent a confirmation link to your email address. Click the link to verify your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or try signing up again.
          </p>
        </div>
      </div>
    </div>
  );
}
