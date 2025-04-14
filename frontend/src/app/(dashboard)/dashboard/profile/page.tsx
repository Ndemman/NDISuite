"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, Building, Shield, Briefcase, Upload, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, isLoading } = useAuth()
  const { toast } = useToast()
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    organization: '',
    jobTitle: '',
    bio: '',
    profilePicture: null as File | null,
    previewUrl: ''
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Error states
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  
  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        phoneNumber: user.profile?.phone_number || '',
        organization: user.profile?.organization || '',
        jobTitle: user.profile?.job_title || '',
        bio: user.profile?.bio || '',
        profilePicture: null,
        previewUrl: user.profile?.profile_picture || ''
      })
    }
  }, [user])
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle file input change for profile picture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please select a JPEG, PNG, or GIF image.',
        })
        return
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image under 2MB.',
        })
        return
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setProfileData(prev => ({ 
        ...prev, 
        profilePicture: file,
        previewUrl
      }))
    }
  }
  
  // Validate profile form
  const validateProfileForm = () => {
    const errors: Record<string, string> = {}
    
    if (!profileData.firstName.trim()) errors.firstName = 'First name is required'
    if (!profileData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!profileData.email.trim()) errors.email = 'Email is required'
    if (!profileData.username.trim()) errors.username = 'Username is required'
    
    // Email validation
    if (profileData.email && !/^\S+@\S+\.\S+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Validate password form
  const validatePasswordForm = () => {
    const errors: Record<string, string> = {}
    
    if (!passwordData.currentPassword.trim()) errors.currentPassword = 'Current password is required'
    if (!passwordData.newPassword.trim()) errors.newPassword = 'New password is required'
    if (!passwordData.confirmPassword.trim()) errors.confirmPassword = 'Please confirm your password'
    
    // Password strength validation
    if (passwordData.newPassword) {
      if (passwordData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters'
      } else if (!/[A-Z]/.test(passwordData.newPassword)) {
        errors.newPassword = 'Password must contain at least one uppercase letter'
      } else if (!/[a-z]/.test(passwordData.newPassword)) {
        errors.newPassword = 'Password must contain at least one lowercase letter'
      } else if (!/\d/.test(passwordData.newPassword)) {
        errors.newPassword = 'Password must contain at least one number'
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
        errors.newPassword = 'Password must contain at least one special character'
      }
    }
    
    // Password match validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) return
    
    try {
      await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        profile: {
          bio: profileData.bio,
          phone_number: profileData.phoneNumber,
          organization: profileData.organization,
          job_title: profileData.jobTitle,
          // Handle profile picture upload in a separate API call
        }
      })
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'An error occurred while updating your profile',
      })
    }
  }
  
  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) return
    
    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Password change failed',
        description: 'An error occurred while changing your password',
      })
    }
  }
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return 'ND'
    
    const firstInitial = user.first_name ? user.first_name.charAt(0) : ''
    const lastInitial = user.last_name ? user.last_name.charAt(0) : ''
    
    return firstInitial + lastInitial || user.username.substring(0, 2).toUpperCase()
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Loading your profile information...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account preferences
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* General Tab - Profile Information */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Your profile picture will be visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.previewUrl} alt={user.username} />
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col justify-center gap-4">
                  <Label 
                    htmlFor="picture" 
                    className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-fit"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Picture
                  </Label>
                  <Input 
                    id="picture" 
                    type="file" 
                    accept="image/png, image/jpeg, image/gif" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Allowed formats: JPEG, PNG, GIF. Max size: 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <form onSubmit={handleProfileSubmit}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className={profileErrors.firstName ? "border-destructive" : ""}
                        disabled={isLoading}
                      />
                      <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    {profileErrors.firstName && (
                      <p className="text-xs text-destructive">{profileErrors.firstName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className={profileErrors.lastName ? "border-destructive" : ""}
                        disabled={isLoading}
                      />
                      <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    {profileErrors.lastName && (
                      <p className="text-xs text-destructive">{profileErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className={profileErrors.email ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  {profileErrors.email && (
                    <p className="text-xs text-destructive">{profileErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      className={profileErrors.username ? "border-destructive" : ""}
                      disabled={isLoading}
                    />
                    <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  {profileErrors.username && (
                    <p className="text-xs text-destructive">{profileErrors.username}</p>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us a little about yourself"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="relative">
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profileData.phoneNumber}
                        onChange={handleProfileChange}
                        disabled={isLoading}
                      />
                      <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <div className="relative">
                      <Input
                        id="organization"
                        name="organization"
                        value={profileData.organization}
                        onChange={handleProfileChange}
                        disabled={isLoading}
                      />
                      <Building className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <div className="relative">
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      value={profileData.jobTitle}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                    />
                    <Briefcase className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Security Tab - Password Management */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <form onSubmit={handlePasswordSubmit}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    Current Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.currentPassword ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.newPassword ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm New Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="flex items-start gap-2 rounded-md border p-3 bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium">Password requirements:</p>
                    <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                      <li>At least 8 characters long</li>
                      <li>Must include at least one uppercase letter</li>
                      <li>Must include at least one lowercase letter</li>
                      <li>Must include at least one number</li>
                      <li>Must include at least one special character</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
