import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstall } from "./InstallProvider";

const BENEFITS = [
  "Opens in its own window, without browser tabs or an address bar.",
  "One tap from your home screen or desktop to live radio and TV.",
  "Loads faster on return visits. Pages you've already opened still work offline.",
  "Your favorites and recently played stay on this device.",
];

/** Contextual, dismissible banner. Policy (timing, cooldowns, installed state) lives in lib/install.ts. */
export function InstallBanner() {
  const { bannerVisible, hasNativePrompt, install, openDialog, dismissBanner } = useInstall();
  if (!bannerVisible) return null;
  return (
    <section
      aria-label="Install ONEYA"
      className="border-t border-border bg-card px-3 py-2.5 md:px-6"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <img src="/brand/logo-96.png" alt="" width={36} height={36} className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install ONEYA</p>
          <p className="text-xs text-muted-foreground">
            Open live radio and TV in one tap, in its own window.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (hasNativePrompt ? void install() : openDialog())}
          className="h-11 shrink-0 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {hasNativePrompt ? "Install" : "How to install"}
        </button>
        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Not now, dismiss install suggestion"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
    </section>
  );
}

/** Explains the benefits and gives platform-correct steps, or says plainly when the browser can't install. */
export function InstallDialog() {
  const { dialogOpen, closeDialog, guide, hasNativePrompt, install, standalone, installed } =
    useInstall();
  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Install ONEYA</DialogTitle>
          <DialogDescription>
            {standalone || installed
              ? "ONEYA is already installed on this device."
              : "Add ONEYA to your device for quicker access to live radio and TV."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          {BENEFITS.map((b) => (
            <li key={b} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {b}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Live streams still need an internet connection.
        </p>

        {!standalone && !installed && (
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            {hasNativePrompt ? (
              <p className="text-sm">Your browser can install ONEYA with one tap.</p>
            ) : guide.canInstall ? (
              <>
                <p className="text-sm font-medium">How to install on this device</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
                  {guide.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </>
            ) : null}
            {guide.note && <p className="mt-2 text-xs text-muted-foreground">{guide.note}</p>}
          </div>
        )}

        <DialogFooter>
          {hasNativePrompt && !standalone && (
            <button
              type="button"
              onClick={() => {
                closeDialog();
                void install();
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-4" aria-hidden /> Install ONEYA
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
