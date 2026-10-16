"use client";
import { Alert, Button } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="error-page">
      <h1>Data demo belum dapat dimuat</h1>
      <Alert error>
        Terjadi masalah pada tampilan. Coba muat kembali tanpa menghapus arsip
        demo Anda.
      </Alert>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
