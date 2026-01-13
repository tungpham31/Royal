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
import { Plus, Building2, Home, Landmark, TrendingUp } from "lucide-react";
import { AddRealEstateDialog } from "./add-real-estate-dialog";
import { AddLoanDialog } from "./add-loan-dialog";
import { AddInvestmentDialog } from "./add-investment-dialog";

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
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

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

  const handleLoanClick = () => {
    setShowLoanForm(true);
  };

  const handleLoanClose = () => {
    setShowLoanForm(false);
    setOpen(false);
  };

  const handleInvestmentClick = () => {
    setShowInvestmentForm(true);
  };

  const handleInvestmentClose = () => {
    setShowInvestmentForm(false);
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

  if (showLoanForm) {
    return (
      <AddLoanDialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleLoanClose();
          }
        }}
        onBack={() => setShowLoanForm(false)}
      />
    );
  }

  if (showInvestmentForm) {
    return (
      <AddInvestmentDialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleInvestmentClose();
          }
        }}
        onBack={() => setShowInvestmentForm(false)}
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          <button
            onClick={handleFinancialAccountClick}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">Financial Account</div>
              <div className="text-xs text-muted-foreground mt-1">
                Connect via Plaid
              </div>
            </div>
          </button>
          <button
            onClick={handleInvestmentClick}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">Investment</div>
              <div className="text-xs text-muted-foreground mt-1">
                401(k), IRA, brokerage
              </div>
            </div>
          </button>
          <button
            onClick={handleRealEstateClick}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Home className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">Real Estate</div>
              <div className="text-xs text-muted-foreground mt-1">
                Track property value
              </div>
            </div>
          </button>
          <button
            onClick={handleLoanClick}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <Landmark className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">Loan</div>
              <div className="text-xs text-muted-foreground mt-1">
                Mortgage, auto, other
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
