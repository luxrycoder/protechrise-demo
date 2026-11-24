import { serializeJsonLd } from "@/lib/json-ld";

/** A <script type="application/ld+json"> tag. "<" is escaped by serializeJsonLd so content cannot close the tag. */
export function JsonLd({ data }: { readonly data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
