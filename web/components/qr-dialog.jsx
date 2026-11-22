"use client";

import { QrCode } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { qrImageSrc } from "@/lib/url";

export function QrDialog({ url, iconOnly = false }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={iconOnly ? "icon" : "default"}
            aria-label="Show QR code"
          />
        }
      >
        <QrCode className="size-4" />
        {iconOnly ? null : "QR"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>QR code</AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            {url}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center py-2">
          <img
            src={qrImageSrc(url)}
            alt={`QR code for ${url}`}
            width={220}
            height={220}
            className="rounded-lg bg-white p-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
