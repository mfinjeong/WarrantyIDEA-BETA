"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  ActionMenu,
  Button,
  Empty,
  PageHeading,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import { dateLabel } from "@/lib/format";

export function NotificationsPage({ admin = false }: { admin?: boolean }) {
  const { state, repository } = useDemo();
  const [tab, setTab] = useState("all");
  if (!state) return <Skeleton />;
  const all = state.notifications
    .filter((n) => n.audience === (admin ? "admin" : "buyer"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = all.filter((n) => !n.readAt).length;
  const visible = all.filter((n) => tab === "all" || !n.readAt);
  return (
    <>
      <PageHeading
        eyebrow="KABAR TERBARU"
        title="Notifikasi"
        description={`${unread} belum dibaca · Pengingat dan aktivitas demo Anda.`}
      >
        <Button
          variant="secondary"
          disabled={!unread}
          onClick={() => repository.markAllRead(admin ? "admin" : "buyer")}
        >
          <CheckCheck size={18} />
          Tandai semua dibaca
        </Button>
      </PageHeading>
      <Tabs
        items={[
          { value: "all", label: `Semua (${all.length})` },
          { value: "unread", label: `Belum dibaca (${unread})` },
        ]}
        value={tab}
        onChange={setTab}
      />
      <section className="panel">
        {visible.length ? (
          visible.map((n) => {
            const id = n.href?.split("/").pop();
            const missing =
              n.href?.includes("/warranties/") || n.href?.includes("/reviews/")
                ? !state.warranties.some((w) => w.id === id)
                : false;
            return (
              <article
                className={`notification-item ${!n.readAt ? "is-unread" : ""}`}
                key={n.id}
              >
                <span className="notification-icon">
                  <Bell size={20} />
                </span>
                <div className="notification-content">
                  {!n.readAt && (
                    <span className="unread-label">BELUM DIBACA</span>
                  )}
                  {n.href && !missing ? (
                    <Link
                      href={n.href}
                      onClick={() => void repository.markRead(n.id, true)}
                    >
                      <h2>{n.title}</h2>
                      <p>{n.body}</p>
                    </Link>
                  ) : (
                    <>
                      <h2>{n.title}</h2>
                      <p>{n.body}</p>
                      {missing && <p>Garansi sudah dihapus.</p>}
                    </>
                  )}
                  <time dateTime={n.createdAt}>
                    {dateLabel(n.createdAt.slice(0, 10))}
                  </time>
                </div>
                <ActionMenu label={`Aksi notifikasi ${n.title}`}>
                  <button onClick={() => repository.markRead(n.id, !n.readAt)}>
                    Tandai {n.readAt ? "belum dibaca" : "dibaca"}
                  </button>
                </ActionMenu>
              </article>
            );
          })
        ) : (
          <Empty
            title={
              tab === "unread" ? "Semua sudah terbaca" : "Belum ada kabar baru"
            }
            description={
              tab === "unread"
                ? "Anda sudah mengikuti seluruh aktivitas demo."
                : "Notifikasi demo akan tampil di sini."
            }
          />
        )}
      </section>
    </>
  );
}
