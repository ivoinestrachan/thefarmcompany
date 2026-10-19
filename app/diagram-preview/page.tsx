import WigglerDiagram from "@/components/WigglerDiagram";

export default function DiagramPreview() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-char px-6">
      <div className="w-full max-w-5xl">
        <WigglerDiagram className="h-auto w-full" />
      </div>
    </main>
  );
}
