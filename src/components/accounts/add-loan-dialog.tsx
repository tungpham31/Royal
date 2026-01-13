"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createManualLoan } from "@/actions/manual-assets";
import { LoanSubtype, LOAN_SUBTYPE_LABELS } from "@/types/database";

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

export function AddLoanDialog({
  open,
  onOpenChange,
  onBack,
}: AddLoanDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subtype, setSubtype] = useState<LoanSubtype>("mortgage");
  const [balance, setBalance] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !balance) {
      return;
    }

    setLoading(true);
    try {
      const result = await createManualLoan({
        name: name.trim(),
        subtype,
        balance: parseFloat(balance.replace(/,/g, "")),
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        // Reset form
        setName("");
        setSubtype("mortgage");
        setBalance("");
      } else {
        console.error("Error creating loan:", result.error);
      }
    } catch (error) {
      console.error("Error creating loan:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string) => {
    // Remove non-numeric characters except decimal
    const numeric = val.replace(/[^0-9.]/g, "");
    // Format with commas
    const parts = numeric.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setBalance(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>Add Loan</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Home Mortgage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtype">Loan Type</Label>
              <Select
                value={subtype}
                onValueChange={(val) => setSubtype(val as LoanSubtype)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(LOAN_SUBTYPE_LABELS) as [
                      LoanSubtype,
                      string
                    ][]
                  ).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="balance"
                  className="pl-7"
                  placeholder="250,000"
                  value={balance}
                  onChange={handleBalanceChange}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !balance}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
