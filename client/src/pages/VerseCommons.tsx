import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Gamepad2, Users, Send, Globe, Pencil, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { publishMeshEvent } from "@/lib/meshEvents";

type World = { id: string; title: string; kind: string; status: string; route: string; connections: string[] };
type Room = { id: string; name: string; description: string; worldId: string | null };
type Explorer = { id: string; displayName: string; joinedRoomIds: string[] };
type Post = { id: string; roomId: string; worldId: string | null; message: string; createdAt: string; author: string };
type CommonsState = { me: Explorer; worlds: World[]; rooms: Room[]; posts: Post[]; scope: string };

async function readState(): Promise<CommonsState> {
  const response = await fetch("/api/verse-commons/state", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error("Community backend unavailable (" + response.status + ")");
  return response.json();
}
async function writeData(path: string, body: object) {
  const response = await fetch("/api/verse-commons/" + path, {
    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not save changes");
  return result;
}

export default function VerseCommons() {
  const [location, navigate] = useLocation();
  const [data, setData] = useState<CommonsState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(() => new URLSearchParams(window.location.search).get("room") || "commons");

  useEffect(() => {
    setSelectedRoomId(new URLSearchParams(window.location.search).get("room") || "commons");
  }, [location]);

  useEffect(() => {
    let active = true;
    readState().then((result) => {
      if (active) { setData(result); setName(result.me.displayName); }
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : String(cause));
    });
    return () => { active = false; };
  }, []);

  const room = data?.rooms.find((item) => item.id === selectedRoomId) || data?.rooms[0];
  const currentWorld = data?.worlds.find((item) => item.id === room?.worldId);
  const messages = data?.posts.filter((post) => post.roomId === room?.id) || [];
  const isJoined = !!room && !!data?.me.joinedRoomIds.includes(room.id);

  async function mutate(path: string, body: object) {
    setError(""); setBusy(true);
    try {
      await writeData(path, body);
      const refreshed = await readState();
      setData(refreshed);
      setName(refreshed.me.displayName);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally { setBusy(false); }
  }

  async function share() {
    if (!room || !text.trim()) return;
    const ok = await mutate("posts", { roomId: room.id, message: text.trim(), worldId: selectedWorld || room.worldId || null });
    if (ok) { setText(""); setSelectedWorld(""); }
  }

  function openWorld(world: World) {
    void publishMeshEvent({
      source: "verse-commons", type: "game.portal.entered", topic: "world:" + world.id,
      payload: { worldId: world.id, fromRoom: room?.id || "commons", targetRoute: world.route },
    });
    navigate(world.route);
  }

  function changeRoom(next: string) { navigate("/verse-commons?room=" + encodeURIComponent(next)); }

  return (
    <main className="mx-auto max-w-6xl px-3 sm:px-6 py-5 pb-28 space-y-6" data-testid="verse-commons">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">YOU-N-I-VERSE · Community + Worlds</p>
        <h1 className="text-3xl font-semibold">Verse Commons</h1>
        <p className="text-sm text-muted-foreground">
          One entry point to the Human Design community, game rooms, and connected worlds.
        </p>
      </header>

      {error && <div role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</div>}
      {!data ? (
        <p role="status">{error ? "Community is unavailable. Games and Human Design remain accessible through the app menu." : "Connecting to the Verse Commons backend…"}</p>
      ) : (
        <>
          <section aria-label="Player identity" className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <Users className="h-5 w-5" />
            {!editingName ? (
              <>
                <span className="text-sm">Playing as <strong>{data.me.displayName}</strong></span>
                <Button variant="ghost" size="sm" onClick={() => setEditingName(true)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
              </>
            ) : (
              <>
                <Input aria-label="Display name" value={name} maxLength={32} onChange={(event) => setName(event.target.value)} className="w-44" />
                <Button size="sm" disabled={busy} onClick={async () => { if (await mutate("profile", { displayName: name })) setEditingName(false); }}>Save name</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingName(false)}>Cancel</Button>
              </>
            )}
            <span className="text-xs text-muted-foreground">Guest identity stays with this browser; no account sign-in yet.</span>
          </section>

          <section aria-labelledby="portals-heading" className="space-y-3">
            <div className="flex items-center gap-2"><Globe className="h-5 w-5" /><h2 id="portals-heading" className="text-xl font-semibold">Connected worlds</h2></div>
            <p className="text-sm text-muted-foreground">Each world has an address, community room, and navigation links to other worlds. These are portals, not shared game saves yet.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.worlds.map((world) => (
                <Card key={world.id} className="min-w-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {world.kind === "core" ? <BookOpen className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />}
                      {world.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{world.status === "starter-only" ? "Source files / not playable" : world.status === "browser-template" ? "Interactive browser template" : world.status === "runtime-dependent" ? "Requires staged Simlish assets" : "Integrated application"}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openWorld(world)}>{world.status === "browser-template" ? "Preview" : "Open"} <ArrowRight className="h-4 w-4 ml-1" /></Button>
                      {data.rooms.some((entry) => entry.worldId === world.id) && <Button size="sm" variant="outline" onClick={() => changeRoom("world:" + world.id)}>Community</Button>}
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="text-muted-foreground mr-1">Portals to</span>
                      {world.connections.map((id) => {
                        const destination = data.worlds.find((candidate) => candidate.id === id);
                        return destination && <button key={id} type="button" className="rounded border px-2 py-1 hover:bg-accent" onClick={() => openWorld(destination)}>{destination.title}</button>;
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="social-heading" className="space-y-4">
            <h2 id="social-heading" className="text-xl font-semibold">Community</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Community rooms">
              {data.rooms.map((item) => (
                <Button key={item.id} size="sm" variant={item.id === room?.id ? "default" : "outline"} onClick={() => changeRoom(item.id)}>{item.name}</Button>
              ))}
            </div>
            {room && (
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                  {currentWorld && <div><Button variant="outline" size="sm" onClick={() => openWorld(currentWorld)}>Enter {currentWorld.title} <ArrowRight className="h-3 w-3 ml-1" /></Button></div>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isJoined ? (
                    <Button disabled={busy} onClick={() => void mutate("join", { roomId: room.id })}>Join room</Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea aria-label="New community post" rows={3} maxLength={2000} placeholder="Share an idea, question, or world discovery…" value={text} onChange={(event) => setText(event.target.value)} />
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs text-muted-foreground" htmlFor="linked-world">Attach world</label>
                        <select id="linked-world" className="rounded border bg-background px-2 py-2 text-sm" value={selectedWorld} onChange={(event) => setSelectedWorld(event.target.value)}>
                          <option value="">Room's world / none</option>
                          {data.worlds.map((world) => <option key={world.id} value={world.id}>{world.title}</option>)}
                        </select>
                        <Button size="sm" disabled={busy || !text.trim()} onClick={() => void share()}><Send className="h-3 w-3 mr-1" /> Post</Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3" aria-label="Room posts">
                    {messages.length === 0 && <p className="text-sm text-muted-foreground">No posts in this room yet.</p>}
                    {messages.map((post) => {
                      const linked = data.worlds.find((world) => world.id === post.worldId);
                      return <article key={post.id} className="border-t pt-3 space-y-2">
                        <div className="text-xs text-muted-foreground"><strong>{post.author}</strong> · {new Date(post.createdAt).toLocaleString()}</div>
                        <p className="text-sm whitespace-pre-wrap break-words">{post.message}</p>
                        {linked && <Button size="sm" variant="outline" onClick={() => openWorld(linked)}>Visit {linked.title} <ArrowRight className="ml-1 h-3 w-3" /></Button>}
                      </article>;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-muted-foreground">Community posts are shared with users of this server. Guest sessions are not production accounts; moderation and verified authentication are required before a public launch.</p>
          </section>
        </>
      )}
    </main>
  );
}
