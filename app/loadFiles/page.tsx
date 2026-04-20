import GetFiles from "../components/getFiles";

export default function FilesPage() {
  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_45%,#f8fafc_100%)] px-4 py-12">
      <GetFiles />
    </div>
  );
}
