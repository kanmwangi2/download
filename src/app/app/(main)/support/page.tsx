"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Mail, Phone, MessageSquare, BookOpenText, HelpCircle, Loader2 } from "lucide-react"; 
import Link from "next/link";
// Legacy import - replaced by OOP services
// import { createClient } from '@/lib/supabase';

export default function SupportPage() {
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState<string | null>(null);
  const [primaryAdminPhone, setPrimaryAdminPhone] = useState<string | null>(null);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true);
  useEffect(() => {
    const fetchAdminDetails = async () => {
      if (typeof window === 'undefined') {
        setIsLoadingAdminData(false);
        return;
      }
      
      setIsLoadingAdminData(true);

      try {
        // TODO: Create UserService for user management
        // For now, using legacy import
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        
        // Query for primary admin user from Supabase
        const { data: primaryAdmin, error } = await supabase
          .from('users')
          .select('email, phone')
          .eq('role', 'Primary Admin')
          .single();
        
        if (primaryAdmin && !error) {
          setPrimaryAdminEmail(primaryAdmin.email || 'support@cheetahpayroll.com');
          setPrimaryAdminPhone(primaryAdmin.phone || 'Not Configured');
        } else {
          // Fallback to default support contact
          setPrimaryAdminEmail('support@cheetahpayroll.com');
          setPrimaryAdminPhone('Not Configured');
        }
      } catch (error) {
        console.error("Support Page: Error fetching primary admin details from Supabase:", error);
        setPrimaryAdminEmail('support@cheetahpayroll.com'); 
        setPrimaryAdminPhone('Not Configured'); 
      }
      setIsLoadingAdminData(false);
    };
    fetchAdminDetails();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LifeBuoy className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Support</h1>
        </div>
        <p className="text-muted-foreground">
          Get assistance with Cheetah Payroll. We&apos;re here to help!
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LifeBuoy className="mr-2 h-6 w-6 text-primary" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Reach out to us if you encounter any issues or have questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-2 text-lg">Direct Contact</h3>
            {isLoadingAdminData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading contact details...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>Email: <a href={`mailto:${primaryAdminEmail || 'support@cheetahpayroll.com'}`} className="text-primary hover:underline">{primaryAdminEmail || 'support@cheetahpayroll.com'}</a></span>
                </div>
                
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  {primaryAdminPhone && primaryAdminPhone !== 'Not Configured' ? (
                    <span>Phone: <a href={`tel:${primaryAdminPhone}`} className="text-primary hover:underline">{primaryAdminPhone}</a></span>
                  ) : (
                    <span>Phone: Not Configured</span>
                  )}
                </div>
              </>
            )}
            <div className="flex items-center gap-3 mt-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span>Working Hours: We are available Mon-Fri, 9am-5pm CAT</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/30">
             <h3 className="font-semibold mb-2 text-lg">Self-Help Resources</h3>
            <p className="text-muted-foreground mb-3">
             Many common questions are answered in our FAQ and comprehensive documentation sections.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <Link href="/app/utilities/faq">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Visit FAQ
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                <Link href="/app/documentation">
                    <BookOpenText className="mr-2 h-4 w-4" />
                    Visit Documentation
                </Link>
                </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground pt-4">
            Our support team typically responds to email inquiries within 24 business hours. For urgent issues, please call us directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
    

    
