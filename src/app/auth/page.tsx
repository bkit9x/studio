
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, getAdditionalUserInfo, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/contexts/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { seedInitialDataForUser } from '@/hooks/use-firebase-data';


const authSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
});

type AuthFormValues = z.infer<typeof authSchema>;

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.596,44,30.168,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


export default function AuthPage() {
  const { auth, isLoading } = useFirebase();
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
    try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: 'Thành công!', description: 'Đã đăng nhập thành công.' });
        router.push('/');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Đăng nhập thất bại', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: AuthFormValues) => {
    setIsSubmitting(true);
     try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const additionalInfo = getAdditionalUserInfo(userCredential);

        if (additionalInfo?.isNewUser) {
          await seedInitialDataForUser(userCredential.user.uid);
        }

        toast({ title: 'Đăng ký thành công', description: 'Chào mừng bạn đến với FinTrack!' });
        router.push('/');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Đăng ký thất bại', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePasswordReset = async () => {
    const email = form.getValues('email');
    if (!email) {
        form.setError('email', { type: 'manual', message: 'Vui lòng nhập email để reset mật khẩu.'});
        return;
    }
    
    setIsSubmitting(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setIsSent(true);
        toast({ title: 'Đã gửi link', description: 'Vui lòng kiểm tra email để nhận link reset mật khẩu.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gửi link thất bại', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const additionalInfo = getAdditionalUserInfo(userCredential);

        if (additionalInfo?.isNewUser) {
          await seedInitialDataForUser(userCredential.user.uid);
          toast({ title: 'Chào mừng bạn!', description: 'Tài khoản của bạn đã được tạo.' });
        } else {
          toast({ title: 'Chào mừng trở lại!', description: 'Đã đăng nhập thành công.' });
        }
        router.push('/');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Đăng nhập Google thất bại', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isPageBusy = isSubmitting || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">FinTrack</CardTitle>
          <CardDescription>
            {isPageBusy ? 'Đang xử lý...' : isSent ? 'Kiểm tra hộp thư của bạn' : 'Đăng nhập hoặc đăng ký để tiếp tục'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSent ? (
             <div className="text-center">
                <p>Một email đã được gửi đến <span className="font-bold">{form.getValues('email')}</span>.</p>
                <p className="mt-2">Nhấp vào liên kết trong email để hoàn tất.</p>
             </div>
          ) : (
          <>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isPageBusy}>
                <GoogleIcon /> Đăng nhập với Google
            </Button>

            <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Hoặc</span></div></div>

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
                    <Button type="submit" className="w-full" disabled={isPageBusy}>
                        {isPageBusy ? 'Đang xử lý...' : 'Đăng nhập'}
                    </Button>
                    </form>
                    <Button variant="link" className="w-full px-0 font-normal text-sm mt-2" onClick={handlePasswordReset} disabled={isPageBusy}>
                        Quên mật khẩu?
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
                    <Button type="submit" className="w-full" disabled={isPageBusy}>
                        {isPageBusy ? 'Đang xử lý...' : 'Đăng ký'}
                    </Button>
                    </form>
                </TabsContent>
                </Form>
            </Tabs>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
