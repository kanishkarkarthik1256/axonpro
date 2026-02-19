import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { clearAllData, getBankAccounts, saveBankAccounts } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Shield,
  Trash2,
  Save,
  Moon,
  Sun,
  AlertTriangle,
  Building,
  Plus,
  CreditCard,
  Globe
} from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { preferredCurrency, setPreferredCurrency, currencies } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState(getBankAccounts(user?.id));
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: user?.name || '',
    currency: 'USD',
    type: 'checking',
    nickname: ''
  });

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      const result = updateProfile({ name });
      
      if (result.success) {
        toast({ title: 'Profile updated successfully!' });
      } else {
        toast({ title: 'Failed to update profile', variant: 'destructive' });
      }
      
      setIsSaving(false);
    }, 500);
  };

  const handleAddAccount = () => {
    if (!newAccount.bankName || !newAccount.accountNumber) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const account = {
      id: 'bank_' + Date.now(),
      ...newAccount,
      createdAt: new Date().toISOString()
    };

    const updatedAccounts = [...bankAccounts, account];
    setBankAccounts(updatedAccounts);
    saveBankAccounts(user?.id, updatedAccounts);

    toast({ title: 'Bank account added successfully!' });

    setNewAccount({
      bankName: '',
      accountNumber: '',
      accountHolder: user?.name || '',
      currency: 'USD',
      type: 'checking',
      nickname: ''
    });
    setAddAccountOpen(false);
  };

  const handleDeleteAccount = (accountId) => {
    const updatedAccounts = bankAccounts.filter(acc => acc.id !== accountId);
    setBankAccounts(updatedAccounts);
    saveBankAccounts(user?.id, updatedAccounts);
    toast({ title: 'Bank account removed' });
  };

  const handleResetApp = () => {
    clearAllData();
    logout();
    navigate('/login');
    toast({ 
      title: 'App Reset Complete',
      description: 'All data has been cleared. Please register again.',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="mt-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Building className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Bank Accounts</h2>
          </div>
          <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Bank Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input
                    placeholder="e.g., Chase, HSBC, Barclays"
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({...newAccount, bankName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    placeholder="Enter account number"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="Account holder name"
                    value={newAccount.accountHolder}
                    onChange={(e) => setNewAccount({...newAccount, accountHolder: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={newAccount.currency} 
                      onValueChange={(val) => setNewAccount({...newAccount, currency: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select 
                      value={newAccount.type} 
                      onValueChange={(val) => setNewAccount({...newAccount, type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nickname (Optional)</Label>
                  <Input
                    placeholder="e.g., My Main Account"
                    value={newAccount.nickname}
                    onChange={(e) => setNewAccount({...newAccount, nickname: e.target.value})}
                  />
                </div>

                <Button variant="gradient" className="w-full" onClick={handleAddAccount}>
                  Add Bank Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No bank accounts added yet</p>
            <p className="text-sm">Add your first bank account to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {account.nickname || account.bankName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {account.bankName} • ****{account.accountNumber.slice(-4)} • {account.currency}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Remove Bank Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this bank account? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteAccount(account.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferred Currency Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-accent flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Preferred Currency</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select your preferred display currency. All balances and totals will be shown in this currency.
          </p>
          <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Theme Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
              </p>
            </div>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>
      </div>

      {/* Security Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-destructive flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Security & Data</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-secondary rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Data Storage</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All data is stored locally in your browser. Clearing browser data or using a different device will result in data loss.
                </p>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4" />
                Reset App & Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Your account information</li>
                    <li>All wallet balances (fiat and crypto)</li>
                    <li>Bank accounts</li>
                    <li>Transaction history</li>
                    <li>FX optimization history</li>
                    <li>All other stored data</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetApp}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4 text-foreground">About Axon</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>Your Currency, Our Clarity</p>
          <p>A cross-border payments simulation platform.</p>
        </div>
      </div>
    </div>
  );
}