/** Įterpia schema.org JSON-LD. Duomenys yra mūsų pačių, ne vartotojo įvestis. */
export function JsonLd({ schema }: { schema: unknown | unknown[] }) {
  const payload = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {payload.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
