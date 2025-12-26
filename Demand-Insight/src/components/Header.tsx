import { BarChart3, History, LogIn, LogOut, Trash2, RotateCcw, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoryItem, DashboardSnapshot } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  history: HistoryItem[];
  isLoggedIn: boolean;
  onLogin: (u: string, p: string) => boolean;
  onLogout: () => void;
  onClearHistory: () => void;
  onRestore: (snapshot: DashboardSnapshot) => void;
}

export const Header = ({ history, isLoggedIn, onLogin, onLogout, onClearHistory, onRestore }: HeaderProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLogin = () => {
    const success = onLogin(username, password);
    if (success) {
      setIsLoginOpen(false);
      setUsername("");
      setPassword("");
      toast({ title: "Login Successful", description: "Welcome back, Admin." });
    } else {
      toast({ title: "Login Failed", description: "Invalid credentials.", variant: "destructive" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto h-16 flex items-center justify-between px-4 md:px-8">
        
        {/* Logo Area */}
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            Demand<span className="text-primary">IQ</span>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* 🔒 SECURE: History is only visible when logged in */}
          {isLoggedIn && (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors relative">
                    <History className="h-5 w-5" />
                    {history.length > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <div className="flex items-center justify-between">
                      <SheetTitle>Session History</SheetTitle>
                      {history.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearHistory} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                    <SheetDescription>
                      Click an item to <strong>restore</strong> its results.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                        <History className="h-8 w-8 mb-2 opacity-20" />
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {history.map((item) => (
                          <button 
                            key={item.id} 
                            onClick={() => {
                              if (item.snapshot) onRestore(item.snapshot);
                            }}
                            disabled={!item.snapshot}
                            className={cn(
                              "w-full flex gap-3 p-3 rounded-lg border text-left transition-all hover:bg-slate-50",
                              !item.snapshot ? "opacity-70 cursor-default" : "cursor-pointer hover:border-primary/30 hover:shadow-sm",
                              "border-transparent"
                            )}
                          >
                            <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", 
                              item.status === 'success' ? "bg-emerald-500" : 
                              item.status === 'error' ? "bg-red-500" : "bg-blue-500"
                            )} />
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium leading-none text-slate-900">{item.action}</p>
                                {item.snapshot && <RotateCcw className="h-3 w-3 text-slate-400" />}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{item.details}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              
              <div className="h-6 w-px bg-slate-200 mx-1" />
            </>
          )}
          
          {/* Login / Profile Logic */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3 pl-1 animate-in fade-in duration-300">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-700">Admin User</p>
                <p className="text-xs text-slate-500">Pro License</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
                <LogOut className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          ) : (
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Login to DemandIQ</DialogTitle>
                  <DialogDescription>
                    Enter your administrator credentials to access the dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                       <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input 
                          id="username" 
                          placeholder="username" 
                          className="pl-9"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                       <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input 
                          id="password" 
                          type="password" 
                          className="pl-9"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleLogin}>Sign In</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
};