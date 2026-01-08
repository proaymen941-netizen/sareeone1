import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, Lock, Key, UserCheck, AlertTriangle, 
  History, Eye, EyeOff, Bell, CheckCircle,
  XCircle, RefreshCw, Users, Globe, Smartphone,
  Mail, Phone, MapPin, Calendar, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SecuritySettings {
  require2FA: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  passwordRequireNumbers: boolean;
  passwordExpiryDays: number;
  ipWhitelist: string[];
  enableAuditLog: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface LoginAttempt {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  timestamp: string;
  location: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  timestamp: string;
}

export default function AdminSecurity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    require2FA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordExpiryDays: 90,
    ipWhitelist: [],
    enableAuditLog: true,
    emailNotifications: true,
    smsNotifications: false
  });
  const [newIP, setNewIP] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  // جلب إعدادات الأمان
  const { data: securityData } = useQuery<SecuritySettings>({
    queryKey: ['/api/admin/security-settings'],
    onSuccess: (data) => {
      if (data) setSecuritySettings(data);
    },
  });

  // جلب محاولات الدخول
  const { data: loginAttempts } = useQuery<LoginAttempt[]>({
    queryKey: ['/api/admin/login-attempts'],
  });

  // جلب سجل التدقيق
  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs'],
  });

  // تحديث إعدادات الأمان
  const updateSecuritySettings = useMutation({
    mutationFn: async (settings: SecuritySettings) => {
      const response = await apiRequest('PUT', '/api/admin/security-settings', settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security-settings'] });
      toast({ title: 'تم تحديث إعدادات الأمان' });
    },
  });

  const handleSaveSettings = () => {
    updateSecuritySettings.mutate(securitySettings);
  };

  const handleAddIP = () => {
    if (newIP && !securitySettings.ipWhitelist.includes(newIP)) {
      setSecuritySettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIP]
      }));
      setNewIP('');
    }
  };

  const handleRemoveIP = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip)
    }));
  };

  const failedAttempts = loginAttempts?.filter(attempt => attempt.status === 'failed').length || 0;
  const suspiciousActivity = loginAttempts?.filter(attempt => 
    attempt.status === 'failed' && 
    new Date(attempt.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">الأمان والمصادقة</h1>
            <p className="text-muted-foreground">إدارة أمان النظام والمصادقة المتقدمة</p>
          </div>
        </div>
        
        <Button onClick={handleSaveSettings} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          حفظ التغييرات
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={failedAttempts > 10 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">محاولات دخول فاشلة</p>
                <p className={`text-2xl font-bold ${failedAttempts > 10 ? 'text-red-600' : 'text-foreground'}`}>
                  {failedAttempts}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${failedAttempts > 10 ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نشاط مشبوه (24h)</p>
                <p className="text-2xl font-bold">{suspiciousActivity}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">سجل التدقيق</p>
                <p className="text-2xl font-bold">{auditLogs?.length || 0}</p>
              </div>
              <History className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">إعدادات الأمان</TabsTrigger>
          <TabsTrigger value="authentication">المصادقة</TabsTrigger>
          <TabsTrigger value="monitoring">المراقبة</TabsTrigger>
          <TabsTrigger value="audit">سجل التدقيق</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان العامة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="require2fa" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    تفعيل التحقق الثنائي (2FA)
                  </div>
                  <p className="text-sm text-muted-foreground">مطلوب لجميع المستخدمين</p>
                </Label>
                <Switch
                  id="require2fa"
                  checked={securitySettings.require2FA}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, require2FA: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="sessionTimeout">مهلة الجلسة (دقائق)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="maxLoginAttempts">أقصى محاولات دخول قبل القفل</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="passwordMinLength">الحد الأدنى لطول كلمة المرور</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  min="6"
                  max="32"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="passwordRequireSpecial" className="cursor-pointer">
                  اشتراط رموز خاصة
                </Label>
                <Switch
                  id="passwordRequireSpecial"
                  checked={securitySettings.passwordRequireSpecial}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordRequireSpecial: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="passwordRequireNumbers" className="cursor-pointer">
                  اشتراط أرقام
                </Label>
                <Switch
                  id="passwordRequireNumbers"
                  checked={securitySettings.passwordRequireNumbers}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordRequireNumbers: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="passwordExpiryDays">مدة صلاحية كلمة المرور (أيام)</Label>
                <Input
                  id="passwordExpiryDays"
                  type="number"
                  min="30"
                  max="365"
                  value={securitySettings.passwordExpiryDays}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>قائمة IP المسموح بها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل عنوان IP (مثال: 192.168.1.1)"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                  />
                  <Button onClick={handleAddIP}>إضافة</Button>
                </div>
                
                <div className="space-y-2">
                  {securitySettings.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{ip}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIP(ip)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {securitySettings.ipWhitelist.length === 0 && (
                    <p className="text-center text-muted-foreground">لا توجد عناوين IP مضافة</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          {/* Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle>مصادقة متعددة العوامل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">المصادقة عبر التطبيق</h4>
                    <p className="text-sm text-muted-foreground">استخدام تطبيق مثل Google Authenticator</p>
                  </div>
                  <Button variant="outline" onClick={() => setShow2FASetup(true)}>
                    إعداد
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">المصادقة عبر SMS</h4>
                    <p className="text-sm text-muted-foreground">إرسال رمز التحقق عبر الرسائل النصية</p>
                  </div>
                  <Switch
                    checked={securitySettings.smsNotifications}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">المصادقة عبر البريد الإلكتروني</h4>
                    <p className="text-sm text-muted-foreground">إرسال رمز التحقق عبر البريد الإلكتروني</p>
                  </div>
                  <Switch
                    checked={securitySettings.emailNotifications}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Login Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle>مراقبة محاولات الدخول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>عنوان IP</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginAttempts?.slice(0, 10).map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>{attempt.username}</TableCell>
                        <TableCell>{attempt.ipAddress}</TableCell>
                        <TableCell>{attempt.location}</TableCell>
                        <TableCell>
                          <Badge variant={attempt.status === 'success' ? 'default' : 'destructive'}>
                            {attempt.status === 'success' ? 'ناجح' : 'فاشل'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(attempt.timestamp).toLocaleString('ar')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle>سجل التدقيق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>التفاصيل</TableHead>
                      <TableHead>عنوان IP</TableHead>
                      <TableHead>الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString('ar')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعداد التحقق الثنائي</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded-lg mb-4">
                {/* QR Code would go here */}
                <div className="text-center">
                  <Key className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">مسح رمز QR</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                1. افتح تطبيق المصادقة (Google Authenticator)
                <br />
                2. اضفف على رمز +
                <br />
                3. امسح رمز QR أعلاه
                <br />
                4. أدخل الرمز المكون من 6 أرقام
              </p>
            </div>
            
            <div>
              <Label htmlFor="verificationCode">رمز التحقق</Label>
              <Input
                id="verificationCode"
                placeholder="أدخل الرمز المكون من 6 أرقام"
                maxLength={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FASetup(false)}>
              إلغاء
            </Button>
            <Button onClick={() => {
              toast({ title: 'تم إعداد التحقق الثنائي بنجاح' });
              setShow2FASetup(false);
            }}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
