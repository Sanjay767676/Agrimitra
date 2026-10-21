export interface SchemeItem {
  id: string;
  title: string;
  state: string;
  category: string;
  url: string;
  applicationUrl?: string;
  description: string;
}

class SchemesService {
  async list(params: { state?: string; category?: string; q?: string } = {}): Promise<SchemeItem[]> {
    const qs = new URLSearchParams();
    if (params.state) qs.set("state", params.state);
    if (params.category) qs.set("category", params.category);
    if (params.q) qs.set("q", params.q);

    const resp = await fetch(`/api/schemes${qs.toString() ? `?${qs.toString()}` : ""}`);
    if (!resp.ok) throw new Error("Failed to fetch schemes");
    const data = await resp.json();
    return (data.schemes || []) as SchemeItem[];
  }
}

export const schemesService = new SchemesService();
