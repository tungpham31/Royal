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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateAssetValue } from "@/actions/manual-assets";

interface UpdateValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  currentValue: number;
}

function formatCurrency(val: string) {
  const numeric = val.replace(/[^0-9.]/g, "");
  const parts = numeric.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function UpdateValueDialog({
  open,
  onOpenChange,
  accountId,
  currentValue,
}: UpdateValueDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(formatCurrency(currentValue.toString()));
  const [notes, setNotes] = useState("");

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValue(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value) {
      return;
    }

    setLoading(true);
    try {
      const numericValue = parseFloat(value.replace(/,/g, ""));
      const result = await updateAssetValue(
        accountId,
        numericValue,
        notes.trim() || undefined
      );

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        setNotes("");
      } else {
        console.error("Error updating value:", result.error);
      }
    } catch (error) {
      console.error("Error updating value:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Value</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">New Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="value"
                  className="pl-7"
                  placeholder="500,000"
                  value={value}
                  onChange={handleValueChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Updated based on Zillow estimate"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
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
            <Button type="submit" disabled={loading || !value}>
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
