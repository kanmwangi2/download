"use client";

import React, { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { Cropper, CircleStencil, type CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import 'react-advanced-cropper/dist/themes/corners.css';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Lock, Save, Camera, Trash2, RotateCcw, Crop, Eye, EyeOff, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseClient } from '@/lib/supabase';
import type { User } from '@/lib/userData';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = getSupabaseClient();

const defaultPlaceholderImage = "https://placehold.co/150x150.png";


interface UserProfileDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const initialProfileDetails: UserProfileDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

// Helper: get current user from Supabase
async function getCurrentUserFromSupabase() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  const meta = data.user.user_metadata || {};
  return {
    id: data.user.id,
    email: meta.email || data.user.email || '',
    firstName: meta.firstName || '',
    lastName: meta.lastName || '',
    phone: meta.phone || '',
  };
}

// --- Robust CRUD helpers for user profile ---

// Helper: fetch user profile from Supabase (robust)
async function fetchUserProfile(userId: string): Promise<UserProfileDetails> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) throw new Error(error?.message || 'User profile not found');
  return {
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    email: data.email || '',
    phone: data.phone || '',
  };
}

// Helper: update user profile in Supabase (robust)
async function updateUserProfile(userId: string, profile: UserProfileDetails): Promise<UserProfileDetails> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone: profile.phone,
    })
    .eq('id', userId)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message || 'Failed to update user profile');
  return {
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    email: data.email || '',
    phone: data.phone || '',
  };
}

// Helper: update user password in Supabase (robust)
async function updateUserPassword(userId: string, newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error || !data?.user) throw new Error(error?.message || 'Failed to update password');
}

// Helper: fetch avatar from Supabase (robust)
async function fetchUserAvatar(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_avatars')
    .select('avatar_url')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle instead of single
  if (error) throw new Error(error.message);
  return data?.avatar_url || null;
}

// Helper: update avatar in Supabase (robust)
async function updateUserAvatar(userId: string, avatarUrl: string) {
  const { error } = await supabase
    .from('user_avatars')
    .upsert({ user_id: userId, avatar_url: avatarUrl });
  if (error) throw new Error(error.message);
}

export default function UserProfilePage() {
  const [userDetails, setUserDetails] = useState<UserProfileDetails>(initialProfileDetails);
  const [passwordDetails, setPasswordDetails] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const cropperRef = useRef<CropperRef>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackMessage | null>(null);
  const [avatarFeedback, setAvatarFeedback] = useState<FeedbackMessage | null>(null);


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getCurrentUserFromSupabase();
        if (!user) {
          setIsLoaded(true);
          setFeedback({ type: 'error', message: 'User not authenticated', details: 'Please log in again.' });
          return;
        }
        setCurrentUserId(user.id);
        setOriginalEmail(user.email);
        // Avatar
        let avatar = null;
        try {
          avatar = await fetchUserAvatar(user.id);
        } catch (avatarErr) {
          setAvatarFeedback({ type: 'error', message: 'Avatar Load Failed', details: String(avatarErr) });
        }
        setCroppedImage(avatar || defaultPlaceholderImage);
        // Profile
        let profile = null;
        try {
          profile = await fetchUserProfile(user.id);
        } catch (profileErr) {
          setFeedback({ type: 'error', message: 'Profile Load Failed', details: String(profileErr) });
        }
        if (profile) {
          setUserDetails({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || user.email || '',
            phone: profile.phone || ''
          });
          setOriginalEmail(profile.email || user.email || '');
        } else {
          setUserDetails({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || ''
          });
          setOriginalEmail(user.email || '');
        }
      } catch (err) {
        setFeedback({ type: 'error', message: 'Profile Load Error', details: String(err) });
      } finally {
        setIsLoaded(true);
      }
    };
    loadProfile();
  }, []);

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordFeedback(null);
    const { name, value = '' } = e.target;
    setPasswordDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (!currentUserId) {
        setFeedback({ type: 'error', message: "User session not found. Please log in again." });
        return;
    }

    try {
      await updateUserProfile(currentUserId, userDetails);
      // --- Update Supabase Auth user metadata for name sync ---
      await supabase.auth.updateUser({
        data: {
          first_name: userDetails.firstName,
          last_name: userDetails.lastName,
        }
      });
      setOriginalEmail(userDetails.email);
      setFeedback({ type: 'success', message: "Profile Updated", details: "Your personal information has been saved." });
    } catch (error: any) {
      setFeedback({ type: 'error', message: "Save Failed", details: "Could not save personal information. " + (error?.message || String(error)) });
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (!currentUserId) {
      setPasswordFeedback({ type: 'error', message: "Error", details: "User session not found. Please log in again." });
      return;
    }

    if (!passwordDetails.currentPassword) {
      setPasswordFeedback({ type: 'error', message: "Validation Error", details: "Current password is required." });
      return;
    }

    if (!passwordDetails.newPassword) {
      setPasswordFeedback({ type: 'error', message: "Validation Error", details: "New password is required." });
      return;
    }

    if (passwordDetails.newPassword !== passwordDetails.confirmNewPassword) {
      setPasswordFeedback({ type: 'error', message: "Password Mismatch", details: "New passwords do not match." });
      return;
    }
    
    if (passwordDetails.newPassword.length < 6) { // Basic length check
        setPasswordFeedback({type: 'error', message: "Validation Error", details: "New password must be at least 6 characters long."});
        return;
    }

    try {
      await updateUserPassword(currentUserId, passwordDetails.newPassword);
      setPasswordFeedback({ type: 'success', message: "Password Updated", details: "Your password has been successfully changed." });
      setPasswordDetails({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error) {
      setPasswordFeedback({ type: 'error', message: "Update Failed", details: "Could not update password. Please try again." });
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarFeedback(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCroppedImage = async () => {
    setAvatarFeedback(null);
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas();
      if (canvas && currentUserId) {
        const croppedImgDataUrl = canvas.toDataURL('image/jpeg');
        setCroppedImage(croppedImgDataUrl);
        await updateUserAvatar(currentUserId, croppedImgDataUrl);
        setAvatarFeedback({ type: 'success', message: "Profile Picture Saved", details: "Your new profile picture has been saved." });
        setImageSrc(null);
      } else {
        setAvatarFeedback({ type: 'error', message: "Error", details: "Could not get cropped image." });
      }
    }
  };

  const handleRemovePicture = async () => {
    setAvatarFeedback(null);
    setImageSrc(null);
    setCroppedImage(defaultPlaceholderImage);
    if (currentUserId) {
      try {
        await updateUserAvatar(currentUserId, defaultPlaceholderImage);
      } catch (error) {
        console.error("Error removing profile picture from Supabase", error);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setAvatarFeedback({ type: 'success', message: "Profile Picture Removed", details: "Your profile picture has been reset to default." });
  };

  const renderFeedbackMessage = (feedbackObj: FeedbackMessage | null) => {
    if (!feedbackObj) return null;
    let IconComponent;
    let variant: "default" | "destructive" = "default";
    let additionalAlertClasses = "";

    switch (feedbackObj.type) {
      case 'success':
        IconComponent = CheckCircle2;
        variant = "default";
        additionalAlertClasses = "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600 [&>svg]:text-green-600 dark:[&>svg]:text-green-400";
        break;
      case 'error':
        IconComponent = AlertTriangle;
        variant = "destructive";
        break;
      case 'info':
        IconComponent = Info;
        variant = "default";
        break;
      default:
        return null;
    }
    return (
      <Alert variant={variant} className={cn("mt-4", additionalAlertClasses)}>
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{feedbackObj.message}</AlertTitle>
        {feedbackObj.details && <AlertDescription>{feedbackObj.details}</AlertDescription>}
      </Alert>
    );
  };

  if (!isLoaded) {
    if (feedback && feedback.type === 'error' && feedback.message.toLowerCase().includes('user not authenticated')) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            <div>
              <AlertTitle>Session Expired</AlertTitle>
              <AlertDescription>
                Your session has expired or you are not logged in.<br />
                <Button className="mt-4" onClick={() => window.location.href = '/signin?returnUrl=' + encodeURIComponent(window.location.pathname)}>
                  Go to Login
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        </div>
      );
    }
    return <div className="flex justify-center items-center h-64">Loading profile...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserCircle className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">User Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your personal information, password, and profile picture. Data persists in your browser's storage.
        </p>
      </div>
       {renderFeedbackMessage(feedback) || renderFeedbackMessage(avatarFeedback) || renderFeedbackMessage(passwordFeedback)}

      <Tabs defaultValue="picture" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="picture">Profile Picture</TabsTrigger>
          <TabsTrigger value="personalInfo">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Change Password</TabsTrigger>
        </TabsList>

        <TabsContent value="picture">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-6 w-6 text-primary" />
                Profile Picture
              </CardTitle>
              <CardDescription>Upload, crop, and manage your profile picture. Saved to IndexedDB.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="hidden"
              />
              {!imageSrc && (
                <div className="flex flex-col items-center space-y-2">
                    <NextImage
                        src={croppedImage || defaultPlaceholderImage}
                        alt="Profile Picture Preview"
                        width={150}
                        height={150}
                        className="rounded-full aspect-square object-cover border"
                        data-ai-hint="profile avatar"
                        unoptimized={croppedImage?.startsWith('blob:') || croppedImage?.startsWith('data:')}
                        key={croppedImage}
                    />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Change Picture
                    </Button>
                    {(croppedImage && croppedImage !== defaultPlaceholderImage) && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemovePicture}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Current Picture
                        </Button>
                    )}
                </div>
              )}

              {imageSrc && (
                <div className="space-y-4">
                  <div className="relative h-80 w-full bg-muted rounded-md overflow-hidden">
                     <Cropper
                        ref={cropperRef}
                        src={imageSrc}
                        stencilComponent={CircleStencil}
                        stencilProps={{
                            aspectRatio: 1,
                            movable: true,
                            resizable: true,
                            lines: true,
                            handlers: true,
                         }}
                        className="h-full w-full react-advanced-cropper__image--restricted react-advanced-cropper__stretcher"
                        imageRestriction={"stencil" as any}
                      />
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Move and resize the circle to select your desired profile picture area.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" variant="outline" onClick={() => { setAvatarFeedback(null); fileInputRef.current?.click(); }}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Select Different Image
                    </Button>
                    <Button type="button" onClick={handleSaveCroppedImage}>
                      <Crop className="mr-2 h-4 w-4" /> Save Cropped Picture
                    </Button>
                     <Button type="button" variant="ghost" onClick={() => { setImageSrc(null); setAvatarFeedback(null); }}>
                        Cancel Crop
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalInfo">
          <form onSubmit={handleProfileSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircle className="mr-2 h-6 w-6 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your first name, last name, email address, and phone number. Saved to IndexedDB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={userDetails.firstName}
                      onChange={handleUserInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={userDetails.lastName}
                      onChange={handleUserInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={userDetails.email}
                      onChange={handleUserInputChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={userDetails.phone}
                      onChange={handleUserInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save Personal Information
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="security">
          <form onSubmit={handlePasswordSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-6 w-6 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password. Your password is saved securely in IndexedDB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordDetails.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter your current password"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex={-1}
                      suppressHydrationWarning={true}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                        <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordDetails.newPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Enter new password"
                        required
                        className="pr-10"
                        />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                        suppressHydrationWarning={true}
                        >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <div className="relative">
                        <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type={showConfirmNewPassword ? "text" : "password"}
                        value={passwordDetails.confirmNewPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Confirm new password"
                        required
                        className="pr-10"
                        />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        tabIndex={-1}
                        suppressHydrationWarning={true}
                        >
                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Update Password
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// All localStorage and indexedDbUtils references have been removed. This page now relies solely on Supabase for user profile data.

