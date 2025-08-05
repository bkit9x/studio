
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/contexts/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const authSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const handleLogin = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      toast({ variant: 'destructive', title: 'Đăng nhập thất bại', description: error.message });
    } else {
      toast({ title: 'Thành công!', description: 'Đã đăng nhập thành công.' });
      router.push('/');
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp(data);
    if (error) {
      toast({ variant: 'destructive', title: 'Đăng ký thất bại', description: error.message });
    } else {
      setIsSent(true);
      toast({ title: 'Xác nhận email', description: 'Vui lòng kiểm tra email của bạn để xác nhận đăng ký.' });
    }
    setIsSubmitting(false);
  };
  
  const handleMagicLink = async () => {
    const email = form.getValues('email');
    if (!email) {
        form.setError('email', { type: 'manual', message: 'Vui lòng nhập email.'});
        return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/`,
        },
    });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Gửi link thất bại', description: error.message });
    } else {
      setIsSent(true);
      toast({ title: 'Đã gửi link', description: 'Vui lòng kiểm tra email để nhận link đăng nhập.' });
    }
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">FinTrack</CardTitle>
          <CardDescription>
            {isSent ? 'Kiểm tra hộp thư của bạn' : 'Đăng nhập hoặc đăng ký để tiếp tục'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
             <div className="text-center">
                <p>Một email đã được gửi đến <span className="font-bold">{form.getValues('email')}</span>.</p>
                <p className="mt-2">Nhấp vào liên kết trong email để hoàn tất.</p>
             </div>
          ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>
            <Form {...form}>
              <TabsContent value="login">
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="email@example.com" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Mật khẩu</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                  </Button>
                </form>
                <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Hoặc</span></div></div>
                <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={isSubmitting}>
                    Đăng nhập với Magic Link
                </Button>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="email@example.com" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Mật khẩu</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                     {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                  </Button>
                </form>
              </TabsContent>
            </Form>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

