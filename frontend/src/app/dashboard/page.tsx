"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, User, Shield, Key, X, Building2, Plus, Users, Settings, Lock, Mail } from "lucide-react"

type DashboardTab = "members" | "settings" | "profile" | "security"

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>("members")
  
  // Modals
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("MEMBER")

  // Profile edit state
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [profileMessage, setProfileMessage] = useState("")

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // MFA state
  const [mfaQrCode, setMfaQrCode] = useState("")
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaMessage, setMfaMessage] = useState("")
  const [mfaError, setMfaError] = useState("")
  const [isMfaSetupMode, setIsMfaSetupMode] = useState(false)

  // Load active org from local storage on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem("activeOrganizationId")
    if (savedOrgId) {
      setActiveOrgId(savedOrgId)
    }
  }, [])

  // Sync active org state to local storage
  useEffect(() => {
    if (activeOrgId) {
      localStorage.setItem("activeOrganizationId", activeOrgId)
    }
  }, [activeOrgId])

  // Queries
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("/auth/profile")
      return response.data.data
    },
    retry: false,
  })

  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["orgs"],
    queryFn: async () => {
      const response = await api.get("/orgs")
      return response.data.data
    },
  })

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["orgMembers", activeOrgId],
    queryFn: async () => {
      const response = await api.get(`/orgs/${activeOrgId}/members`)
      return response.data.data
    },
    enabled: !!activeOrgId,
  })

  // Mutations
  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      return await api.post("/orgs", { name })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] })
      setActiveOrgId(res.data.data.id)
      setIsCreateOrgModalOpen(false)
      setNewOrgName("")
    }
  })

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string, role: string }) => {
      return await api.post(`/orgs/${activeOrgId}/members`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgMembers", activeOrgId] })
      setIsInviteModalOpen(false)
      setInviteEmail("")
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to invite member")
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string, lastName: string }) => {
      return await api.patch("/auth/profile", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      setProfileMessage("Profile updated successfully!")
      setTimeout(() => setProfileMessage(""), 3000)
    },
    onError: (err: any) => {
      setProfileMessage(err.response?.data?.message || "Failed to update profile")
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      return await api.patch("/auth/password", data)
    },
    onSuccess: () => {
      setPasswordMessage("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setPasswordError("")
      setTimeout(() => setPasswordMessage(""), 3000)
    },
    onError: (err: any) => {
      setPasswordError(err.response?.data?.message || "Failed to change password")
    }
  })

  // Populate edit fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditFirstName(profile.firstName || "")
      setEditLastName(profile.lastName || "")
    }
  }, [profile])

  useEffect(() => {
    if (profileError) {
      router.push("/login")
    }
  }, [profileError, router])

  // Auto-select first org if none selected
  useEffect(() => {
    if (orgs && orgs.length > 0 && !activeOrgId) {
      setActiveOrgId(orgs[0].id)
    }
  }, [orgs, activeOrgId])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await api.post("/auth/logout")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("activeOrganizationId")
      router.push("/login")
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleChangePassword = () => {
    setPasswordError("")
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }
    changePasswordMutation.mutate({ currentPassword, newPassword })
  }

  const handleMfaSetup = async () => {
    setMfaError("")
    setMfaMessage("")
    try {
      const response = await api.post("/auth/mfa/setup")
      const { qrCodeUrl, secret } = response.data.data
      setMfaQrCode(qrCodeUrl)
      setMfaSecret(secret)
      setIsMfaSetupMode(true)
    } catch (err: any) {
      setMfaError(err.response?.data?.message || "Failed to initiate MFA setup")
    }
  }

  const handleMfaVerify = async () => {
    setMfaError("")
    try {
      const response = await api.post("/auth/mfa/verify-setup", { code: mfaCode })
      setMfaMessage(response.data.data.message)
      setIsMfaSetupMode(false)
      setMfaCode("")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    } catch (err: any) {
      setMfaError(err.response?.data?.message || "Invalid code. Please try again.")
    }
  }

  if (isLoadingProfile || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeOrg = orgs?.find((o: any) => o.id === activeOrgId)
  const isOwnerOrAdmin = activeOrg?.role === "OWNER" || activeOrg?.role === "ADMIN"

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AuthForge</h1>
            </div>
            
            {/* Org Switcher */}
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-3 px-4 py-2 bg-black/40 hover:bg-black/60 transition-colors rounded-xl border border-white/5">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-medium">{activeOrg ? activeOrg.name : "Personal Workspace"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {activeOrg ? activeOrg.role : "OWNER"}
                </span>
              </div>
              
              <div className="absolute top-full left-0 mt-2 w-64 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 pt-2">Organizations</div>
                {orgs?.map((org: any) => (
                  <button 
                    key={org.id}
                    onClick={() => setActiveOrgId(org.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${activeOrgId === org.id ? 'bg-primary/20 text-white' : 'hover:bg-white/5'}`}
                  >
                    {org.name}
                    {activeOrgId === org.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <button 
                  onClick={() => setIsCreateOrgModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/5 transition-colors flex items-center gap-2 text-primary"
                >
                  <Plus className="w-4 h-4" /> Create Organization
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!profile.isEmailVerified && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400">
                <Mail className="w-3.5 h-3.5" />
                Email not verified
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-full border border-white/5">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                {profile.firstName ? profile.firstName[0] : profile.email[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium">{profile.email}</span>
            </div>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-2">
            {activeOrg && (
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 ${activeTab === "members" ? "bg-white/5" : "text-muted-foreground hover:text-white"}`}
                onClick={() => setActiveTab("members")}
              >
                <Users className="w-4 h-4" /> Members
              </Button>
            )}
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-2 ${activeTab === "profile" ? "bg-white/5" : "text-muted-foreground hover:text-white"}`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="w-4 h-4" /> Profile
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-2 ${activeTab === "security" ? "bg-white/5" : "text-muted-foreground hover:text-white"}`}
              onClick={() => setActiveTab("security")}
            >
              <Shield className="w-4 h-4" /> Security
            </Button>
          </div>
          
          {/* Content */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Members Tab */}
            {activeTab === "members" && activeOrg && (
              <Card className="glass-card border-none bg-black/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>Manage who has access to {activeOrg.name}</CardDescription>
                  </div>
                  {isOwnerOrAdmin && (
                    <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" /> Invite Member
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 bg-white/5 rounded" />
                      <div className="h-12 bg-white/5 rounded" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {members?.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                              {member.firstName ? member.firstName[0] : member.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm flex items-center gap-2">
                                {member.firstName} {member.lastName}
                                {profile.id === member.id && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                          <div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                              member.role === 'OWNER' ? 'bg-purple-500/20 text-purple-400' :
                              member.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-white/10 text-white/70'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "members" && !activeOrg && (
              <div className="text-center py-20 glass-card rounded-2xl">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-semibold mb-2">No Organization Selected</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Create a new organization to start collaborating with your team using role-based access control.</p>
                <Button size="lg" onClick={() => setIsCreateOrgModalOpen(true)} className="gap-2">
                  <Plus className="w-5 h-5" /> Create your first Organization
                </Button>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card className="glass-card border-none bg-black/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Edit Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editFirstName">First Name</Label>
                        <Input 
                          id="editFirstName"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          placeholder="John"
                          className="bg-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editLastName">Last Name</Label>
                        <Input 
                          id="editLastName"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          placeholder="Doe"
                          className="bg-white/5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={profile.email} disabled className="bg-white/5 opacity-60" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    
                    {profileMessage && (
                      <div className="p-3 text-sm bg-green-500/10 border border-green-500/20 rounded-md text-green-400">
                        {profileMessage}
                      </div>
                    )}

                    <Button 
                      onClick={() => updateProfileMutation.mutate({ firstName: editFirstName, lastName: editLastName })} 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Change Password */}
                <Card className="glass-card border-none bg-black/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input 
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-white/5 max-w-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="bg-white/5 max-w-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="bg-white/5 max-w-md"
                      />
                    </div>

                    {passwordError && (
                      <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-md text-red-400 max-w-md">
                        {passwordError}
                      </div>
                    )}
                    {passwordMessage && (
                      <div className="p-3 text-sm bg-green-500/10 border border-green-500/20 rounded-md text-green-400 max-w-md">
                        {passwordMessage}
                      </div>
                    )}

                    <Button 
                      onClick={handleChangePassword} 
                      disabled={changePasswordMutation.isPending || !currentPassword || !newPassword}
                    >
                      {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                  </CardContent>
                </Card>

                {/* MFA Section */}
                <Card className="glass-card border-none bg-black/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      {profile.mfaEnabled 
                        ? "Two-factor authentication is enabled on your account" 
                        : "Add an extra layer of security by enabling two-factor authentication"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.mfaEnabled ? (
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-green-400">MFA Enabled</p>
                          <p className="text-xs text-muted-foreground">Your account is protected with TOTP-based two-factor authentication.</p>
                        </div>
                      </div>
                    ) : isMfaSetupMode ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg space-y-4">
                          <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
                          <div className="flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mfaQrCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Or enter this secret manually:</p>
                            <code className="text-xs bg-black/60 px-3 py-1.5 rounded font-mono text-primary select-all">{mfaSecret}</code>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mfaVerifyCode">Enter the 6-digit code from your app</Label>
                          <Input 
                            id="mfaVerifyCode"
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            className="bg-white/5 max-w-xs text-center tracking-widest text-lg font-mono"
                          />
                        </div>

                        {mfaError && (
                          <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
                            {mfaError}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button onClick={handleMfaVerify} disabled={mfaCode.length !== 6}>
                            Verify & Enable MFA
                          </Button>
                          <Button variant="ghost" onClick={() => { setIsMfaSetupMode(false); setMfaCode(""); setMfaError(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {mfaMessage && (
                          <div className="p-3 text-sm bg-green-500/10 border border-green-500/20 rounded-md text-green-400 mb-4">
                            {mfaMessage}
                          </div>
                        )}
                        {mfaError && (
                          <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-md text-red-400 mb-4">
                            {mfaError}
                          </div>
                        )}
                        <Button onClick={handleMfaSetup} className="gap-2">
                          <Lock className="w-4 h-4" /> Enable Two-Factor Authentication
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Org Modal */}
      <AnimatePresence>
        {isCreateOrgModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md glass-card bg-black p-6 relative">
              <button onClick={() => setIsCreateOrgModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-4">Create Organization</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Acme Corp" className="bg-white/5" />
                </div>
                <Button className="w-full" onClick={() => createOrgMutation.mutate(newOrgName)} disabled={!newOrgName || createOrgMutation.isPending}>
                  {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md glass-card bg-black p-6 relative">
              <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-4">Invite Member to {activeOrg?.name}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Email Address</label>
                  <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white/5 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="MEMBER">Member (Can view resources)</option>
                    <option value="ADMIN">Admin (Can manage users)</option>
                    <option value="OWNER">Owner (Full control)</option>
                  </select>
                </div>
                <Button className="w-full" onClick={() => inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole })} disabled={!inviteEmail || inviteMemberMutation.isPending}>
                  {inviteMemberMutation.isPending ? "Sending Invite..." : "Invite Member"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
