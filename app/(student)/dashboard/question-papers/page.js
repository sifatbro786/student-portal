import { MaterialsPage } from "@/components/student/MaterialsPage.js";

export const metadata = { title: "Question papers" };

export default function QuestionPapersPage() {
    return (
        <MaterialsPage
            type="question_paper"
            title="Question papers"
            intro="Past and practice papers for your class."
            empty="No question papers shared yet"
        />
    );
}
