import { createFileRoute } from "@tanstack/react-router";
import { MonarcaApp } from "@/components/game/MonarcaApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <MonarcaApp />;
}
