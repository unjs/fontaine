export interface ClientConfig {
  endpoint: string;
  apiKey: string;
}

export interface IngestionPayload {
  content: string;
  metadata: Record<string, any>;
}

export class SdkClient {
  constructor(private config: ClientConfig) {}

  async ingest(agentId: string, payload: IngestionPayload): Promise<{ success: boolean }> {
    const response = await fetch(`${this.config.endpoint}/ingest`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ agentId, ...payload }),
    });
    return response.json();
  }

  async recall(agentId: string, query: string): Promise<{ result: string }> {
    const response = await fetch(`${this.config.endpoint}/recall`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ agentId, query }),
    });
    return response.json();
  }
}
