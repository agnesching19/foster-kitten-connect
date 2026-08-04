import { Card, CardHeader } from "@/components/foster/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvImportCard } from "./CsvImportCard";
import { GoogleSheetsImportCard } from "./GoogleSheetsImportCard";

export type ImportMethod = "sheets" | "csv";

export function ImportDataCard({
  method,
  onMethodChange,
}: {
  method: ImportMethod;
  onMethodChange: (method: ImportMethod) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Import data"
        subtitle="Bring records into the app from a current-format Google Sheet, CSV files, or a ZIP backup."
      />

      <Tabs value={method} onValueChange={(value) => onMethodChange(value as ImportMethod)}>
        <TabsList className="grid h-11 w-full grid-cols-2 bg-gray-100 sm:w-auto">
          <TabsTrigger value="sheets" className="min-h-9">
            Google Sheets
          </TabsTrigger>
          <TabsTrigger value="csv" className="min-h-9">
            CSV or ZIP
          </TabsTrigger>
        </TabsList>
        <TabsContent forceMount value="sheets" className="mt-4 data-[state=inactive]:hidden">
          <GoogleSheetsImportCard embedded />
        </TabsContent>
        <TabsContent forceMount value="csv" className="mt-4 data-[state=inactive]:hidden">
          <CsvImportCard embedded />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
