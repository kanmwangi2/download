import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheetahIcon } from "@/components/icons/cheetah-icon";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <CheetahIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">
            Welcome to Cheetah Payroll
          </CardTitle>
          <CardDescription>
            Modern payroll and HR management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            New to Cheetah Payroll? Create your account to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
