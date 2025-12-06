using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;

namespace DDAC_Backend.Services
{
    public static class PdfGenerator
    {
        static PdfGenerator()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public static byte[] GeneratePrescriptionPdf(
            string patientName,
            string doctorName,
            string date,
            string medicine,
            string dosage,
            string? notes
        )
        {
            var darkBlue = "#1E3A8A";
            var lightBlue = "#F0F4FF";

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);
                    page.Size(PageSizes.A4);

                    // ===========================
                    // HEADER
                    // ===========================
                    page.Header().Column(header =>
                    {
                        header.Spacing(5);

                        // Title Row (Title + Logo)
                        header.Item().Row(row =>
                        {
                            // Left: Title Text
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("MediConnect")
                                    .FontSize(22)
                                    .Bold()
                                    .FontColor(darkBlue);

                                col.Item().Text("Prescription Document")
                                    .FontSize(12)
                                    .FontColor("#666");
                            });

                            // Right: Placeholder Logo (remove if unwanted)
                            row.ConstantItem(80).Height(50).Border(1).Padding(5)
                                .AlignCenter()
                                .AlignMiddle()
                                .Text("Logo")
                                .FontSize(10)
                                .FontColor("#999");
                        });

                        // Patient + Doctor Info
                        header.Item().Column(info =>
                        {
                            info.Spacing(2);
                            info.Item().Text($"Date: {date}").FontSize(12).Bold();
                            info.Item().Text($"Doctor: {doctorName}").FontSize(12);
                            info.Item().Text($"Patient: {patientName}").FontSize(12);
                        });

                        header.Item().PaddingTop(8).LineHorizontal(1);
                    });

                    // ===========================
                    // CONTENT SECTION
                    // ===========================
                    page.Content().Column(content =>
                    {
                        content.Spacing(20);

                        // Blue Title Box
                        content.Item().Background(lightBlue).Padding(15).Border(1).Column(section =>
                        {
                            section.Spacing(8);

                            section.Item().Text("Prescription Details")
                                .FontSize(16)
                                .Bold()
                                .FontColor(darkBlue);

                            section.Item().Text($"Medicine: {medicine}").FontSize(12);
                            section.Item().Text($"Dosage: {dosage}").FontSize(12);

                            if (!string.IsNullOrWhiteSpace(notes))
                                section.Item().Text($"Notes: {notes}").FontSize(12);
                        });

                        // Signature Block
                        content.Item().AlignRight().Column(sig =>
                        {
                            sig.Spacing(5);

                            sig.Item().Text("_________________________").FontSize(12);
                            sig.Item().Text("Doctor's Signature").FontSize(10).FontColor("#666");
                        });
                    });

                    // ===========================
                    // FOOTER
                    // ===========================
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("© MediConnect ").FontSize(10);
                        x.CurrentPageNumber().FontSize(10);
                    });
                });
            });

            return document.GeneratePdf();
        }

    }
}
