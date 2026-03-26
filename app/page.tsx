import AntiguaApp from "@/components/AntiguaApp";

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY ?? "";
  return <AntiguaApp apiKey={apiKey} />;
}
