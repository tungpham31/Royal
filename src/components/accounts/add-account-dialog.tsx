"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Home } from "lucide-react";
import { AddRealEstateDialog } from "./add-real-estate-dialog";

interface AddAccountDialogProps {
  onOpenPlaidLink: () => void;
  plaidReady: boolean;
}

export function AddAccountDialog({
  onOpenPlaidLink,
  plaidReady,
}: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [showRealEstateForm, setShowRealEstateForm] = useState(false);

  const handleFinancialAccountClick = () => {
    setOpen(false);
    onOpenPlaidLink();
  };

  const handleRealEstateClick = () => {
    setShowRealEstateForm(true);
  };

  const handleRealEstateClose = () => {
    setShowRealEstateForm(false);
    setOpen(false);
  };

  if (showRealEstateForm) {
    return (
      <AddRealEstateDialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleRealEstateClose();
          }
        }}
        onBack={() => setShowRealEstateForm(false)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!plaidReady}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <button
            onClick={handleFinancialAccountClick}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <div className="font-medium">Financial Account</div>
              <div className="text-sm text-muted-foreground mt-1">
                Connect bank, credit card, or investment account
              </div>
            </div>
          </button>
          <button
            onClick={handleRealEstateClick}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Home className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-center">
              <div className="font-medium">Real Estate</div>
              <div className="text-sm text-muted-foreground mt-1">
                Track property value manually
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
