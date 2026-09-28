import { MaterialsPage } from "@/components/student/MaterialsPage.js";

export const metadata = { title: "Notes" };

export default function NotesPage() {
    return (
        <MaterialsPage
            type="note"
            title="Notes"
            intro="Read them here — they open in the viewer, stamped with your name."
            empty="No notes shared with your batch yet"
        />
    );
}
