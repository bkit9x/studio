
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Tags, Wallet, Settings, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { useFirebaseData } from '@/hooks/use-firebase-data';


const NavItem = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center gap-1 text-xs transition-colors w-16",
      isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
    )}>
      <Icon className="h-6 w-6" />
      <span>{label}</span>
    </Link>
  );
};

export function BottomNav() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { wallets } = useFirebaseData();
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);

  const pathname = usePathname();
  
  // This effect syncs the selected wallet from localStorage to the state
  // to ensure the "Add Transaction" sheet opens with the correct wallet selected.
  useEffect(() => {
    if (pathname === '/') {
      const storedId = localStorage.getItem('selectedWalletId');
      if (storedId && wallets.some(w => w.id === storedId)) {
        setSelectedWalletId(storedId);
      } else if (wallets.length > 0) {
        setSelectedWalletId(wallets[0].id);
      }
    }
  }, [pathname, wallets]);


  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t bg-background/95 backdrop-blur-sm">
        <nav className="flex h-full items-center justify-around">
          <NavItem href="/" icon={LayoutGrid} label="Tổng quan" />
          <NavItem href="/tags" icon={Tags} label="Hạng mục" />

          <div className="w-16 flex justify-center">
            <button
              onClick={() => setIsSheetOpen(true)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg -translate-y-4 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Thêm giao dịch mới"
            >
              <Plus className="h-8 w-8" />
            </button>
          </div>

          <NavItem href="/wallets" icon={Wallet} label="Ví" />
          <NavItem href="/settings" icon={Settings} label="Cài đặt" />
        </nav>
      </div>
      <AddTransactionSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        selectedWalletId={selectedWalletId}
      />
    </>
  );
}
