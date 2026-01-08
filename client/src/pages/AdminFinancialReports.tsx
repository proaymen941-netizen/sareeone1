import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, TrendingDown, BarChart3, 
  PieChart, Download, Calendar, Filter, FileText,
  CreditCard, Wallet, Receipt, Banknote, Shield,
  Users, Store, Truck, Target, Award, Clock,
  RefreshCw, ChevronDown, ChevronUp, CheckCircle,
  XCircle, AlertCircle, FileSpreadsheet, Printer,
  Eye, EyeOff, Lock, Unlock, Bell, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface FinancialReport {
  id: string;
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  commissionEarned: number;
  deliveryFees: number;
  platformFees: number;
  restaurantPayments: number;
  driverPayments: number;
  withdrawalRequests: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  taxAmount: number;
  transactionCount: number;
  averageOrderValue: number;
  growthRate: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: 'commission' | 'delivery_fee' | 'withdrawal' | 'refund' | 'bonus' | 'penalty';
  amount: number;
  description: string;
  fromUser: string;
  toUser: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userType: 'driver' | 'restaurant';
  userName: string;
  amount: number;
  method: 'bank_transfer' | 'wallet' | 'cash';
  accountDetails: any;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  processedAt: string | null;
  adminNotes: string;
}

export default function AdminFinancialReports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');

  // جلب التقارير المالية
  const { data: financialReports, isLoading } = useQuery<FinancialReport[]>({
    queryKey: ['/api/admin/financial-reports', dateRange, reportType],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        type: reportType
      });
      const response = await apiRequest('GET', `/api/admin/financial-reports?${params}`);
      return response.json();
    },
  });

  // جلب المعاملات
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      });
      const response = await apiRequest('GET', `/api/admin/transactions?${params}`);
      return response.json();
    },
  });

  // جلب طلبات السحب
  const { data: withdrawalRequests } = useQuery<WithdrawalRequest[]>({
    queryKey: ['/api/admin/withdrawal-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/withdrawal-requests');
      return response.json();
    },
  });

  // بيانات الرسوم البيانية
  const revenueData = financialReports?.map(report => ({
    name: report.period,
    revenue: report.totalRevenue,
    profit: report.netProfit,
    commission: report.commissionEarned
  })) || [];

  const expenseDistribution = [
    { name: 'دفع المطاعم', value: financialReports?.[0]?.restaurantPayments || 0, color: '#0088FE' },
    { name: 'دفع السائقين', value: financialReports?.[0]?.driverPayments || 0, color: '#00C49F' },
    { name: 'الضرائب', value: financialReports?.[0]?.taxAmount || 0, color: '#FFBB28' },
    { name: 'مصروفات المنصة', value: financialReports?.[0]?.platformFees || 0, color: '#FF8042' },
  ];

  const transactionTypes = [
    { type: 'العمولة', count: transactions?.filter(t => t.type === 'commission').length || 0, amount: transactions?.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0) || 0 },
    { type: 'رسوم التوصيل', count: transactions?.filter(t => t.type === 'delivery_fee').length || 0, amount: transactions?.filter(t => t.type === 'delivery_fee').reduce((sum, t) => sum + t.amount, 0) || 0 },
    { type: 'السحب', count: transactions?.filter(t => t.type === 'withdrawal').length || 0, amount: transactions?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0) || 0 },
    { type: 'المكافآت', count: transactions?.filter(t => t.type === 'bonus').length || 0, amount: transactions?.filter(t => t.type === 'bonus').reduce((sum, t) => sum + t.amount, 0) || 0 },
  ];

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        format
      });
      const response = await apiRequest('GET', `/api/admin/export-financial-report?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      await apiRequest('PUT', `/api/admin/withdrawal-requests/${withdrawalId}/approve`);
      toast({ title: 'تم الموافقة على السحب', description: 'تمت الموافقة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في الموافقة', variant: 'destructive' });
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
    try {
      await apiRequest('PUT', `/api/admin/withdrawal-requests/${withdrawalId}/reject`, { reason });
      toast({ title: 'تم رفض السحب', description: 'تم الرفض بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في الرفض', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">التقارير المالية</h1>
            <p className="text-muted-foreground">تحليل شامل للأداء المالي والعمولات</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={exportFormat} onValueChange={(val: any) => setExportFormat(val)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصدير التقرير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => handleExportReport(exportFormat)} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="custom">مخصص</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>من تاريخ</Label>
              <DatePicker
                date={dateRange.from}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
              />
            </div>
            
            <div>
              <Label>إلى تاريخ</Label>
              <DatePicker
                date={dateRange.to}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={() => queryClient.invalidateQueries()} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                تحديث البيانات
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-foreground">
                  {financialReports?.[0]?.totalRevenue?.toLocaleString() || 0} ريال
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+12%</span>
                  <span className="text-xs text-muted-foreground">عن الشهر الماضي</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <p className="text-2xl font-bold text-foreground">
                  {financialReports?.[0]?.netProfit?.toLocaleString() || 0} ريال
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+8%</span>
                  <span className="text-xs text-muted-foreground">عن الشهر الماضي</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">العمولات المكتسبة</p>
                <p className="text-2xl font-bold text-foreground">
                  {financialReports?.[0]?.commissionEarned?.toLocaleString() || 0} ريال
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+15%</span>
                  <span className="text-xs text-muted-foreground">عن الشهر الماضي</span>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">متوسط قيمة الطلب</p>
                <p className="text-2xl font-bold text-foreground">
                  {financialReports?.[0]?.averageOrderValue?.toLocaleString() || 0} ريال
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+5%</span>
                  <span className="text-xs text-muted-foreground">عن الشهر الماضي</span>
                </div>
              </div>
              <Receipt className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="withdrawals">طلبات السحب</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات والمبيعات</CardTitle>
              <CardDescription>تطور الإيرادات خلال الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="profit" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value.toLocaleString()} ريال`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أداء المعاملات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionTypes.map((type, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{type.type}</span>
                        <span className="font-bold">{type.amount.toLocaleString()} ريال</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{type.count} معاملة</span>
                        <span>{((type.amount / (transactionTypes.reduce((sum, t) => sum + t.amount, 0) || 1)) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(type.amount / (transactionTypes.reduce((sum, t) => sum + t.amount, 0) || 1)) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
              <CardDescription>جميع المعاملات المالية خلال الفترة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم المرجع</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>من</TableHead>
                      <TableHead>إلى</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.reference}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.type === 'commission' ? 'عمولة' :
                             transaction.type === 'delivery_fee' ? 'رسوم توصيل' :
                             transaction.type === 'withdrawal' ? 'سحب' :
                             transaction.type === 'bonus' ? 'مكافأة' : transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{transaction.amount.toLocaleString()} ريال</TableCell>
                        <TableCell>{transaction.fromUser}</TableCell>
                        <TableCell>{transaction.toUser}</TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {transaction.status === 'completed' ? 'مكتمل' :
                             transaction.status === 'pending' ? 'معلق' : 'فاشل'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleString('ar')}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>طلبات السحب</CardTitle>
              <CardDescription>إدارة طلبات السحب من السائقين والمطاعم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>طريقة السحب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الطلب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalRequests?.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.userType === 'driver' ? 'سائق' : 'مطعم'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{request.amount.toLocaleString()} ريال</TableCell>
                        <TableCell>
                          {request.method === 'bank_transfer' ? 'تحويل بنكي' :
                           request.method === 'wallet' ? 'محفظة' : 'كاش'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'pending' ? 'secondary' :
                            request.status === 'processed' ? 'outline' : 'destructive'
                          }>
                            {request.status === 'approved' ? 'موافق عليه' :
                             request.status === 'pending' ? 'معلق' :
                             request.status === 'processed' ? 'تم المعالجة' : 'مرفوض'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.requestedAt).toLocaleString('ar')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveWithdrawal(request.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWithdrawal(request);
                                    setShowWithdrawalDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(request);
                                setShowWithdrawalDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Advanced Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>مقارنة الإيرادات</CardTitle>
                <CardDescription>مقارنة الإيرادات بين الفترات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="الإيرادات" />
                      <Bar dataKey="profit" fill="#82ca9d" name="الربح" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معدل النمو</CardTitle>
                <CardDescription>تطور النمو المالي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                      <Line type="monotone" dataKey="profit" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">معدل النمو الشهري</p>
                <p className="text-2xl font-bold text-green-500">+{financialReports?.[0]?.growthRate || 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">عدد المعاملات</p>
                <p className="text-2xl font-bold text-blue-500">{financialReports?.[0]?.transactionCount || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">متوسط العمولة</p>
                <p className="text-2xl font-bold text-purple-500">
                  {((financialReports?.[0]?.commissionEarned || 0) / (financialReports?.[0]?.transactionCount || 1)).toFixed(2)} ريال
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">الضرائب</p>
                <p className="text-2xl font-bold text-orange-500">{financialReports?.[0]?.taxAmount?.toLocaleString() || 0} ريال</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showTransactionDetails} onOpenChange={setShowTransactionDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل المعاملة</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>رقم المرجع</Label>
                  <p className="font-medium">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <Label>النوع</Label>
                  <p className="font-medium">
                    {selectedTransaction.type === 'commission' ? 'عمولة' :
                     selectedTransaction.type === 'delivery_fee' ? 'رسوم توصيل' :
                     selectedTransaction.type === 'withdrawal' ? 'سحب' :
                     selectedTransaction.type === 'bonus' ? 'مكافأة' : selectedTransaction.type}
                  </p>
                </div>
                <div>
                  <Label>المبلغ</Label>
                  <p className="font-bold text-lg">{selectedTransaction.amount.toLocaleString()} ريال</p>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Badge variant={
                    selectedTransaction.status === 'completed' ? 'default' :
                    selectedTransaction.status === 'pending' ? 'secondary' :
                    'destructive'
                  }>
                    {selectedTransaction.status === 'completed' ? 'مكتمل' :
                     selectedTransaction.status === 'pending' ? 'معلق' : 'فاشل'}
                  </Badge>
                </div>
                <div>
                  <Label>من</Label>
                  <p>{selectedTransaction.fromUser}</p>
                </div>
                <div>
                  <Label>إلى</Label>
                  <p>{selectedTransaction.toUser}</p>
                </div>
                <div className="col-span-2">
                  <Label>الوصف</Label>
                  <p>{selectedTransaction.description}</p>
                </div>
                <div className="col-span-2">
                  <Label>التاريخ</Label>
                  <p>{new Date(selectedTransaction.createdAt).toLocaleString('ar')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
